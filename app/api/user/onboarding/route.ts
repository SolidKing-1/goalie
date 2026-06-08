// app/api/user/onboarding/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  currency: z.string().length(3).default("USD"),
  monthlyBudget: z.number().positive("Budget must be greater than 0"),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Mark user as onboarded
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { onboardingCompleted: true },
    });

    // Create budget if it doesn't exist
    const budget = await prisma.budget.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        currency: parsed.data.currency,
        monthlyLimit: parsed.data.monthlyBudget,
        alertAt: 0.9, // 90% threshold
      },
      update: {
        currency: parsed.data.currency,
        monthlyLimit: parsed.data.monthlyBudget,
      },
    });

    return NextResponse.json({
      success: true,
      user,
      budget,
    });
  } catch (error) {
    console.error("PATCH /api/user/onboarding failed:", error);
    return NextResponse.json({ error: "Failed to complete onboarding" }, { status: 500 });
  }
}
