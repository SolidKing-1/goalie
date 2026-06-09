// lib/constants.ts

export const SUBSCRIPTION_CATEGORIES = [
  "STREAMING",
  "SOFTWARE",
  "FITNESS",
  "EDUCATION",
  "FOOD",
  "FINANCE",
  "GAMING",
  "PRODUCTIVITY",
  "NEWS",
  "OTHER",
] as const;

export const BILLING_CYCLES = [
  "WEEKLY",
  "MONTHLY",
  "QUARTERLY",
  "YEARLY",
] as const;

export const GOAL_CATEGORIES = [
  "CAREER",
  "EDUCATION",
  "HEALTH",
  "FINANCE",
  "LIFESTYLE",
  "OTHER",
] as const;

export const USAGE_LEVELS = ["DAILY", "WEEKLY", "RARELY", "NEVER"] as const;

export const SUBSCRIPTION_STATUSES = [
  "ACTIVE",
  "CANCELLED",
  "PAUSED",
] as const;
