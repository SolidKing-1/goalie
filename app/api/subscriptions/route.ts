// app/api/subscriptions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, parseBody } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { SUBSCRIPTION_CATEGORIES, BILLING_CYCLES } from "@/lib/constants";

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  cost: z.number().positive(),
  currency: z.string().default("USD"),
  billingCycle: z.enum(BILLING_CYCLES),
  renewalDate: z.string().datetime(),
  category: z.enum(SUBSCRIPTION_CATEGORIES),
  logoUrl: z.string().url().optional(),
  websiteUrl: z.string().url().optional(),
  notifyDaysBefore: z.number().int().min(1).max(30).default(3),
  goalId: z.string().optional(),
});

export async function GET() {
  try {
    const authResult = await requireAuth();
    if ("error" in authResult) return authResult.error;

    const subscriptions = await prisma.subscription.findMany({
      where: { userId: authResult.userId },
      include: { goal: true },
      orderBy: { renewalDate: "asc" },
    });

    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error("GET /api/subscriptions failed:", error);
    return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth();
    if ("error" in authResult) return authResult.error;

    const bodyResult = await parseBody(req, createSchema);
    if ("error" in bodyResult) return bodyResult.error;

    const subscription = await prisma.subscription.create({
      data: { ...bodyResult.data, userId: authResult.userId },
      include: { goal: true },
    });

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    console.error("POST /api/subscriptions failed:", error);
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
  }
}