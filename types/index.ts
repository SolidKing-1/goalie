// types/index.ts

export type BillingCycle = "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
export type SubscriptionCategory =
  | "STREAMING" | "SOFTWARE" | "FITNESS" | "EDUCATION"
  | "FOOD" | "FINANCE" | "GAMING" | "PRODUCTIVITY" | "NEWS" | "OTHER";
export type SubscriptionStatus = "ACTIVE" | "CANCELLED" | "PAUSED";
export type UsageLevel = "DAILY" | "WEEKLY" | "RARELY" | "NEVER";
export type GoalCategory = "CAREER" | "EDUCATION" | "HEALTH" | "FINANCE" | "LIFESTYLE" | "OTHER";
export type GoalStatus = "ACTIVE" | "ACHIEVED" | "PAUSED";
export type NotificationType =
  | "RENEWAL_REMINDER" | "BUDGET_WARNING" | "BUDGET_EXCEEDED"
  | "RARELY_USED_ALERT" | "GOAL_ALIGNMENT";

export interface Subscription {
  id: string;
  userId: string;
  name: string;
  description?: string;
  cost: number;
  currency: string;
  billingCycle: BillingCycle;
  renewalDate: Date | string;
  category: SubscriptionCategory;
  status: SubscriptionStatus;
  logoUrl?: string;
  websiteUrl?: string;
  usageLevel?: UsageLevel;
  goalId?: string;
  notifyDaysBefore: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  goal?: Goal;
}

export interface Budget {
  id: string;
  userId: string;
  monthlyLimit: number;
  currency: string;
  alertAt: number;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: GoalCategory;
  targetDate?: Date | string;
  status: GoalStatus;
  subscriptions?: Subscription[];
}

export interface Notification {
  id: string;
  userId: string;
  subscriptionId?: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  scheduledFor?: Date | string;
  sentAt?: Date | string;
  createdAt: Date | string;
  subscription?: Subscription;
}

export interface DashboardStats {
  totalMonthlyCost: number;
  activeSubscriptions: number;
  budgetUsedPercent: number;
  rarelyUsedCount: number;
  upcomingRenewals: Subscription[];
  categoryBreakdown: { category: string; amount: number }[];
  monthlyTrend: { month: string; amount: number }[];
  goalAlignmentScore: number;
}

export interface SurveyEntry {
  subscriptionId: string;
  usageLevel: UsageLevel;
}

export interface GoalAlignmentResult {
  subscriptionId: string;
  subscriptionName: string;
  goalId?: string;
  goalTitle?: string;
  alignmentScore: number; // 0-100
  recommendation: "KEEP" | "REVIEW" | "CANCEL";
  reasoning: string;
}
