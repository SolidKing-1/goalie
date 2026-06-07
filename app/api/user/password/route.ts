// app/api/user/password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, parseBody } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});

export async function PATCH(req: NextRequest) {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;

  const bodyResult = await parseBody(req, schema);
  if ("error" in bodyResult) return bodyResult.error;

  const user = await prisma.user.findUnique({ where: { id: authResult.userId } });
  if (!user?.password) {
    return NextResponse.json({ error: "No password set (OAuth account)" }, { status: 400 });
  }

  const valid = await bcrypt.compare(bodyResult.data.currentPassword, user.password);
  if (!valid) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(bodyResult.data.newPassword, 12);
  await prisma.user.update({
    where: { id: authResult.userId },
    data: { password: hashed },
  });

  return NextResponse.json({ success: true });
}
