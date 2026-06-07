// app/api/notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;

  const notifications = await prisma.notification.findMany({
    where: { userId: authResult.userId },
    include: { subscription: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(notifications);
}

/** PATCH /api/notifications - mark all as read */
export async function PATCH(req: NextRequest) {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;

  const body = await req.json();
  const ids: string[] = body.ids ?? [];

  if (ids.length > 0) {
    await prisma.notification.updateMany({
      where: { id: { in: ids }, userId: authResult.userId },
      data: { isRead: true },
    });
  } else {
    // Mark all as read
    await prisma.notification.updateMany({
      where: { userId: authResult.userId },
      data: { isRead: true },
    });
  }

  return NextResponse.json({ success: true });
}
