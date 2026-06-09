// app/api/goals/alignment/route.ts
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { analyzeGoalAlignment } from "@/lib/llm";

export async function GET() {
  try {
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

    // Cast to our types for the LLM helper
    const results = await analyzeGoalAlignment(subscriptions as any, goals as any);

    return NextResponse.json(results);
  } catch (error) {
    console.error("GET /api/goals/alignment failed:", error);
    return NextResponse.json({ error: "Failed to analyze goal alignment" }, { status: 500 });
  }
}