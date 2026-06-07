// components/dashboard/BudgetProgress.tsx
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  spent: number;
  limit: number;
  currency?: string;
}

export function BudgetProgress({ spent, limit, currency = "USD" }: Props) {
  const percent = Math.round((spent / limit) * 100);
  const isOverBudget = spent > limit;
  const isWarning = percent >= 90;

  // Determine color based on percentage
  let statusColor = "text-success";
  let barColor = "bg-success";
  if (isOverBudget) {
    statusColor = "text-danger";
    barColor = "bg-danger";
  } else if (isWarning) {
    statusColor = "text-warning";
    barColor = "bg-warning";
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-wider">
            Monthly Budget
          </p>
          <p className={cn("text-2xl font-semibold mt-1", statusColor)}>
            {percent}%
          </p>
        </div>
        <div className="text-right text-sm">
          <p className="text-ink font-mono">
            {formatCurrency(spent)} / {formatCurrency(limit)}
          </p>
          <p className={cn("text-xs mt-1", statusColor)}>
            {isOverBudget
              ? `Over by ${formatCurrency(spent - limit)}`
              : `${formatCurrency(limit - spent)} remaining`}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-3 bg-surface-3 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            barColor,
          )}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>

      {/* Status message */}
      {isOverBudget && (
        <p className="text-xs text-danger">
          ⚠️ You've exceeded your budget limit
        </p>
      )}
      {isWarning && !isOverBudget && (
        <p className="text-xs text-warning">
          ⚠️ You're approaching your budget limit
        </p>
      )}
      {!isWarning && !isOverBudget && (
        <p className="text-xs text-success">✓ You're within budget</p>
      )}
    </div>
  );
}
