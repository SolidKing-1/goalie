// components/budget/BudgetManager.tsx
"use client";

import { useState, useEffect } from "react";
import { useBudget } from "@/hooks/useBudget";
import { formatCurrency, CATEGORY_COLORS } from "@/lib/utils";
import { Button, Input, Skeleton } from "@/components/ui/index";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";



const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-surface-3 border border-border rounded-lg px-3 py-2 text-xs shadow-xl">
        <p className="text-ink font-medium">{payload[0].payload.name}</p>
        <p className="text-accent font-mono">
          {formatCurrency(payload[0].value)}/mo
        </p>
      </div>
    );
  }
  return null;
};

export function BudgetManager() {
  const { budget, subscriptions, totalMonthly, loading, save } = useBudget();

  const [limit, setLimit] = useState("");
  const [alertAt, setAlertAt] = useState("90");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sync form with loaded budget
  useEffect(() => {
    if (budget) {
      setLimit(String(budget.monthlyLimit));
      setAlertAt(String(Math.round(budget.alertAt * 100)));
    }
  }, [budget]);

  const budgetLimit = parseFloat(limit) || 0;
  const percent =
    budgetLimit > 0 ? Math.min((totalMonthly / budgetLimit) * 100, 100) : 0;
  const rawPercent = budgetLimit > 0 ? (totalMonthly / budgetLimit) * 100 : 0;
  const remaining = budgetLimit - totalMonthly;
  const alertThresh = parseInt(alertAt);
  const isOver = rawPercent >= 100;
  const isWarning = !isOver && rawPercent >= alertThresh;

  const barColor = isOver ? "#ff5252" : isWarning ? "#ffb547" : "#c8f135";

  // Category breakdown for bar chart using explicit mathematical structures
  const categoryMap = new Map<string, number>();
  for (const s of subscriptions) {
    const k = s.category;
    // Ensure we fall back to a number if s.cost is a string or undefined
    const costValue =
      typeof s.cost === "string" ? parseFloat(s.cost) : s.cost || 0;
    categoryMap.set(k, (categoryMap.get(k) ?? 0) + costValue);
  }

  const categoryData = Array.from(categoryMap.entries())
    .map(([name, value]) => ({
      name: name.charAt(0) + name.slice(1).toLowerCase(),
      value: Math.round(value * 100) / 100,
      cat: name,
    }))
    .sort((a, b) => b.value - a.value);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!limit || isNaN(parseFloat(limit))) return;
    setSaving(true);
    await save({
      monthlyLimit: parseFloat(limit),
      alertAt: parseInt(alertAt) / 100,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (loading)
    return (
      <div className="grid grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    );

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-3 gap-6">
        {/* ── Settings card ── */}
        <div className="card space-y-5">
          <h2 className="text-sm font-medium text-ink">Budget Settings</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <Input
              label="Monthly Limit ($)"
              type="number"
              min="1"
              step="0.01"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder="100.00"
            />
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-xs font-medium text-muted">
                  Alert threshold
                </label>
                <span className="text-xs font-mono text-accent">
                  {alertAt}%
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="99"
                step="5"
                value={alertAt}
                onChange={(e) => setAlertAt(e.target.value)}
                className="w-full h-1.5 rounded-full appearance-none bg-surface-3 accent-[var(--color-accent)] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted">
                <span>50%</span>
                <span>75%</span>
                <span>99%</span>
              </div>
            </div>
            <Button type="submit" loading={saving} className="w-full">
              {saved ? "✓ Saved!" : "Save Budget"}
            </Button>
          </form>
        </div>

        {/* ── Gauge card ── */}
        <div className="card flex flex-col items-center justify-center gap-5">
          {/* Circular gauge */}
          <div className="relative w-44 h-44">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle
                cx="18"
                cy="18"
                r="15.9"
                fill="none"
                stroke="var(--color-surface-3)"
                strokeWidth="3.2"
              />
              <circle
                cx="18"
                cy="18"
                r="15.9"
                fill="none"
                stroke={barColor}
                strokeWidth="3.2"
                strokeDasharray={`${percent} ${100 - percent}`}
                strokeLinecap="round"
                style={{
                  transition: "stroke-dasharray 1s ease, stroke 0.5s ease",
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="text-3xl font-bold font-mono"
                style={{ color: barColor }}
              >
                {Math.round(rawPercent)}%
              </span>
              <span className="text-xs text-muted mt-0.5">used</span>
            </div>
          </div>

          {/* Status indicator */}
          <div className="text-center space-y-1">
            {isOver ? (
              <div className="flex items-center gap-1.5 justify-center text-danger">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">Over budget!</span>
              </div>
            ) : isWarning ? (
              <div className="flex items-center gap-1.5 justify-center text-warning">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">Approaching limit</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 justify-center text-success">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">On track</span>
              </div>
            )}
            <p className="text-xs text-muted">
              <span className="font-mono text-accent">
                {formatCurrency(totalMonthly)}
              </span>
              {" of "}
              <span className="font-mono">
                {budgetLimit > 0 ? formatCurrency(budgetLimit) : "—"}
              </span>
            </p>
            {budgetLimit > 0 && (
              <p
                className={cn(
                  "text-xs font-mono",
                  remaining >= 0 ? "text-success" : "text-danger",
                )}
              >
                {remaining >= 0
                  ? `${formatCurrency(remaining)} remaining`
                  : `${formatCurrency(Math.abs(remaining))} over`}
              </p>
            )}
          </div>
        </div>

        {/* ── Subscriptions breakdown ── */}
        <div className="card space-y-3">
          <h2 className="text-sm font-medium text-ink">By Subscription</h2>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {subscriptions
              .slice()
              .sort((a, b) => {
                const aCost =
                  typeof a.cost === "string" ? parseFloat(a.cost) : a.cost || 0;
                const bCost =
                  typeof b.cost === "string" ? parseFloat(b.cost) : b.cost || 0;
                return bCost - aCost;
              })
              .map((s) => {
                const monthly =
                  typeof s.cost === "string" ? parseFloat(s.cost) : s.cost || 0;
                const pct =
                  budgetLimit > 0
                    ? Math.min((monthly / budgetLimit) * 100, 100)
                    : 0;
                return (
                  <div key={s.id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted truncate max-w-[130px]">
                        {s.name}
                      </span>
                      <span className="font-mono text-ink flex-shrink-0">
                        {formatCurrency(monthly)}
                      </span>
                    </div>
                    <div className="h-1 bg-surface-3 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: CATEGORY_COLORS[s.category] ?? "#6b7280",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            {subscriptions.length === 0 && (
              <p className="text-xs text-muted text-center py-8">
                No active subscriptions
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Category bar chart ── */}
      {categoryData.length > 0 && (
        <div className="card min-w-full">
          <h2 className="text-sm font-medium text-ink mb-5">
            Spending by Category
          </h2>
          <div className="w-full h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} barSize={32}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: "var(--color-ink-muted)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--color-ink-muted)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "var(--color-surface-3)" }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {categoryData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={CATEGORY_COLORS[entry.cat] ?? "#6b7280"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
