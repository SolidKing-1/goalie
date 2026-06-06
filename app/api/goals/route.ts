// app/api/goals/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeGoalAlignment } from "@/lib/llm";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(["CAREER", "EDUCATION", "HEALTH", "FINANCE", "LIFESTYLE", "OTHER"]),
  targetDate: z.string().datetime().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const goals = await prisma.goal.findMany({
    where: { userId: session.user.id },
    include: { subscriptions: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(goals);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const goal = await prisma.goal.create({
    data: { ...parsed.data, userId: session.user.id },
  });

  return NextResponse.json(goal, { status: 201 });
}
