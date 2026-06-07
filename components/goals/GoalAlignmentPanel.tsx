// components/goals/GoalAlignmentPanel.tsx
"use client";

import { useState, useEffect } from "react";
import { Goal, Subscription, GoalAlignmentResult } from "@/types";
import { Sparkles, TrendingUp, AlertTriangle, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, toMonthly } from "@/lib/utils";

interface Props {
  goals: Goal[];
  subscriptions: Subscription[];
}

const REC_STYLES = {
  KEEP:   { icon: TrendingUp, color: "text-success", bg: "bg-success/10", label: "Keep" },
  REVIEW: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10", label: "Review" },
  CANCEL: { icon: XCircle, color: "text-danger", bg: "bg-danger/10", label: "Cancel" },
};

export function GoalAlignmentPanel({ goals, subscriptions }: Props) {
  const [results, setResults] = useState<GoalAlignmentResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [ran, setRan] = useState(false);

  async function runAnalysis() {
    setLoading(true);
    try {
      const res = await fetch("/api/goals/alignment");
      const data = await res.json();
      setResults(data);
      setRan(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // inject CSS for dynamic progress widths and colors (generated once)
    const id = "goal-alignment-styles";
    if (document.getElementById(id)) return;
    let css = "";
    // generate classes for 0-100% widths to avoid inline styles
    for (let i = 0; i <= 100; i++) {
      css += `.goal-align-fill-${i} { width: ${i}%; }\n`;
    }
    // color classes matching inline colors previously used
    css += `.goal-align-good { background: #4ade80; }\n`;
    css += `.goal-align-medium { background: #ffb547; }\n`;
    css += `.goal-align-bad { background: #ff5252; }\n`;

    const el = document.createElement("style");
    el.id = id;
    el.appendChild(document.createTextNode(css));
    document.head.appendChild(el);
  }, []);

  if (!goals.length || !subscriptions.length) {
    return (
      <div className="card h-full flex items-center justify-center text-center p-10">
        <div>
          <Sparkles className="w-8 h-8 text-muted mx-auto mb-3" />
          <p className="text-sm text-muted">Add goals and subscriptions to get AI alignment analysis</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-ink">AI Goal Alignment</h2>
          <p className="text-xs text-muted mt-0.5">Which subscriptions support your goals?</p>
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="flex items-center gap-2 bg-accent text-surface px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-accent-dim transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {ran ? "Re-analyze" : "Analyze"}
        </button>
      </div>

      {!ran && !loading && (
        <div className="text-center py-8 text-muted text-sm">
          Click Analyze to get AI-powered recommendations
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-accent mx-auto mb-2" />
          <p className="text-sm text-muted">Analyzing your subscriptions…</p>
        </div>
      )}

      {ran && !loading && (
        <div className="space-y-3">
          {results.map((r) => {
            const style = REC_STYLES[r.recommendation];
            const Icon = style.icon;
            const sub = subscriptions.find((s) => s.id === r.subscriptionId);
            return (
              <div key={r.subscriptionId} className="flex items-start gap-4 p-4 bg-surface-3 rounded-xl">
                <div className={cn("p-2 rounded-lg", style.bg)}>
                  <Icon className={cn("w-4 h-4", style.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-ink truncate">{r.subscriptionName}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-mono text-muted">
                        {sub ? formatCurrency(toMonthly(sub.cost, sub.billingCycle)) + "/mo" : ""}
                      </span>
                      <span className={cn("text-xs font-medium px-2 py-0.5 rounded-md", style.bg, style.color)}>
                        {style.label}
                      </span>
                    </div>
                  </div>
                  {r.goalTitle && (
                    <p className="text-xs text-muted mt-0.5">→ {r.goalTitle}</p>
                  )}
                  <p className="text-xs text-muted mt-1.5">{r.reasoning}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1 bg-surface-2 rounded-full">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          `goal-align-fill-${r.alignmentScore}`,
                          r.alignmentScore >= 70 ? "goal-align-good" : r.alignmentScore >= 30 ? "goal-align-medium" : "goal-align-bad"
                        )}
                      />
                    </div>
                    <span className="text-xs text-muted w-8 text-right">{r.alignmentScore}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
