// app/api/goals/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const goal = await prisma.goal.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.goal.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const goal = await prisma.goal.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const updated = await prisma.goal.update({
    where: { id: params.id },
    data: body,
  });

  return NextResponse.json(updated);
}
