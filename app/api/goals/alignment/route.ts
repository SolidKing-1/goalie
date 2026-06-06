// app/api/goals/alignment/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeGoalAlignment } from "@/lib/llm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [subscriptions, goals] = await Promise.all([
    prisma.subscription.findMany({
      where: { userId: session.user.id, status: "ACTIVE" },
    }),
    prisma.goal.findMany({
      where: { userId: session.user.id, status: "ACTIVE" },
    }),
  ]);

  // Cast to our types for the LLM helper
  const results = await analyzeGoalAlignment(subscriptions as any, goals as any);

  return NextResponse.json(results);
}
