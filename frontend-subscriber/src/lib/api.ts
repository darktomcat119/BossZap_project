const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// ─── Shared response envelope ────────────────────────────────────────────────

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message: string;
  details: unknown[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
  error?: ApiError;
}

// ─── Token helpers ───────────────────────────────────────────────────────────

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refresh_token');
}

function setTokens(access: string, refresh: string): void {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

// ─── Token refresh ───────────────────────────────────────────────────────────

let refreshPromise: Promise<boolean> | null = null;

async function refreshToken(): Promise<boolean> {
  // De-duplicate concurrent refresh attempts
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const token = getRefreshToken();
    if (!token) return false;

    try {
      const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: token }),
      });

      if (!res.ok) return false;

      const body: ApiResponse<{ access_token: string; refresh_token: string }> =
        await res.json();

      if (body.success && body.data.access_token) {
        setTokens(body.data.access_token, body.data.refresh_token);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ─── Core fetch wrapper ──────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  const token = getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options?.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/api/v1${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    const refreshed = await refreshToken();
    if (refreshed) {
      return apiFetch<T>(path, options);
    }
    clearTokens();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  const body: ApiResponse<T> = await response.json();

  if (!response.ok && !body.error) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return body;
}

// ─── Convenience methods ─────────────────────────────────────────────────────

export const api = {
  get<T>(path: string): Promise<ApiResponse<T>> {
    return apiFetch<T>(path);
  },

  post<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
    return apiFetch<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  patch<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
    return apiFetch<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  delete<T>(path: string): Promise<ApiResponse<T>> {
    return apiFetch<T>(path, { method: 'DELETE' });
  },

  /** Upload a file via multipart/form-data (no JSON Content-Type). */
  upload<T>(path: string, formData: FormData): Promise<ApiResponse<T>> {
    const token = getAccessToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    return apiFetch<T>(path, {
      method: 'POST',
      headers,
      body: formData,
    });
  },
};
