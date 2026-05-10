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

// Default pt-BR labels per status. Without these, callers that don't
// pass a `label` prop end up showing the raw English status (e.g.
// "succeeded", "scheduled") to Brazilian users — flagged as an audit
// item. Callers can still override by passing `label` explicitly.
const statusLabelPtBR: Record<string, string> = {
  // Events
  scheduled: "Agendado",
  completed: "Concluído",
  cancelled: "Cancelado",
  // Financial
  income: "Receita",
  expense: "Despesa",
  // Budgets
  draft: "Rascunho",
  sent: "Enviado",
  accepted: "Aceito",
  rejected: "Recusado",
  // Subscription
  trialing: "Em teste",
  active: "Ativo",
  past_due: "Em atraso",
  suspended: "Suspenso",
  // Payments
  succeeded: "Pago",
  failed: "Falhou",
  pending: "Pendente",
  refunded: "Reembolsado",
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
  const displayLabel = label ?? statusLabelPtBR[status] ?? status;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        colorMap[color],
        className,
      )}
    >
      {displayLabel}
    </span>
  );
}
