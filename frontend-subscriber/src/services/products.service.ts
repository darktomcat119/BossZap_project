import { api } from '@/lib/api';
import type { ApiResponse } from '@/lib/api';
import type {
  Product,
  CreateProductPayload,
  UpdateProductPayload,
  ProductsParams,
} from '@/lib/types';

export const productsService = {
  async list(params: ProductsParams = {}): Promise<ApiResponse<Product[]>> {
    const search = new URLSearchParams();
    if (params.type) search.set('type', params.type);
    if (params.search) search.set('search', params.search);
    if (params.includeInactive) search.set('includeInactive', 'true');
    const qs = search.toString();
    return api.get<Product[]>(`/products${qs ? `?${qs}` : ''}`);
  },

  async create(data: CreateProductPayload): Promise<ApiResponse<Product>> {
    return api.post<Product>('/products', data);
  },

  async update(
    id: string,
    data: UpdateProductPayload,
  ): Promise<ApiResponse<Product>> {
    return api.patch<Product>(`/products/${id}`, data);
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/products/${id}`);
  },
};
