// app/subscriptions/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubscriptionsList } from "@/components/subscriptions/SubscriptionsList";

export default async function SubscriptionsPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const [subscriptions, goals] = await Promise.all([
    prisma.subscription.findMany({
      where: { userId },
      include: { goal: true },
      orderBy: { renewalDate: "asc" },
    }),
    prisma.goal.findMany({ where: { userId, status: "ACTIVE" } }),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hand off the data directly to the client component list */}
      <SubscriptionsList
        initialSubscriptions={subscriptions as any}
        initialGoals={goals as any}
      />
    </div>
  );
}
