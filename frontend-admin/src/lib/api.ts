const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin`
  : 'http://localhost:3000/api/v1/admin';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_access_token');
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

  const payload = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: unknown;
    error?: { message?: string };
    message?: string;
  };

  if (res.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_refresh_token');
    // Preserve the locale prefix currently in the URL so the redirect
    // doesn't bounce across languages.
    const localeMatch = window.location.pathname.match(/^\/(pt-BR|es|en)(\/|$)/);
    const locale = localeMatch ? localeMatch[1] : 'pt-BR';
    window.location.href = `/${locale}/login`;
    // Prevent callers from using `undefined` between the assignment above
    // and the actual navigation.
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    throw new Error(
      payload.error?.message ?? payload.message ?? 'Request failed',
    );
  }

  // Unwrap the standard {success, data} envelope so callers receive just data.
  return (payload.data !== undefined ? payload.data : payload) as T;
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
  resetPassword: (id: string) => request(`/subscribers/${id}/reset-password`, { method: 'POST' }),
  getLogs: (id: string, page = 1) => request(`/subscribers/${id}/logs?page=${page}&limit=50`),
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
  failedJobs: () => request('/health/failed-jobs'),
  cleanFailedJobs: () => request('/health/failed-jobs/clean', { method: 'POST' }),
};

// ── Notifications ──
export const notificationsApi = {
  list: () => request('/notifications'),
  summary: () => request('/notifications/summary'),
};

// ── Profile ──
export const profileApi = {
  get: () => request('/profile'),
  update: (data: { email?: string; preferred_language?: string }) =>
    request('/profile', { method: 'PATCH', body: data }),
  changePassword: (current_password: string, new_password: string) =>
    request('/profile/change-password', {
      method: 'POST',
      body: { current_password, new_password },
    }),
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
