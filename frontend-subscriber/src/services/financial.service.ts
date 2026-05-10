import { api } from '@/lib/api';
import type { ApiResponse } from '@/lib/api';
import type {
  FinancialRecord,
  FinancialRecordCreate,
  FinancialRecordsParams,
  FinancialSummary,
  CategoryBreakdown,
  DailyTotal,
  MonthlyTrend,
  FinancialRecordType,
} from '@/lib/types';

function toQuery(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== '',
  );
  if (entries.length === 0) return '';
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}

export const financialService = {
  /** List financial records with optional filters and pagination. */
  async getRecords(
    params: FinancialRecordsParams = {},
  ): Promise<ApiResponse<FinancialRecord[]>> {
    const qs = toQuery({
      type: params.type,
      category: params.category,
      startDate: params.startDate,
      endDate: params.endDate,
      search: params.search,
      page: params.page,
      limit: params.limit,
    });
    return api.get<FinancialRecord[]>(`/financial${qs}`);
  },

  /** Get income/expense summary for a date range. */
  async getSummary(
    startDate: string,
    endDate: string,
  ): Promise<ApiResponse<FinancialSummary>> {
    const qs = toQuery({ startDate, endDate });
    return api.get<FinancialSummary>(`/financial/summary${qs}`);
  },

  /** Get category breakdown for a date range and optional record type. */
  async getCategories(
    startDate: string,
    endDate: string,
    type?: FinancialRecordType,
  ): Promise<ApiResponse<CategoryBreakdown[]>> {
    const qs = toQuery({ startDate, endDate, type });
    return api.get<CategoryBreakdown[]>(`/financial/categories${qs}`);
  },

  /** Get daily income/expense totals for a date range. */
  async getDailyTotals(
    startDate: string,
    endDate: string,
  ): Promise<ApiResponse<DailyTotal[]>> {
    const qs = toQuery({ startDate, endDate });
    return api.get<DailyTotal[]>(`/financial/daily${qs}`);
  },

  /** Get monthly income/expense/net trend. */
  async getMonthlyTrend(
    months?: number,
  ): Promise<ApiResponse<MonthlyTrend[]>> {
    const qs = months !== undefined ? toQuery({ months }) : '';
    return api.get<MonthlyTrend[]>(`/financial/monthly${qs}`);
  },

  /** Create a new financial record. */
  async createRecord(
    data: FinancialRecordCreate,
  ): Promise<ApiResponse<FinancialRecord>> {
    return api.post<FinancialRecord>('/financial', data);
  },

  /** Delete a financial record permanently. */
  async deleteRecord(id: string): Promise<ApiResponse<void>> {
    return api.delete<void>(`/financial/${id}`);
  },

  /** Export records to CSV. Returns a Blob download URL. */
  async exportCsv(
    startDate: string,
    endDate: string,
    type?: FinancialRecordType,
  ): Promise<Blob> {
    const qs = toQuery({ startDate, endDate, type });
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('access_token')
        : null;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const API_URL =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const res = await fetch(`${API_URL}/api/v1/financial/export${qs}`, {
      headers,
    });

    if (!res.ok) {
      throw new Error(`CSV export failed with status ${res.status}`);
    }

    return res.blob();
  },
};
