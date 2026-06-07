// app/api/goals/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, parseBody } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { GOAL_CATEGORIES } from "@/lib/constants";

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(GOAL_CATEGORIES),
  targetDate: z.string().datetime().optional(),
});

export async function GET() {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;

  const goals = await prisma.goal.findMany({
    where: { userId: authResult.userId },
    include: { subscriptions: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(goals);
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;

  const bodyResult = await parseBody(req, createSchema);
  if ("error" in bodyResult) return bodyResult.error;

  const goal = await prisma.goal.create({
    data: { ...bodyResult.data, userId: authResult.userId },
  });

  return NextResponse.json(goal, { status: 201 });
}
