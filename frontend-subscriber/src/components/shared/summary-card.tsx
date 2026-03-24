"use client";

import { type LucideIcon, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

type SummaryCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  change: number;
  changeLabel: string;
};

export function SummaryCard({
  icon: Icon,
  label,
  value,
  change,
  changeLabel,
}: SummaryCardProps) {
  const isPositive = change >= 0;

  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
            isPositive
              ? "bg-success/10 text-success"
              : "bg-danger/10 text-danger"
          )}
        >
          {isPositive ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )}
          {Math.abs(change)}%
        </span>
      </div>
      <p className="mt-3 text-sm font-medium text-text-secondary">{label}</p>
      <p className="mt-1 text-2xl font-bold text-text-primary">{value}</p>
      <p className="mt-1 text-xs text-text-muted">{changeLabel}</p>
    </div>
  );
}
