const API_BASE = process.env.NEXT_PUBLIC_ADMIN_API_URL ?? 'http://localhost:4000/api/v1/admin';

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
  activate: (id: string) => request(`/subscribers/${id}/activate`, { method: 'POST' }),
  suspend: (id: string) => request(`/subscribers/${id}/suspend`, { method: 'POST' }),
  deactivate: (id: string) => request(`/subscribers/${id}/deactivate`, { method: 'POST' }),
};

// ── Plans ──
export const plansApi = {
  list: () => request('/plans'),
  create: (data: unknown) => request('/plans', { method: 'POST', body: data }),
  update: (id: string, data: unknown) => request(`/plans/${id}`, { method: 'PUT', body: data }),
  deactivate: (id: string) => request(`/plans/${id}/deactivate`, { method: 'POST' }),
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
  usage: (days?: number) => request(`/metrics/usage${days ? `?days=${days}` : ''}`),
  topSubscribers: () => request('/metrics/top-subscribers'),
  costs: () => request('/metrics/costs'),
};

// ── Logs ──
export const logsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : '';
    return request(`/logs${qs}`);
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
    return request(`/templates${qs}`);
  },
  create: (data: unknown) => request('/templates', { method: 'POST', body: data }),
  update: (id: string, data: unknown) => request(`/templates/${id}`, { method: 'PUT', body: data }),
};
