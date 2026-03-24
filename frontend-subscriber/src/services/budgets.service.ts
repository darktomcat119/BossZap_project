import { api } from '@/lib/api';
import type { ApiResponse } from '@/lib/api';
import type { Budget, BudgetCreate, BudgetStatus, BudgetsParams } from '@/lib/types';

function toQuery(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== '',
  );
  if (entries.length === 0) return '';
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}

export const budgetsService = {
  /** List budgets with optional filters and pagination. */
  async getAll(params: BudgetsParams = {}): Promise<ApiResponse<Budget[]>> {
    const qs = toQuery({
      status: params.status,
      search: params.search,
      page: params.page,
      limit: params.limit,
    });
    return api.get<Budget[]>(`/budgets${qs}`);
  },

  /** Get a single budget by ID. */
  async getById(id: string): Promise<ApiResponse<Budget>> {
    return api.get<Budget>(`/budgets/${id}`);
  },

  /** Create a new budget / quotation. */
  async create(data: BudgetCreate): Promise<ApiResponse<Budget>> {
    return api.post<Budget>('/budgets', data);
  },

  /** Update the status of a budget (draft -> sent -> accepted / rejected). */
  async updateStatus(
    id: string,
    status: BudgetStatus,
  ): Promise<ApiResponse<Budget>> {
    return api.patch<Budget>(`/budgets/${id}/status`, { status });
  },

  /** Generate (or regenerate) the PDF for a budget. Returns the updated budget with pdf_url. */
  async generatePdf(id: string): Promise<ApiResponse<Budget>> {
    return api.post<Budget>(`/budgets/${id}/pdf`, {});
  },
};
