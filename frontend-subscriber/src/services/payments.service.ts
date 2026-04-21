import { api } from '@/lib/api';
import type { ApiResponse } from '@/lib/api';

export interface Subscription {
  id: string;
  subscriber_id: string;
  plan_id: string;
  status: string;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
}

export interface Plan {
  id: string;
  name: string;
  price_monthly: number | string;
}

export interface SubscriptionWithPlan {
  subscription: Subscription;
  plan: Plan;
}

export interface Payment {
  id: string;
  subscription_id: string;
  amount: number | string;
  status: string;
  payment_method: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface PaginatedPayments {
  data: Payment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const paymentsService = {
  /** Current subscription + plan. */
  async getSubscription(): Promise<ApiResponse<SubscriptionWithPlan | null>> {
    return api.get<SubscriptionWithPlan | null>('/payments/subscription');
  },

  /** Paginated payment history. */
  async getHistory(
    page = 1,
    limit = 10,
  ): Promise<ApiResponse<PaginatedPayments>> {
    return api.get<PaginatedPayments>(
      `/payments/history?page=${page}&limit=${limit}`,
    );
  },

  /** Create a Stripe Customer Portal session and return the URL to redirect to. */
  async createPortalSession(): Promise<ApiResponse<{ portal_url: string }>> {
    return api.post<{ portal_url: string }>('/payments/portal', {});
  },
};
