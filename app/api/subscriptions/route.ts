// app/api/subscriptions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  cost: z.number().positive(),
  currency: z.string().default("USD"),
  billingCycle: z.enum(["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]),
  renewalDate: z.string().datetime(),
  category: z.enum([
    "STREAMING", "SOFTWARE", "FITNESS", "EDUCATION",
    "FOOD", "FINANCE", "GAMING", "PRODUCTIVITY", "NEWS", "OTHER",
  ]),
  logoUrl: z.string().url().optional(),
  websiteUrl: z.string().url().optional(),
  notifyDaysBefore: z.number().int().min(1).max(30).default(3),
  goalId: z.string().optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscriptions = await prisma.subscription.findMany({
      where: { userId: session.user.id },
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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const subscription = await prisma.subscription.create({
      data: { ...parsed.data, userId: session.user.id },
      include: { goal: true },
    });

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    console.error("POST /api/subscriptions failed:", error);
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
  }
}
