// components/goals/GoalAlignmentPanel.tsx
"use client";

import { useGoals } from "@/hooks/useGoals";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { GoalAlignmentResult } from "@/types";
import { Button, Empty, Skeleton } from "@/components/ui/index";
import { formatCurrency, toMonthly } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Sparkles, TrendingUp, AlertTriangle, XCircle, Loader2, Target } from "lucide-react";

const REC = {
  KEEP:   { icon: TrendingUp,    color: "text-success", bg: "bg-success/10 border-success/20", bar: "#4ade80", label: "Keep"   },
  REVIEW: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10 border-warning/20", bar: "#ffb547", label: "Review" },
  CANCEL: { icon: XCircle,       color: "text-danger",  bg: "bg-danger/10 border-danger/20",   bar: "#ff5252", label: "Cancel" },
};

function AlignmentCard({ result, subscriptions }: { result: GoalAlignmentResult; subscriptions: any[] }) {
  const rec  = REC[result.recommendation];
  const Icon = rec.icon;
  const sub  = subscriptions.find((s) => s.id === result.subscriptionId);

  return (
    <div className={cn("flex items-start gap-4 p-4 rounded-xl border transition-all", rec.bg)}>
      <div className={cn("p-2 rounded-lg bg-surface-2 flex-shrink-0")}>
        <Icon className={cn("w-4 h-4", rec.color)} />
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-ink">{result.subscriptionName}</p>
            {result.goalTitle && (
              <p className="text-xs text-muted mt-0.5">→ {result.goalTitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {sub && (
              <span className="text-xs font-mono text-muted">
                {formatCurrency(toMonthly(sub.cost, sub.billingCycle))}/mo
              </span>
            )}
            <span className={cn("text-xs font-bold px-2 py-0.5 rounded-md bg-surface-2", rec.color)}>
              {rec.label}
            </span>
          </div>
        </div>
        <p className="text-xs text-muted leading-relaxed">{result.reasoning}</p>
        {/* Alignment score bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${result.alignmentScore}%`, background: rec.bar }}
            />
          </div>
          <span className="text-xs font-mono text-muted w-8 text-right">{result.alignmentScore}/100</span>
        </div>
      </div>
    </div>
  );
}

export function GoalAlignmentPanel() {
  const { goals, alignment, loading: goalsLoading, analyzing, analyze } = useGoals();
  const { subscriptions, loading: subsLoading } = useSubscriptions();

  const loading = goalsLoading || subsLoading;

  const keepCount   = alignment.filter((r) => r.recommendation === "KEEP").length;
  const reviewCount = alignment.filter((r) => r.recommendation === "REVIEW").length;
  const cancelCount = alignment.filter((r) => r.recommendation === "CANCEL").length;

  const potentialSavings = alignment
    .filter((r) => r.recommendation === "CANCEL")
    .reduce((sum, r) => {
      const sub = subscriptions.find((s) => s.id === r.subscriptionId);
      return sum + (sub ? toMonthly(sub.cost, sub.billingCycle) : 0);
    }, 0);

  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="card space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            AI Goal Alignment
          </h2>
          <p className="text-xs text-muted mt-1">
            GPT-4o-mini analyzes each subscription against your goals
          </p>
        </div>
        <Button
          size="sm"
          onClick={analyze}
          disabled={!goals.length || !subscriptions.length || analyzing}
          loading={analyzing}
        >
          <Sparkles className="w-3.5 h-3.5" />
          {alignment.length > 0 ? "Re-analyze" : "Analyze"}
        </Button>
      </div>

      {/* Empty states */}
      {!goals.length || !subscriptions.length ? (
        <Empty
          icon={Target}
          title="Add goals and subscriptions first"
          description="You need at least one goal and one subscription to run the analysis"
        />
      ) : analyzing ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
          <p className="text-sm text-muted">Analyzing {subscriptions.length} subscriptions against {goals.length} goals…</p>
        </div>
      ) : alignment.length === 0 ? (
        <div className="text-center py-10">
          <Sparkles className="w-8 h-8 text-muted mx-auto mb-3" />
          <p className="text-sm text-muted">Click <strong className="text-ink">Analyze</strong> to get personalized recommendations</p>
        </div>
      ) : (
        <>
          {/* Summary row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Keep",          count: keepCount,   color: "text-success", bg: "bg-success/10" },
              { label: "Review",        count: reviewCount, color: "text-warning", bg: "bg-warning/10" },
              { label: "Cancel",        count: cancelCount, color: "text-danger",  bg: "bg-danger/10"  },
            ].map(({ label, count, color, bg }) => (
              <div key={label} className={cn("rounded-xl p-3 text-center", bg)}>
                <p className={cn("text-2xl font-bold font-mono", color)}>{count}</p>
                <p className="text-xs text-muted mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {potentialSavings > 0 && (
            <div className="bg-success/5 border border-success/20 rounded-xl px-4 py-3 text-sm">
              <span className="text-muted">Potential savings from cancellations: </span>
              <span className="text-success font-mono font-semibold">{formatCurrency(potentialSavings)}/mo</span>
            </div>
          )}

          {/* Results list */}
          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {["CANCEL", "REVIEW", "KEEP"].flatMap((rec) =>
              alignment
                .filter((r) => r.recommendation === rec)
                .map((r) => (
                  <AlignmentCard key={r.subscriptionId} result={r} subscriptions={subscriptions} />
                ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
