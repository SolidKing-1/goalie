// app/api/user/onboarding/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, parseBody } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  currency: z.string().length(3).default("USD"),
  monthlyBudget: z.number().positive("Budget must be greater than 0"),
});

export async function PATCH(req: NextRequest) {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;

  const bodyResult = await parseBody(req, schema);
  if ("error" in bodyResult) return bodyResult.error;

  // Mark user as onboarded
  const user = await prisma.user.update({
    where: { id: authResult.userId },
    data: { onboardingCompleted: true },
  });

  // Create budget if it doesn't exist
  const budget = await prisma.budget.upsert({
    where: { userId: authResult.userId },
    create: {
      userId: authResult.userId,
      currency: bodyResult.data.currency,
      monthlyLimit: bodyResult.data.monthlyBudget,
      alertAt: 0.9, // 90% threshold
    },
    update: {
      currency: bodyResult.data.currency,
      monthlyLimit: bodyResult.data.monthlyBudget,
    },
  });

  return NextResponse.json({
    success: true,
    user,
    budget,
  });
}
