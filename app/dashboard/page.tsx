// app/dashboard/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toMonthly, formatCurrency, daysUntil, CATEGORY_COLORS } from "@/lib/utils";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { SpendingChart } from "@/components/charts/SpendingChart";
import { UpcomingRenewals } from "@/components/dashboard/UpcomingRenewals";
import { AlertsBanner } from "@/components/dashboard/AlertsBanner";
import { DollarSign, CreditCard, AlertTriangle, TrendingDown } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const [subscriptions, budget, notifications] = await Promise.all([
    prisma.subscription.findMany({
      where: { userId, status: "ACTIVE" },
      include: { goal: true },
      orderBy: { renewalDate: "asc" },
    }),
    prisma.budget.findUnique({ where: { userId } }),
    prisma.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const totalMonthly = subscriptions.reduce(
    (sum, s) => sum + toMonthly(s.cost, s.billingCycle as any),
    0
  );

  const budgetPercent = budget
    ? Math.round((totalMonthly / budget.monthlyLimit) * 100)
    : null;

  const upcomingRenewals = subscriptions.filter(
    (s) => daysUntil(s.renewalDate) <= 7
  );

  const rarelyUsed = subscriptions.filter(
    (s) => s.usageLevel === "RARELY" || s.usageLevel === "NEVER"
  );

  // Category breakdown for chart
  const categoryMap = new Map<string, number>();
  for (const s of subscriptions) {
    const cur = categoryMap.get(s.category) ?? 0;
    categoryMap.set(s.category, cur + toMonthly(s.cost, s.billingCycle as any));
  }
  const categoryData = Array.from(categoryMap.entries()).map(([name, value]) => ({
    name,
    value: Math.round(value * 100) / 100,
    fill: CATEGORY_COLORS[name] ?? "#6b7280",
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-ink">Dashboard</h1>
        <p className="text-muted mt-1">Your subscription overview for this month</p>
      </div>

      {/* Alerts */}
      {notifications.length > 0 && (
        <AlertsBanner notifications={notifications as any} />
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatsCard
          label="Monthly Spend"
          value={formatCurrency(totalMonthly)}
          icon={DollarSign}
          accent
        />
        <StatsCard
          label="Active Subscriptions"
          value={String(subscriptions.length)}
          icon={CreditCard}
        />
        <StatsCard
          label="Budget Used"
          value={budgetPercent !== null ? `${budgetPercent}%` : "—"}
          icon={TrendingDown}
          variant={
            budgetPercent === null ? "neutral"
              : budgetPercent >= 100 ? "danger"
              : budgetPercent >= 90 ? "warning"
              : "neutral"
          }
        />
        <StatsCard
          label="Rarely Used"
          value={String(rarelyUsed.length)}
          icon={AlertTriangle}
          variant={rarelyUsed.length > 0 ? "warning" : "neutral"}
        />
      </div>

      {/* Chart + Renewals */}
      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3 card">
          <h2 className="text-sm font-medium text-muted mb-4">Spending by Category</h2>
          <SpendingChart data={categoryData} />
        </div>
        <div className="col-span-2 card">
          <h2 className="text-sm font-medium text-muted mb-4">Upcoming Renewals</h2>
          <UpcomingRenewals subscriptions={upcomingRenewals as any} />
        </div>
      </div>
    </div>
  );
}
