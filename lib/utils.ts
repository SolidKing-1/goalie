// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { BillingCycle } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Normalize any billing cycle cost to a monthly equivalent */
export function toMonthly(cost: number, cycle: BillingCycle): number {
  switch (cycle) {
    case "WEEKLY":    return cost * 52 / 12;
    case "MONTHLY":   return cost;
    case "QUARTERLY": return cost / 3;
    case "YEARLY":    return cost / 12;
  }
}

/** Format currency with symbol */
export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/** Days until a given date */
export function daysUntil(date: Date | string): number {
  const target = new Date(date);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/** Format relative date (e.g. "in 3 days") */
export function formatRelativeDate(date: Date | string): string {
  const days = daysUntil(date);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 0) return `${Math.abs(days)} days ago`;
  return `In ${days} days`;
}

/** Get category color for charts */
export const CATEGORY_COLORS: Record<string, string> = {
  STREAMING:    "#6366f1",
  SOFTWARE:     "#8b5cf6",
  FITNESS:      "#22d3ee",
  EDUCATION:    "#10b981",
  FOOD:         "#f59e0b",
  FINANCE:      "#3b82f6",
  GAMING:       "#ec4899",
  PRODUCTIVITY: "#14b8a6",
  NEWS:         "#f97316",
  OTHER:        "#6b7280",
};

/** Map billing cycle to human-readable label */
export const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  WEEKLY:    "Weekly",
  MONTHLY:   "Monthly",
  QUARTERLY: "Quarterly",
  YEARLY:    "Yearly",
};
