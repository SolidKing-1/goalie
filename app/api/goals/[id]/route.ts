// app/api/goals/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireOwnership } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;

  const ownerResult = await requireOwnership(() =>
    prisma.goal.findFirst({ where: { id: params.id, userId: authResult.userId } }),
  );
  if ("error" in ownerResult) return ownerResult.error;

  await prisma.goal.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;

  const ownerResult = await requireOwnership(() =>
    prisma.goal.findFirst({ where: { id: params.id, userId: authResult.userId } }),
  );
  if ("error" in ownerResult) return ownerResult.error;

  const body = await req.json();
  const updated = await prisma.goal.update({
    where: { id: params.id },
    data: body,
  });

  return NextResponse.json(updated);
}
