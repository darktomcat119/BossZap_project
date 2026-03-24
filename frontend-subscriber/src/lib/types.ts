// ─── Subscriber / Profile ────────────────────────────────────────────────────

export interface SubscriberProfile {
  id: string;
  phone: string;
  business_name: string | null;
  owner_name: string | null;
  email: string | null;
  address: string | null;
  logo_url: string | null;
  preferred_language: string;
  status: string;
  plan_id: string | null;
  plan: Plan | null;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  features: Record<string, unknown>;
  status: string;
  created_at: string;
  updated_at: string;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface LoginPayload {
  phone: string;
  password: string;
}

export interface RegisterPayload {
  phone: string;
  password: string;
  business_name?: string;
  owner_name?: string;
  email?: string;
}

export interface AuthResponse {
  subscriber: SubscriberProfile;
  tokens: AuthTokens;
}

// ─── Financial Records ───────────────────────────────────────────────────────

export type FinancialRecordType = 'income' | 'expense';

export interface FinancialRecord {
  id: string;
  subscriber_id: string;
  type: FinancialRecordType;
  amount: number;
  description: string | null;
  category: string | null;
  reference_person: string | null;
  record_date: string;
  created_at: string;
  updated_at: string;
}

export interface FinancialRecordCreate {
  type: FinancialRecordType;
  amount: number;
  description?: string;
  category?: string;
  reference_person?: string;
  record_date: string;
}

export interface FinancialSummary {
  total_income: number;
  total_expense: number;
  net: number;
  count: number;
}

export interface CategoryBreakdown {
  category: string;
  total: number;
  count: number;
}

export interface DailyTotal {
  date: string;
  income: number;
  expense: number;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expense: number;
  net: number;
}

export interface FinancialRecordsParams {
  type?: FinancialRecordType;
  category?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ─── Events ──────────────────────────────────────────────────────────────────

export type EventStatus = 'scheduled' | 'completed' | 'cancelled';

export interface CalendarEvent {
  id: string;
  subscriber_id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  location: string | null;
  status: EventStatus;
  created_at: string;
  updated_at: string;
}

export interface CalendarEventCreate {
  title: string;
  description?: string;
  event_date: string;
  event_time?: string;
  location?: string;
}

export interface CalendarEventUpdate {
  title?: string;
  description?: string;
  event_date?: string;
  event_time?: string;
  location?: string;
}

export interface EventsParams {
  status?: EventStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CalendarDay {
  date: string;
  events: CalendarEvent[];
}

// ─── Budgets ─────────────────────────────────────────────────────────────────

export type BudgetStatus = 'draft' | 'sent' | 'accepted' | 'rejected';

export interface BudgetItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Budget {
  id: string;
  subscriber_id: string;
  document_type: string;
  document_number: string | null;
  client_name: string | null;
  client_phone: string | null;
  client_email: string | null;
  description: string | null;
  items: BudgetItem[];
  total_amount: number;
  status: BudgetStatus;
  pdf_url: string | null;
  valid_until: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BudgetCreate {
  document_type?: string;
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  description?: string;
  items: BudgetItem[];
  valid_until?: string;
  notes?: string;
}

export interface BudgetsParams {
  status?: BudgetStatus;
  search?: string;
  page?: number;
  limit?: number;
}

// ─── Profile Update ──────────────────────────────────────────────────────────

export interface ProfileUpdate {
  business_name?: string;
  owner_name?: string;
  email?: string;
  address?: string;
  preferred_language?: string;
}

// ─── WebSocket events ────────────────────────────────────────────────────────

export type WebSocketEventName =
  | 'financial:created'
  | 'event:created'
  | 'budget:created'
  | 'subscription:updated';

export interface WebSocketEventMap {
  'financial:created': FinancialRecord;
  'event:created': CalendarEvent;
  'budget:created': Budget;
  'subscription:updated': { subscriber_id: string; status: string; plan_id: string | null };
}
