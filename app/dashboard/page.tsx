// app/dashboard/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  toMonthly,
  formatCurrency,
  daysUntil,
  CATEGORY_COLORS,
} from "@/lib/utils";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { SpendingChart } from "@/components/charts/SpendingChart";
import { MonthlyTrendChart } from "@/components/charts/MonthlyTrendChart";
import { UpcomingRenewals } from "@/components/dashboard/UpcomingRenewals";
import { BudgetProgress } from "@/components/dashboard/BudgetProgress";
import { AlertsBanner } from "@/components/dashboard/AlertsBanner";
import {
  DollarSign,
  CreditCard,
  AlertTriangle,
  TrendingDown,
} from "lucide-react";

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
    0,
  );

  const budgetPercent = budget
    ? Math.round((totalMonthly / budget.monthlyLimit) * 100)
    : null;

  const upcomingRenewals = subscriptions.filter(
    (s) => daysUntil(s.renewalDate) <= 7,
  );

  const rarelyUsed = subscriptions.filter(
    (s) => s.usageLevel === "RARELY" || s.usageLevel === "NEVER",
  );

  // Category breakdown for chart
  const categoryMap = new Map<string, number>();
  for (const s of subscriptions) {
    const cur = categoryMap.get(s.category) ?? 0;
    categoryMap.set(s.category, cur + toMonthly(s.cost, s.billingCycle as any));
  }
  const categoryData = Array.from(categoryMap.entries()).map(
    ([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100,
      fill: CATEGORY_COLORS[name] ?? "#6b7280",
    }),
  );

  // Calculate last 6 months trend
  const now = new Date();
  const trendData = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

    const monthSubs = subscriptions.filter((s) => {
      const subDate = new Date(s.renewalDate);
      return subDate >= monthDate && subDate < nextMonth;
    });

    const monthAmount = monthSubs.reduce(
      (sum, s) => sum + toMonthly(s.cost, s.billingCycle as any),
      0,
    );

    trendData.push({
      month: monthDate.toLocaleString("default", { month: "short" }),
      amount: Math.round(monthAmount * 100) / 100,
    });
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-ink">Dashboard</h1>
        <p className="text-muted mt-1">
          Your subscription overview for this month
        </p>
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
            budgetPercent === null
              ? "neutral"
              : budgetPercent >= 100
                ? "danger"
                : budgetPercent >= 90
                  ? "warning"
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

      {/* Monthly Trend */}
      <div className="card">
        <h2 className="text-sm font-medium text-muted mb-4">
          6-Month Spending Trend
        </h2>
        <MonthlyTrendChart data={trendData} limit={budget?.monthlyLimit} />
      </div>

      {/* Budget + Charts */}
      <div className="grid grid-cols-3 gap-6">
        {/* Budget Progress */}
        <div className="card">
          <BudgetProgress
            spent={totalMonthly}
            limit={budget?.monthlyLimit ?? 0}
          />
        </div>

        {/* Category Breakdown */}
        <div className="col-span-1 card">
          <h2 className="text-sm font-medium text-muted mb-4">
            Spending by Category
          </h2>
          <SpendingChart data={categoryData} />
        </div>

        {/* Upcoming Renewals */}
        <div className="card">
          <h2 className="text-sm font-medium text-muted mb-4">
            Upcoming Renewals
          </h2>
          <UpcomingRenewals subscriptions={upcomingRenewals as any} />
        </div>
      </div>
    </div>
  );
}
