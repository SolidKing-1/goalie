// components/scanning/RarelyUsedList.tsx
"use client";

import { useState, useEffect } from "react";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { formatCurrency, toMonthly } from "@/lib/utils";
import { Subscription } from "@/types";
import { Button, Empty, Skeleton } from "@/components/ui/index";
import { AlertTriangle, TrendingDown, CheckCircle } from "lucide-react";

export function RarelyUsedList() {
  const { subscriptions, loading, update } = useSubscriptions();
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [cancelled, setCancelled]   = useState<Set<string>>(new Set());

  const rarelyUsed = subscriptions.filter(
    (s) => s.status === "ACTIVE" && (s.usageLevel === "RARELY" || s.usageLevel === "NEVER")
  );

  const totalWaste = rarelyUsed.reduce(
    (sum, s) => sum + toMonthly(s.cost, s.billingCycle), 0
  );

  async function cancel(sub: Subscription) {
    setCancelling(sub.id);
    await update(sub.id, { status: "CANCELLED" });
    setCancelled((prev) => new Set([...prev, sub.id]));
    setCancelling(null);
  }

  if (loading) return <Skeleton className="h-32 w-full" />;
  if (rarelyUsed.length === 0) return (
    <div className="card">
      <div className="flex items-center gap-3">
        <CheckCircle className="w-5 h-5 text-success" />
        <div>
          <p className="text-sm font-medium text-ink">All subscriptions are being used regularly</p>
          <p className="text-xs text-muted">Complete the monthly survey to check for wasted spending</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-warning/5 border border-warning/25 rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
          <div>
            <h2 className="text-sm font-semibold text-ink">Rarely Used Subscriptions</h2>
            <p className="text-xs text-muted mt-0.5">
              Cancelling these could save you{" "}
              <span className="text-warning font-mono font-semibold">{formatCurrency(totalWaste)}/month</span>
              {" "}(
              <span className="text-warning font-mono">{formatCurrency(totalWaste * 12)}/year</span>
              )
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-warning">
          <TrendingDown className="w-4 h-4" />
          <span className="text-xs font-mono font-bold">{rarelyUsed.length} subs</span>
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {rarelyUsed.map((sub) => {
          const monthly = toMonthly(sub.cost, sub.billingCycle);
          const isCancelled = cancelled.has(sub.id);
          return (
            <div key={sub.id} className={`flex items-center justify-between bg-surface-2 rounded-xl px-4 py-3 transition-all ${isCancelled ? "opacity-50" : ""}`}>
              <div className="flex items-center gap-3">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-ink">{sub.name}</p>
                  <p className={`text-xs font-medium capitalize ${sub.usageLevel === "NEVER" ? "text-danger" : "text-warning"}`}>
                    {sub.usageLevel?.toLowerCase()} used
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-mono text-ink">{formatCurrency(monthly)}/mo</p>
                  <p className="text-xs text-muted">{formatCurrency(monthly * 12)}/yr</p>
                </div>
                {isCancelled ? (
                  <span className="text-xs text-success font-medium">Cancelled ✓</span>
                ) : (
                  <Button
                    variant="danger"
                    size="sm"
                    loading={cancelling === sub.id}
                    onClick={() => cancel(sub)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
