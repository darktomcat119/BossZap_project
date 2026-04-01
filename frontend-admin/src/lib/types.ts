// ── Paginated Response ──
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Subscriber ──
export type SubscriberStatus = 'active' | 'inactive' | 'suspended' | 'onboarding' | 'cancelled';

export interface Subscriber {
  id: string;
  business_name: string | null;
  owner_name: string;
  phone: string;
  email: string;
  status: SubscriberStatus;
  plan?: { id: string; name: string; price: number } | null;
  created_at: string;
  updated_at: string;
}

// ── Subscription ──
export interface Subscription {
  id: string;
  subscriberId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'past_due';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelledAt?: string;
}

// ── Plan ──
export interface Plan {
  id: string;
  name: string;
  price: number;
  max_budgets: number;
  max_messages: number;
  max_ai_calls: number;
  trial_days: number;
  is_active: boolean;
  subscriber_count?: number;
}

export interface PlanFormData {
  name: string;
  price: number;
  max_budgets: number;
  max_messages: number;
  max_ai_calls: number;
  trial_days: number;
}

// ── Payment ──
export type PaymentStatus = 'succeeded' | 'failed' | 'refunded' | 'pending';
export type PaymentMethod = 'credit_card' | 'bank_transfer' | 'pix';
export type RecoveryStatus = 'recovered' | 'pending' | 'abandoned';

export interface Payment {
  id: string;
  subscriber_name?: string;
  amount: number;
  status: PaymentStatus;
  method?: PaymentMethod;
  paid_at: string;
  created_at: string;
  recovery_status?: RecoveryStatus;
}

export interface PaymentSummary {
  revenueToday: number;
  revenueWeek: number;
  revenueMonth: number;
}

// ── Metrics ──
export interface MetricsOverview {
  totalSubscribers: number;
  activeSubscribers: number;
  suspendedSubscribers: number;
  onboardingSubscribers: number;
  cancelledSubscribers: number;
  revenueThisMonth: number;
}

export interface UsageStatsResult {
  totalMessages: number;
  totalAiCalls: number;
  totalBudgets: number;
  topSubscribers: TopSubscriberUsage[];
}

export interface TopSubscriberUsage {
  subscriber_id: string;
  business_name: string | null;
  total_messages: number;
  total_ai_calls: number;
  total_budgets: number;
}

export interface UsageMetric {
  date: string;
  messages: number;
  aiCalls: number;
  pdfs: number;
}

export interface TopSubscriber {
  name: string;
  messages: number;
  aiCalls: number;
  pdfs: number;
}

export interface CostBreakdown {
  openai: number;
  storage: number;
  whatsapp: number;
}

// ── Logs ──
export type AuditAction = 'created' | 'updated' | 'deleted' | 'login' | 'export'
  | 'subscriber_activated' | 'subscriber_suspended' | 'subscriber_deactivated';

export interface AuditLog {
  id: string;
  created_at: string;
  subscriber_id: string;
  subscriber?: { business_name: string | null; owner_name: string } | null;
  action: string;
  entity_type: string;
  entity_id: string;
  details?: Record<string, unknown>;
}

// ── Health ──
export type ServiceStatus = 'operational' | 'down' | 'degraded';
export type WorkerState = 'running' | 'stopped' | 'idle';

export interface ServiceHealth {
  name: string;
  status: ServiceStatus;
  latency?: number;
}

export interface QueueMetrics {
  depth: number;
  processingRate: number;
  failedJobs: number;
}

export interface WorkerInfo {
  name: string;
  state: WorkerState;
  uptime: string;
  lastHeartbeat: string;
}

// ── Templates ──
export type TemplateStatus = 'approved' | 'rejected' | 'pending';
export type TemplateCategory = 'marketing' | 'utility' | 'authentication';

export interface HsmTemplate {
  id: string;
  name: string;
  language: string;
  category: TemplateCategory;
  meta_status: TemplateStatus;
  body: string;
}

export interface TemplateFormData {
  name: string;
  language: string;
  category: TemplateCategory;
  body: string;
}

// ── Charts ──
export interface GrowthDataPoint {
  month: string;
  count: number;
}

export interface RevenueDataPoint {
  month: string;
  revenue: number;
}

// ── Alerts ──
export type AlertType = 'payment_failed' | 'limit_warning';

export interface Alert {
  id: string;
  type: AlertType;
  name: string;
  percent?: number;
  timestamp: string;
}
