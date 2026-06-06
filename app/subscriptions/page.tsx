// app/subscriptions/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubscriptionsList } from "@/components/subscriptions/SubscriptionsList";
import { AddSubscriptionButton } from "@/components/subscriptions/AddSubscriptionButton";

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Subscriptions</h1>
          <p className="text-muted mt-1">{subscriptions.length} total · {subscriptions.filter(s => s.status === "ACTIVE").length} active</p>
        </div>
        <AddSubscriptionButton goals={goals as any} />
      </div>

      <SubscriptionsList subscriptions={subscriptions as any} goals={goals as any} />
    </div>
  );
}
