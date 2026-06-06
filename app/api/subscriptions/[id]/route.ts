// app/api/subscriptions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  cost: z.number().positive().optional(),
  billingCycle: z.enum(["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]).optional(),
  renewalDate: z.string().datetime().optional(),
  category: z.enum([
    "STREAMING", "SOFTWARE", "FITNESS", "EDUCATION",
    "FOOD", "FINANCE", "GAMING", "PRODUCTIVITY", "NEWS", "OTHER",
  ]).optional(),
  status: z.enum(["ACTIVE", "CANCELLED", "PAUSED"]).optional(),
  usageLevel: z.enum(["DAILY", "WEEKLY", "RARELY", "NEVER"]).optional(),
  goalId: z.string().nullable().optional(),
  notifyDaysBefore: z.number().int().min(1).max(30).optional(),
});

async function getOwned(id: string, userId: string) {
  return prisma.subscription.findFirst({ where: { id, userId } });
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sub = await getOwned(params.id, session.user.id);
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(sub);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await getOwned(params.id, session.user.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.subscription.update({
    where: { id: params.id },
    data: parsed.data,
    include: { goal: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await getOwned(params.id, session.user.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.subscription.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
