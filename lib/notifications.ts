// lib/notifications.ts
import { prisma } from "./prisma";
import { daysUntil } from "./utils";

/**
 * Checks all active subscriptions and schedules renewal reminder
 * notifications for those renewing within their notifyDaysBefore window.
 * Call this from a cron job (e.g. Vercel Cron) daily.
 */
export async function scheduleRenewalReminders() {
  const subscriptions = await prisma.subscription.findMany({
    where: { status: "ACTIVE" },
    include: { user: true },
  });

  const created: string[] = [];

  for (const sub of subscriptions) {
    const days = daysUntil(sub.renewalDate);

    if (days <= sub.notifyDaysBefore && days >= 0) {
      // Avoid duplicate notifications
      const existing = await prisma.notification.findFirst({
        where: {
          subscriptionId: sub.id,
          type: "RENEWAL_REMINDER",
          sentAt: null,
          scheduledFor: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      });

      if (!existing) {
        await prisma.notification.create({
          data: {
            userId: sub.userId,
            subscriptionId: sub.id,
            type: "RENEWAL_REMINDER",
            title: `${sub.name} renews ${days === 0 ? "today" : `in ${days} day${days === 1 ? "" : "s"}`}`,
            message: `Your ${sub.name} subscription will renew for $${sub.cost}. Still worth it?`,
            scheduledFor: new Date(),
          },
        });
        created.push(sub.id);
      }
    }
  }

  return { scheduled: created.length };
}

/**
 * Check if any user's budget is at/over the threshold and fire alerts.
 */
export async function checkBudgetAlerts() {
  const budgets = await prisma.budget.findMany({
    include: {
      user: {
        include: {
          subscriptions: { where: { status: "ACTIVE" } },
        },
      },
    },
  });

  for (const budget of budgets) {
    const { toMonthly } = await import("./utils");
    const spent = budget.user.subscriptions.reduce(
      (sum, s) => sum + toMonthly(s.cost, s.billingCycle as any),
      0
    );
    const ratio = spent / budget.monthlyLimit;

    if (ratio >= 1) {
      await prisma.notification.create({
        data: {
          userId: budget.userId,
          type: "BUDGET_EXCEEDED",
          title: "Budget Exceeded!",
          message: `You've spent $${spent.toFixed(2)} of your $${budget.monthlyLimit} monthly budget.`,
          scheduledFor: new Date(),
        },
      });
    } else if (ratio >= budget.alertAt) {
      await prisma.notification.create({
        data: {
          userId: budget.userId,
          type: "BUDGET_WARNING",
          title: "Budget Warning",
          message: `You're at ${Math.round(ratio * 100)}% of your monthly budget. $${(budget.monthlyLimit - spent).toFixed(2)} remaining.`,
          scheduledFor: new Date(),
        },
      });
    }
  }
}
