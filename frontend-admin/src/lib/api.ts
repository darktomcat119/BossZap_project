const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin`
  : 'http://localhost:3000/api/v1/admin';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token');
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = opts;

  const token = getToken();
  const authHeaders: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? 'Request failed');
  }

  return res.json() as Promise<T>;
}

// ── Subscribers ──
export const subscribersApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : '';
    return request(`/subscribers${qs}`);
  },
  get: (id: string) => request(`/subscribers/${id}`),
  activate: (id: string) => request(`/subscribers/${id}/activate`, { method: 'PATCH' }),
  suspend: (id: string) => request(`/subscribers/${id}/suspend`, { method: 'PATCH' }),
  deactivate: (id: string) => request(`/subscribers/${id}/deactivate`, { method: 'PATCH' }),
};

// ── Plans ──
export const plansApi = {
  list: () => request('/plans'),
  create: (data: unknown) => request('/plans', { method: 'POST', body: data }),
  update: (id: string, data: unknown) => request(`/plans/${id}`, { method: 'PATCH', body: data }),
  deactivate: (id: string) => request(`/plans/${id}`, { method: 'DELETE' }),
};

// ── Payments ──
export const paymentsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : '';
    return request(`/payments${qs}`);
  },
  summary: () => request('/payments/summary'),
};

// ── Metrics ──
export const metricsApi = {
  overview: () => request('/metrics/overview'),
  growth: (months?: number) => request(`/metrics/growth${months ? `?months=${months}` : ''}`),
  revenue: (months?: number) => request(`/metrics/revenue${months ? `?months=${months}` : ''}`),
  usage: () => request('/metrics/usage'),
  topSubscribers: () => request('/metrics/top-subscribers'),
  costs: () => request('/metrics/costs'),
};

// ── Logs ──
export const logsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : '';
    return request(`/logs/audit${qs}`);
  },
};

// ── Health ──
export const healthApi = {
  status: () => request('/health'),
  queues: () => request('/health/queues'),
  workers: () => request('/health/workers'),
};

// ── Templates ──
export const templatesApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : '';
    return request(`/hsm-templates${qs}`);
  },
  create: (data: unknown) => request('/hsm-templates', { method: 'POST', body: data }),
  update: (id: string, data: unknown) => request(`/hsm-templates/${id}`, { method: 'PATCH', body: data }),
};
