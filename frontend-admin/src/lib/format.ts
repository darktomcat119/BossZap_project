/**
 * Money formatting — Brazilian Real (BRL) for the admin dashboard.
 * Always uses pt-BR locale regardless of admin's selected language,
 * since payments and metrics are in BRL.
 */
const BRL_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatBRL(value: number | string | null | undefined): string {
  const n = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
  if (!Number.isFinite(n)) return BRL_FORMATTER.format(0);
  return BRL_FORMATTER.format(n);
}

/**
 * Translate raw payment status from the API into the user-facing pt-BR label.
 * Source values come from the `payments.status` column.
 */
const PAYMENT_STATUS_LABELS: Record<string, string> = {
  succeeded: 'Concluído',
  paid: 'Pago',
  failed: 'Falhou',
  refunded: 'Estornado',
  pending: 'Pendente',
  processing: 'Processando',
  canceled: 'Cancelado',
  cancelled: 'Cancelado',
};

export function formatPaymentStatus(status: string | null | undefined): string {
  if (!status) return '—';
  return PAYMENT_STATUS_LABELS[status.toLowerCase()] ?? status;
}

/**
 * Translate WhatsApp template meta_status values into pt-BR labels.
 */
const TEMPLATE_STATUS_LABELS: Record<string, string> = {
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  pending: 'Pendente',
};

export function formatTemplateStatus(status: string | null | undefined): string {
  if (!status) return '—';
  return TEMPLATE_STATUS_LABELS[status.toLowerCase()] ?? status;
}

/**
 * Translate template categories (also used by the backend's hsm_templates.category).
 */
const TEMPLATE_CATEGORY_LABELS: Record<string, string> = {
  marketing: 'Marketing',
  utility: 'Utilidade',
  authentication: 'Autenticação',
  notification: 'Notificação',
};

export function formatTemplateCategory(category: string | null | undefined): string {
  if (!category) return '—';
  return TEMPLATE_CATEGORY_LABELS[category.toLowerCase()] ?? category;
}

/**
 * Translate health service status (database, redis, whatsapp, openai).
 */
const SERVICE_STATUS_LABELS: Record<string, string> = {
  operational: 'Operacional',
  degraded: 'Degradado',
  down: 'Fora do Ar',
};

export function formatServiceStatus(status: string | null | undefined): string {
  if (!status) return '—';
  return SERVICE_STATUS_LABELS[status.toLowerCase()] ?? status;
}

/**
 * Translate BullMQ worker state.
 */
const WORKER_STATE_LABELS: Record<string, string> = {
  running: 'Executando',
  idle: 'Ocioso',
  stopped: 'Parado',
};

export function formatWorkerState(state: string | null | undefined): string {
  if (!state) return '—';
  return WORKER_STATE_LABELS[state.toLowerCase()] ?? state;
}

/**
 * Translate audit log action labels.
 */
const AUDIT_ACTION_LABELS: Record<string, string> = {
  created: 'Criado',
  updated: 'Atualizado',
  deleted: 'Excluído',
  login: 'Login',
  logout: 'Logout',
  export: 'Exportação',
  subscriber_activated: 'Assinante ativado',
  subscriber_suspended: 'Assinante suspenso',
  subscriber_deactivated: 'Assinante desativado',
};

export function formatAuditAction(action: string | null | undefined): string {
  if (!action) return '—';
  return AUDIT_ACTION_LABELS[action.toLowerCase()] ?? action;
}
