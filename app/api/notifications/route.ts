// app/api/notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  ids: z.array(z.string()).optional(),
});

export async function GET() {
  try {
    const authResult = await requireAuth();
    if ("error" in authResult) return authResult.error;

    const notifications = await prisma.notification.findMany({
      where: { userId: authResult.userId },
      include: { subscription: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("GET /api/notifications failed:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

/** PATCH /api/notifications - mark all as read */
export async function PATCH(req: NextRequest) {
  try {
    const authResult = await requireAuth();
    if ("error" in authResult) return authResult.error;

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    // Safely extract the ids using your master fallback logic
    const ids = parsed.data.ids ?? [];

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
  } catch (error) {
    console.error("PATCH /api/notifications failed:", error);
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}