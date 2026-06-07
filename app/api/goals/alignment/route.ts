// app/api/goals/alignment/route.ts
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { analyzeGoalAlignment } from "@/lib/llm";

export async function GET() {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;

  const [subscriptions, goals] = await Promise.all([
    prisma.subscription.findMany({
      where: { userId: authResult.userId, status: "ACTIVE" },
    }),
    prisma.goal.findMany({
      where: { userId: authResult.userId, status: "ACTIVE" },
    }),
  ]);

  const results = await analyzeGoalAlignment(subscriptions as any, goals as any);

  return NextResponse.json(results);
}
