// app/api/scanning/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const surveySchema = z.object({
  entries: z.array(
    z.object({
      subscriptionId: z.string(),
      usageLevel: z.enum(["DAILY", "WEEKLY", "RARELY", "NEVER"]),
    }),
  ),
});

/** GET - returns current month survey status + rarely-used subscriptions */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const [survey, rarelyUsed] = await Promise.all([
      prisma.survey.findUnique({
        where: { userId_month_year: { userId: session.user.id, month, year } },
        include: { entries: { include: { subscription: true } } },
      }),
      prisma.subscription.findMany({
        where: {
          userId: session.user.id,
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
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = surveySchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 },
      );

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Upsert the survey
    const survey = await prisma.survey.upsert({
      where: { userId_month_year: { userId: session.user.id, month, year } },
      create: {
        userId: session.user.id,
        month,
        year,
        entries: {
          create: parsed.data.entries.map((e) => ({
            subscriptionId: e.subscriptionId,
            usageLevel: e.usageLevel,
           })),
        },
      },
      update: {},
      include: { entries: true },
    });

    // SECURE FIX: Fetch and verify only subscription IDs owned by the current user
    const ownedSubIds = new Set(
      (await prisma.subscription.findMany({
        where: { 
          id: { in: parsed.data.entries.map((e) => e.subscriptionId) }, 
          userId: session.user.id 
        },
        select: { id: true },
      })).map((s) => s.id),
    );

    // Update usageLevel ONLY on the verified, owned subscriptions
    await Promise.all(
      parsed.data.entries
        .filter((e) => ownedSubIds.has(e.subscriptionId))
        .map((e) =>
          prisma.subscription.update({
            where: { id: e.subscriptionId },
            data: { usageLevel: e.usageLevel },
          }),
        ),
    );

    // Fire "rarely used" notifications
    const rarely = parsed.data.entries.filter(
      (e) => e.usageLevel === "RARELY" || e.usageLevel === "NEVER",
    );
    if (rarely.length > 0) {
      const subs = await prisma.subscription.findMany({
        where: { id: { in: rarely.map((e) => e.subscriptionId) } },
      });
      const userId = session.user.id!; // Already checked above, safe to assert
      await prisma.notification.createMany({
        data: subs.map((s) => ({
          userId,
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