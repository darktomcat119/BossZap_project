import { cn } from "@/lib/utils";

type BadgeColor = "blue" | "green" | "gray" | "red" | "yellow" | "purple";

const colorMap: Record<BadgeColor, string> = {
  blue: "bg-info/10 text-info",
  green: "bg-success/10 text-success",
  gray: "bg-text-muted/10 text-text-muted",
  red: "bg-danger/10 text-danger",
  yellow: "bg-warning/10 text-warning",
  purple: "bg-secondary/10 text-secondary",
};

const statusColorMap: Record<string, BadgeColor> = {
  // Events
  scheduled: "blue",
  completed: "green",
  cancelled: "gray",
  // Financial
  income: "green",
  expense: "red",
  // Budgets
  draft: "gray",
  sent: "blue",
  accepted: "green",
  rejected: "red",
  // Subscription
  trialing: "purple",
  active: "green",
  past_due: "yellow",
  suspended: "red",
  // Payments
  succeeded: "green",
  failed: "red",
  pending: "yellow",
  refunded: "gray",
};

interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

export function StatusBadge({
  status,
  label,
  className,
}: StatusBadgeProps) {
  const color = statusColorMap[status] || "gray";

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        colorMap[color],
        className,
      )}
    >
      {label || status}
    </span>
  );
}
