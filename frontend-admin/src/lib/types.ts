// ── Subscriber ──
export type SubscriberStatus = 'active' | 'inactive' | 'suspended';

export interface Subscriber {
  id: string;
  name: string;
  phone: string;
  status: SubscriberStatus;
  plan: string;
  messages: number;
  revenue: number;
  joinedAt: string;
  lastActive: string;
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
  maxBudgets: number;
  maxMessages: number;
  maxAiCalls: number;
  trialDays: number;
  active: boolean;
  subscriberCount: number;
}

export interface PlanFormData {
  name: string;
  price: number;
  maxBudgets: number;
  maxMessages: number;
  maxAiCalls: number;
  trialDays: number;
}

// ── Payment ──
export type PaymentStatus = 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'credit_card' | 'bank_transfer' | 'pix';
export type RecoveryStatus = 'recovered' | 'pending' | 'abandoned';

export interface Payment {
  id: string;
  subscriberName: string;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  date: string;
  recoveryStatus?: RecoveryStatus;
}

// ── Metrics ──
export interface MetricsOverview {
  totalSubscribers: number;
  activeSubscribers: number;
  monthlyRevenue: number;
  messagesToday: number;
  totalMessages: number;
  totalAiCalls: number;
  totalPdfs: number;
}

export interface UsageStats {
  date: string;
  messages: number;
  aiCalls: number;
  pdfs: number;
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
export type AuditAction = 'created' | 'updated' | 'deleted' | 'login' | 'export';

export interface AuditLog {
  id: string;
  timestamp: string;
  subscriber: string;
  action: AuditAction;
  entity: string;
  details: Record<string, unknown>;
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
  metaStatus: TemplateStatus;
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
  subscribers: number;
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
