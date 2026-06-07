// app/api/user/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, parseBody } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(100),
});

export async function PATCH(req: NextRequest) {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;

  const bodyResult = await parseBody(req, schema);
  if ("error" in bodyResult) return bodyResult.error;

  const user = await prisma.user.update({
    where: { id: authResult.userId },
    data: { name: bodyResult.data.name },
    select: { id: true, name: true, email: true },
  });

  return NextResponse.json(user);
}
