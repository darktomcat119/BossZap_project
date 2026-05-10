import { api } from '@/lib/api';
import type { ApiResponse } from '@/lib/api';
import type {
  SubscriberCategory,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from '@/lib/types';

export const categoriesService = {
  async list(): Promise<ApiResponse<SubscriberCategory[]>> {
    return api.get<SubscriberCategory[]>('/subscriber-categories');
  },

  async create(data: CreateCategoryPayload): Promise<ApiResponse<SubscriberCategory>> {
    return api.post<SubscriberCategory>('/subscriber-categories', data);
  },

  async update(id: string, data: UpdateCategoryPayload): Promise<ApiResponse<SubscriberCategory>> {
    return api.patch<SubscriberCategory>(`/subscriber-categories/${id}`, data);
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/subscriber-categories/${id}`);
  },

  /** Seed the standard Brazilian MEI category set (idempotent). */
  async seedDefaults(): Promise<ApiResponse<SubscriberCategory[]>> {
    return api.post<SubscriberCategory[]>(
      '/subscriber-categories/seed-defaults',
      {},
    );
  },
};
