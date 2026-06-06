// components/dashboard/UpcomingRenewals.tsx
import { formatCurrency, formatRelativeDate, daysUntil } from "@/lib/utils";
import { Subscription } from "@/types";
import { cn } from "@/lib/utils";

export function UpcomingRenewals({ subscriptions }: { subscriptions: Subscription[] }) {
  if (!subscriptions.length) {
    return <p className="text-muted text-sm">No renewals in the next 7 days 🎉</p>;
  }

  return (
    <div className="space-y-3">
      {subscriptions.map((sub) => {
        const days = daysUntil(sub.renewalDate);
        return (
          <div key={sub.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
            <div>
              <p className="text-sm font-medium text-ink">{sub.name}</p>
              <p className={cn(
                "text-xs mt-0.5",
                days <= 1 ? "text-danger" : days <= 3 ? "text-warning" : "text-muted"
              )}>
                {formatRelativeDate(sub.renewalDate)}
              </p>
            </div>
            <span className="text-sm font-mono text-accent">
              {formatCurrency(sub.cost)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
