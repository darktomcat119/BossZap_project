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
    <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-surface p-5 shadow-sm transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 transition-all duration-300 group-hover:from-primary/[0.02] group-hover:to-transparent" />

      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 ring-1 ring-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
              isPositive
                ? "bg-success/10 text-success ring-1 ring-success/20"
                : "bg-danger/10 text-danger ring-1 ring-danger/20",
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
        <p className="mt-3.5 text-sm font-medium text-text-secondary">{label}</p>
        <p className="mt-1 text-lg font-bold tracking-tight text-text-primary sm:text-2xl truncate">
          {value}
        </p>
        <p className="mt-1 text-xs text-text-muted">{changeLabel}</p>
      </div>
    </div>
  );
}
