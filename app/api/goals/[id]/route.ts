// app/api/goals/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireOwnership } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.enum(["CAREER", "EDUCATION", "HEALTH", "FINANCE", "LIFESTYLE", "OTHER"]).optional(),
  targetDate: z.string().datetime().optional(),
  status: z.enum(["ACTIVE", "ACHIEVED", "PAUSED"]).optional(),
});

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireAuth();
    if ("error" in authResult) return authResult.error;

    const ownerResult = await requireOwnership(() =>
      prisma.goal.findFirst({ where: { id: params.id, userId: authResult.userId } }),
    );
    if ("error" in ownerResult) return ownerResult.error;

    await prisma.goal.delete({ where: { id: params.id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/goals/[id] failed:", error);
    return NextResponse.json({ error: "Failed to delete goal" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireAuth();
    if ("error" in authResult) return authResult.error;

    const ownerResult = await requireOwnership(() =>
      prisma.goal.findFirst({ where: { id: params.id, userId: authResult.userId } }),
    );
    if ("error" in ownerResult) return ownerResult.error;

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const updated = await prisma.goal.update({
      where: { id: params.id },
      data: parsed.data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/goals/[id] failed:", error);
    return NextResponse.json({ error: "Failed to update goal" }, { status: 500 });
  }
}