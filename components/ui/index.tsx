// components/ui/index.tsx
// Shared primitive components used across the app

"use client";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import React from "react";

// ── Button ──────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}
export function Button({
  variant = "primary", size = "md", loading, children, className, disabled, ...props
}: ButtonProps) {
  const base = "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary:   "bg-accent text-surface hover:bg-accent-dim",
    secondary: "bg-surface-3 text-ink border border-border hover:border-ink/30",
    ghost:     "text-muted hover:text-ink hover:bg-surface-3",
    danger:    "bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20",
  };
  const sizes = { sm: "text-xs px-3 py-1.5", md: "text-sm px-4 py-2", lg: "text-sm px-5 py-2.5" };
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </button>
  );
}

// ── Input ───────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}
export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-xs font-medium text-muted">{label}</label>}
      <input
        className={cn(
          "w-full bg-surface-3 border border-border rounded-lg px-3 py-2 text-sm text-ink",
          "outline-none focus:border-accent transition-colors placeholder:text-muted/50",
          error && "border-danger focus:border-danger",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

// ── Select ──────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}
export function Select({ label, options, className, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-xs font-medium text-muted">{label}</label>}
      <select
        className={cn(
          "w-full bg-surface-3 border border-border rounded-lg px-3 py-2 text-sm text-ink",
          "outline-none focus:border-accent transition-colors",
          className
        )}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-surface-2">{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// ── Badge ───────────────────────────────────────────────────────────────────
interface BadgeProps { label: string; variant?: "success" | "warning" | "danger" | "info" | "neutral" }
export function Badge({ label, variant = "neutral" }: BadgeProps) {
  const styles = {
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/10",
    danger:  "text-danger bg-danger/10",
    info:    "text-info bg-info/10",
    neutral: "text-muted bg-surface-3",
  };
  return <span className={cn("text-xs font-medium px-2 py-0.5 rounded-md", styles[variant])}>{label}</span>;
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-surface-3 rounded-lg", className)} />;
}

// ── Empty state ──────────────────────────────────────────────────────────────
export function Empty({ icon: Icon, title, description, action }: {
  icon: React.ElementType; title: string; description?: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="w-12 h-12 rounded-xl bg-surface-3 flex items-center justify-center">
        <Icon className="w-6 h-6 text-muted" />
      </div>
      <div>
        <p className="text-sm font-medium text-ink">{title}</p>
        {description && <p className="text-xs text-muted mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}

// ── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ title, onClose, children }: {
  title: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-2 border border-border rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-sm text-ink">{title}</h2>
          <button onClick={onClose} className="text-muted hover:text-ink transition-colors text-lg leading-none">✕</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
