// components/subscriptions/SubscriptionsList.tsx
"use client";

import { useState } from "react";
import { Subscription, Goal, SubscriptionStatus } from "@/types";
import { formatCurrency, toMonthly, formatRelativeDate, daysUntil, CATEGORY_COLORS } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { EditSubscriptionDialog } from "./EditSubscriptionDialog";
import { Pencil, Trash2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  subscriptions: Subscription[];
  goals: Goal[];
}

const STATUS_STYLES: Record<SubscriptionStatus, string> = {
  ACTIVE:    "text-success bg-success/10",
  CANCELLED: "text-muted bg-surface-3",
  PAUSED:    "text-warning bg-warning/10",
};

export function SubscriptionsList({ subscriptions, goals }: Props) {
  const router = useRouter();
  const [editTarget, setEditTarget] = useState<Subscription | null>(null);
  const [filter, setFilter] = useState<SubscriptionStatus | "ALL">("ALL");

  const filtered = filter === "ALL" ? subscriptions : subscriptions.filter((s) => s.status === filter);

  async function handleDelete(id: string) {
    if (!confirm("Delete this subscription?")) return;
    await fetch(`/api/subscriptions/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <>
      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["ALL", "ACTIVE", "PAUSED", "CANCELLED"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              filter === f ? "bg-accent text-surface" : "text-muted hover:text-ink hover:bg-surface-3"
            )}
          >
            {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {["Name", "Category", "Cost/Month", "Renews", "Status", "Goal", ""].map((h) => (
                <th key={h} className="text-left text-xs font-medium text-muted px-5 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((sub) => {
              const days = daysUntil(sub.renewalDate);
              const monthly = toMonthly(sub.cost, sub.billingCycle);
              return (
                <tr key={sub.id} className="border-b border-border last:border-0 hover:bg-surface-3/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="category-indicator"
                        data-color={CATEGORY_COLORS[sub.category] ?? "#6b7280"}
                      />
                      <span className="font-medium text-ink">{sub.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-muted capitalize">
                    {sub.category.toLowerCase()}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-accent">
                    {formatCurrency(monthly)}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={cn("text-xs", days <= 3 ? "text-warning" : "text-muted")}>
                      {days <= 0 ? "Today" : formatRelativeDate(sub.renewalDate)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={cn("text-xs px-2 py-1 rounded-md font-medium", STATUS_STYLES[sub.status])}>
                      {sub.status.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-muted text-xs">
                    {(sub as any).goal?.title ?? "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      {sub.usageLevel === "RARELY" || sub.usageLevel === "NEVER" ? (
                        <AlertCircle className="w-3.5 h-3.5 text-warning" />
                      ) : null}
                      <button
                        onClick={() => setEditTarget(sub)}
                        className="p-1 text-muted hover:text-ink rounded transition-colors"
                        title="Edit subscription"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(sub.id)}
                        className="p-1 text-muted hover:text-danger rounded transition-colors"
                        title="Delete subscription"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-muted text-sm">
                  No subscriptions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editTarget && (
        <EditSubscriptionDialog
          subscription={editTarget}
          goals={goals}
          onClose={() => setEditTarget(null)}
        />
      )}
    </>
  );
}
