// lib/calculations.ts
import { toMonthly } from "@/lib/utils";
import type { BillingCycle, Subscription } from "@/types";

/**
 * Calculate total monthly cost from a list of subscriptions.
 */
export function calculateTotalMonthly(
  subscriptions: Pick<Subscription, "cost" | "billingCycle">[],
): number {
  return subscriptions.reduce(
    (sum, s) => sum + toMonthly(s.cost, s.billingCycle as BillingCycle),
    0,
  );
}

/**
 * Filter subscriptions that are rarely or never used.
 */
export function filterRarelyUsed<
  T extends { usageLevel?: string | null },
>(subscriptions: T[]): T[] {
  return subscriptions.filter(
    (s) => s.usageLevel === "RARELY" || s.usageLevel === "NEVER",
  );
}
