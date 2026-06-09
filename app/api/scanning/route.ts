// app/api/scanning/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, parseBody } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { USAGE_LEVELS } from "@/lib/constants";
import { filterRarelyUsed } from "@/lib/calculations";

const surveySchema = z.object({
  entries: z.array(
    z.object({
      subscriptionId: z.string(),
      usageLevel: z.enum(USAGE_LEVELS),
    }),
  ),
});

/** GET - returns current month survey status + rarely-used subscriptions */
export async function GET() {
  try {
    const authResult = await requireAuth();
    if ("error" in authResult) return authResult.error;

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const [survey, rarelyUsed] = await Promise.all([
      prisma.survey.findUnique({
        where: { userId_month_year: { userId: authResult.userId, month, year } },
        include: { entries: { include: { subscription: true } } },
      }),
      prisma.subscription.findMany({
        where: {
          userId: authResult.userId,
          status: "ACTIVE",
          usageLevel: { in: ["RARELY", "NEVER"] },
        },
      }),
    ]);

    return NextResponse.json({ survey, rarelyUsed, month, year });
  } catch (error) {
    console.error("GET /api/scanning failed:", error);
    return NextResponse.json({ error: "Failed to fetch scanning data" }, { status: 500 });
  }
}

/** POST - submit monthly survey */
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth();
    if ("error" in authResult) return authResult.error;

    const bodyResult = await parseBody(req, surveySchema);
    if ("error" in bodyResult) return bodyResult.error;

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Upsert the survey records linked to the verified user
    const survey = await prisma.survey.upsert({
      where: { userId_month_year: { userId: authResult.userId, month, year } },
      create: {
        userId: authResult.userId,
        month,
        year,
        entries: {
          create: bodyResult.data.entries.map((e) => ({
            subscriptionId: e.subscriptionId,
            usageLevel: e.usageLevel,
          })),
        },
      },
      update: {},
      include: { entries: true },
    });

    // SECURITY RE-INFORCEMENT FROM MASTER:
    // Fetch and verify only subscription IDs actually owned by the current user
    const ownedSubIds = new Set(
      (await prisma.subscription.findMany({
        where: { 
          id: { in: bodyResult.data.entries.map((e) => e.subscriptionId) }, 
          userId: authResult.userId 
        },
        select: { id: true },
      })).map((s) => s.id),
    );

    // Update usageLevel ONLY on the verified, owned subscriptions
    await Promise.all(
      bodyResult.data.entries
        .filter((e) => ownedSubIds.has(e.subscriptionId))
        .map((e) =>
          prisma.subscription.update({
            where: { id: e.subscriptionId },
            data: { usageLevel: e.usageLevel },
          }),
        ),
    );

    // Fire "rarely used" notifications for matching user-owned records
    const rarely = bodyResult.data.entries
      .filter((e) => ownedSubIds.has(e.subscriptionId))
      .filter((e) => e.usageLevel === "RARELY" || e.usageLevel === "NEVER");

    if (rarely.length > 0) {
      const subs = await prisma.subscription.findMany({
        where: { id: { in: rarely.map((e) => e.subscriptionId) } },
      });
      
      await prisma.notification.createMany({
        data: subs.map((s) => ({
          userId: authResult.userId,
          subscriptionId: s.id,
          type: "RARELY_USED_ALERT" as const,
          title: `Rarely using ${s.name}?`,
          message: `You marked ${s.name} as ${s.usageLevel?.toLowerCase()} used. Consider cancelling to save $${s.cost}/month.`,
          scheduledFor: new Date(),
        })),
      });
    }

    return NextResponse.json(survey, { status: 201 });
  } catch (error) {
    console.error("POST /api/scanning failed:", error);
    return NextResponse.json({ error: "Failed to submit survey" }, { status: 500 });
  }
}