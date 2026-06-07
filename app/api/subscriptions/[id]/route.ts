// app/api/subscriptions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, parseBody, requireOwnership } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  SUBSCRIPTION_CATEGORIES,
  BILLING_CYCLES,
  SUBSCRIPTION_STATUSES,
  USAGE_LEVELS,
} from "@/lib/constants";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  cost: z.number().positive().optional(),
  billingCycle: z.enum(BILLING_CYCLES).optional(),
  renewalDate: z.string().datetime().optional(),
  category: z.enum(SUBSCRIPTION_CATEGORIES).optional(),
  status: z.enum(SUBSCRIPTION_STATUSES).optional(),
  usageLevel: z.enum(USAGE_LEVELS).optional(),
  goalId: z.string().nullable().optional(),
  notifyDaysBefore: z.number().int().min(1).max(30).optional(),
});

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;

  const ownerResult = await requireOwnership(() =>
    prisma.subscription.findFirst({ where: { id: params.id, userId: authResult.userId } }),
  );
  if ("error" in ownerResult) return ownerResult.error;

  return NextResponse.json(ownerResult.record);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;

  const ownerResult = await requireOwnership(() =>
    prisma.subscription.findFirst({ where: { id: params.id, userId: authResult.userId } }),
  );
  if ("error" in ownerResult) return ownerResult.error;

  const bodyResult = await parseBody(req, updateSchema);
  if ("error" in bodyResult) return bodyResult.error;

  const updated = await prisma.subscription.update({
    where: { id: params.id },
    data: bodyResult.data,
    include: { goal: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;

  const ownerResult = await requireOwnership(() =>
    prisma.subscription.findFirst({ where: { id: params.id, userId: authResult.userId } }),
  );
  if ("error" in ownerResult) return ownerResult.error;

  await prisma.subscription.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
