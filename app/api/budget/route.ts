// app/api/budget/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { toMonthly } from "@/lib/utils";

const schema = z.object({
  monthlyLimit: z.number().positive(),
  currency: z.string().default("USD"),
  alertAt: z.number().min(0.5).max(1).default(0.9),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [budget, subscriptions] = await Promise.all([
      prisma.budget.findUnique({ where: { userId: session.user.id } }),
      prisma.subscription.findMany({ where: { userId: session.user.id, status: "ACTIVE" } }),
    ]);

    const totalMonthly = subscriptions.reduce(
      (sum, s) => sum + toMonthly(s.cost, s.billingCycle as any),
      0
    );

    return NextResponse.json({ budget, totalMonthly, subscriptions });
  } catch (error) {
    console.error("GET /api/budget failed:", error);
    return NextResponse.json({ error: "Failed to fetch budget" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const budget = await prisma.budget.upsert({
      where: { userId: session.user.id },
      update: parsed.data,
      create: { userId: session.user.id, ...parsed.data },
    });

    return NextResponse.json(budget);
  } catch (error) {
    console.error("PUT /api/budget failed:", error);
    return NextResponse.json({ error: "Failed to update budget" }, { status: 500 });
  }
}
