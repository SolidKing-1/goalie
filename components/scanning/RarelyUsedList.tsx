// components/scanning/RarelyUsedList.tsx
"use client";

import { useRouter } from "next/navigation";
import { Subscription } from "@/types";
import { AlertTriangle } from "lucide-react";
import { formatCurrency, toMonthly } from "@/lib/utils";

export function RarelyUsedList({ subscriptions }: { subscriptions: Subscription[] }) {
  const router = useRouter();

  const totalWaste = subscriptions.reduce(
    (sum, s) => sum + toMonthly(s.cost, s.billingCycle),
    0
  );

  async function cancel(id: string) {
    try {
      const res = await fetch(`/api/subscriptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        alert(data?.error ?? "Failed to cancel subscription");
        return;
      }
      router.refresh();
    } catch {
      alert("Network error. Please try again.");
    }
  }

  return (
    <div className="bg-warning/5 border border-warning/30 rounded-xl p-5">
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
        <div>
          <h2 className="text-sm font-medium text-ink">Rarely Used Subscriptions</h2>
          <p className="text-xs text-muted mt-0.5">
            You could save <span className="text-warning font-medium">{formatCurrency(totalWaste)}/month</span> by cancelling these
          </p>
        </div>
      </div>
      <div className="space-y-2">
        {subscriptions.map((sub) => (
          <div key={sub.id} className="flex items-center justify-between bg-surface-2 rounded-lg px-4 py-3">
            <div>
              <p className="text-sm font-medium text-ink">{sub.name}</p>
              <p className="text-xs text-warning capitalize">{sub.usageLevel?.toLowerCase()} used</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-mono text-muted">
                {formatCurrency(toMonthly(sub.cost, sub.billingCycle))}/mo
              </span>
              <button
                onClick={() => cancel(sub.id)}
                className="text-xs px-3 py-1.5 rounded-lg border border-danger/40 text-danger hover:bg-danger/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
