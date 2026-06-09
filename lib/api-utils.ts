// lib/api-utils.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";

/**
 * Require an authenticated session. Returns the userId or an error response.
 */
export async function requireAuth(): Promise<
  { userId: string } | { error: NextResponse }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { userId: session.user.id };
}

/**
 * Parse and validate a request body against a Zod schema.
 * Returns the parsed data or an error response.
 */
export async function parseBody<T extends z.ZodTypeAny>(
  req: NextRequest,
  schema: T,
): Promise<{ data: z.infer<T> } | { error: NextResponse }> {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      error: NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 },
      ),
    };
  }
  return { data: parsed.data };
}

/**
 * Check that a record exists and belongs to the given user.
 * Uses a generic Prisma findFirst call pattern.
 * Returns the record or a 404 error response.
 */
export async function requireOwnership<T>(
  findFn: () => Promise<T | null>,
): Promise<{ record: T } | { error: NextResponse }> {
  const record = await findFn();
  if (!record) {
    return {
      error: NextResponse.json({ error: "Not found" }, { status: 404 }),
    };
  }
  return { record };
}
