// components/dashboard/StatsCard.tsx
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  accent?: boolean;
  variant?: "neutral" | "warning" | "danger" | "success";
}

const variantStyles = {
  neutral: "text-ink",
  warning: "text-warning",
  danger:  "text-danger",
  success: "text-success",
};

export function StatsCard({ label, value, icon: Icon, accent, variant = "neutral" }: StatsCardProps) {
  return (
    <div className={cn("card flex flex-col gap-3", accent && "glow-border")}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted uppercase tracking-wider">{label}</span>
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center",
          accent ? "bg-accent/20" : "bg-surface-3"
        )}>
          <Icon className={cn("w-4 h-4", accent ? "text-accent" : variantStyles[variant])} />
        </div>
      </div>
      <span className={cn("text-2xl font-semibold", accent ? "text-accent" : variantStyles[variant])}>
        {value}
      </span>
    </div>
  );
}
