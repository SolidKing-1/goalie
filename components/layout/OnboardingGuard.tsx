// components/layout/OnboardingGuard.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

/**
 * Server component that checks if user has completed onboarding.
 * Redirects to /onboarding if not completed.
 * Place this at the top of protected layouts.
 */
export async function OnboardingGuard() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingCompleted: true },
  });

  if (!user?.onboardingCompleted) {
    redirect("/onboarding");
  }

  return null;
}
