// components/budget/BudgetManager.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Budget, Subscription } from "@/types";
import { formatCurrency, toMonthly, CATEGORY_COLORS } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  budget: Budget | null;
  subscriptions: Subscription[];
  totalMonthly: number;
}

export function BudgetManager({ budget, subscriptions, totalMonthly }: Props) {
  const router = useRouter();
  const [limit, setLimit] = useState(String(budget?.monthlyLimit ?? ""));
  const [alertAt, setAlertAt] = useState(String(Math.round((budget?.alertAt ?? 0.9) * 100)));
  const [saving, setSaving] = useState(false);

  const budgetLimit = parseFloat(limit) || 0;
  const percent = budgetLimit > 0 ? Math.min((totalMonthly / budgetLimit) * 100, 100) : 0;
  const remaining = budgetLimit - totalMonthly;
  const alertThreshold = parseInt(alertAt) / 100;

  const barColor =
    percent >= 100 ? "#ff5252"
    : percent >= alertThreshold * 100 ? "#ffb547"
    : "#c8f135";

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/budget", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthlyLimit: parseFloat(limit),
          alertAt: parseInt(alertAt) / 100,
        }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Budget settings */}
      <div className="card space-y-5">
        <h2 className="text-sm font-medium text-ink">Budget Settings</h2>

        <div className="space-y-1.5">
          <label htmlFor="monthly-limit" className="text-xs text-muted">Monthly Limit ($)</label>
          <input
            id="monthly-limit"
            type="number"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            placeholder="100"
            title="Set your monthly budget limit"
            className="w-full bg-surface-3 border border-border rounded-lg px-3 py-2 text-sm text-ink outline-none focus:border-accent transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="alert-at" className="text-xs text-muted">Alert me at (%)</label>
          <div className="flex items-center gap-3">
            <input
              id="alert-at"
              type="range"
              min="50" max="100" step="5"
              value={alertAt}
              onChange={(e) => setAlertAt(e.target.value)}
              title="Set the notification threshold as a percentage of your budget"
              className="flex-1 accent-[var(--color-accent)]"
            />
            <span className="text-sm font-mono text-accent w-10 text-right">{alertAt}%</span>
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving || !limit}
          className="w-full bg-accent text-surface py-2 rounded-lg text-sm font-medium hover:bg-accent-dim transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Budget"}
        </button>
      </div>

      {/* Gauge */}
      <div className="card flex flex-col items-center justify-center gap-4">
        <div className="relative w-40 h-40">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--color-surface-3)" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15.9" fill="none"
              stroke={barColor}
              strokeWidth="3"
              strokeDasharray={`${percent} ${100 - percent}`}
              strokeLinecap="round"
              style={{ transition: "stroke-dasharray 0.8s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
            <span className="text-2xl font-bold" style={{ color: barColor }}>
              {Math.round(percent)}%
            </span>
            <span className="text-xs text-muted">used</span>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm font-mono text-accent">{formatCurrency(totalMonthly)}</p>
          <p className="text-xs text-muted">
            of {budgetLimit > 0 ? formatCurrency(budgetLimit) : "no limit set"}
          </p>
          {budgetLimit > 0 && (
            <p className={cn("text-xs mt-1", remaining >= 0 ? "text-success" : "text-danger")}>
              {remaining >= 0 ? `${formatCurrency(remaining)} remaining` : `${formatCurrency(Math.abs(remaining))} over budget`}
            </p>
          )}
        </div>
      </div>

      {/* Breakdown */}
      <div className="card space-y-3">
        <h2 className="text-sm font-medium text-ink">Breakdown</h2>
        <div className="space-y-2 overflow-y-auto max-h-64">
          {subscriptions.map((s) => {
            const monthly = toMonthly(s.cost, s.billingCycle);
            const pct = budgetLimit > 0 ? (monthly / budgetLimit) * 100 : 0;
            return (
              <div key={s.id} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted">{s.name}</span>
                  <span className="font-mono text-ink">{formatCurrency(monthly)}/mo</span>
                </div>
                <div className="h-1 bg-surface-3 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(pct, 100)}%`,
                      background: CATEGORY_COLORS[s.category] ?? "#6b7280",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
