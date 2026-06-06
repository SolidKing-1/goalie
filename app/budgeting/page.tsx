// app/budgeting/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toMonthly, formatCurrency } from "@/lib/utils";
import { BudgetManager } from "@/components/budget/BudgetManager";

export default async function BudgetingPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const [budget, subscriptions] = await Promise.all([
    prisma.budget.findUnique({ where: { userId } }),
    prisma.subscription.findMany({
      where: { userId, status: "ACTIVE" },
      orderBy: { cost: "desc" },
    }),
  ]);

  const totalMonthly = subscriptions.reduce(
    (sum, s) => sum + toMonthly(s.cost, s.billingCycle as any),
    0
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Budget</h1>
        <p className="text-muted mt-1">
          Track your monthly subscription spending against your budget
        </p>
      </div>
      <BudgetManager
        budget={budget as any}
        subscriptions={subscriptions as any}
        totalMonthly={totalMonthly}
      />
    </div>
  );
}
