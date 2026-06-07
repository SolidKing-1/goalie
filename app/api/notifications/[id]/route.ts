// app/api/notifications/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, parseBody, requireOwnership } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  isRead: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;

  const ownerResult = await requireOwnership(() =>
    prisma.notification.findFirst({ where: { id: params.id, userId: authResult.userId } }),
  );
  if ("error" in ownerResult) return ownerResult.error;

  const bodyResult = await parseBody(req, schema);
  if ("error" in bodyResult) return bodyResult.error;

  const updated = await prisma.notification.update({
    where: { id: params.id },
    data: bodyResult.data,
  });

  return NextResponse.json(updated);
}
