// app/api/budget/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, parseBody } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { calculateTotalMonthly } from "@/lib/calculations";

const schema = z.object({
  monthlyLimit: z.number().positive(),
  currency: z.string().default("USD"),
  alertAt: z.number().min(0.5).max(1).default(0.9),
});

export async function GET() {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;

  const [budget, subscriptions] = await Promise.all([
    prisma.budget.findUnique({ where: { userId: authResult.userId } }),
    prisma.subscription.findMany({ where: { userId: authResult.userId, status: "ACTIVE" } }),
  ]);

  const totalMonthly = calculateTotalMonthly(subscriptions);

  return NextResponse.json({ budget, totalMonthly, subscriptions });
}

export async function PUT(req: NextRequest) {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;

  const bodyResult = await parseBody(req, schema);
  if ("error" in bodyResult) return bodyResult.error;

  const budget = await prisma.budget.upsert({
    where: { userId: authResult.userId },
    update: bodyResult.data,
    create: { userId: authResult.userId, ...bodyResult.data },
  });

  return NextResponse.json(budget);
}
