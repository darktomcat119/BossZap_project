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

function redirectToLogin(): void {
  if (typeof window === 'undefined') return;
  // Preserve the current locale prefix so users don't bounce through
  // the middleware an extra time and lose context.
  const match = window.location.pathname.match(/^\/(pt-BR|es|en)(\/|$)/);
  const locale = match ? match[1] : 'pt-BR';
  window.location.href = `/${locale}/login`;
}

async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  const token = getAccessToken();

  // Never force a Content-Type when the caller passes a FormData body —
  // fetch sets the correct multipart/form-data boundary automatically.
  const isFormData =
    typeof FormData !== 'undefined' && options?.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
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
    redirectToLogin();
    throw new Error('Unauthorized');
  }

  // Some error responses aren't JSON — guard so we don't throw on parse.
  let body: ApiResponse<T>;
  try {
    body = (await response.json()) as ApiResponse<T>;
  } catch {
    body = {
      success: false,
      data: null as unknown as T,
      error: {
        code: 'PARSE_ERROR',
        message: `Non-JSON response from ${path} (status ${response.status})`,
        details: [],
      },
    };
  }

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

  /**
   * Upload a file with progress callbacks. Uses XMLHttpRequest because
   * the fetch API doesn't expose upload progress events. The onProgress
   * callback receives a 0–100 integer percent.
   */
  uploadWithProgress<T>(
    path: string,
    formData: FormData,
    onProgress: (percent: number) => void,
  ): Promise<ApiResponse<T>> {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_URL}/api/v1${path}`);

      const token = getAccessToken();
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        const status = xhr.status;
        let body: unknown = null;
        try {
          body = xhr.responseText ? JSON.parse(xhr.responseText) : null;
        } catch {
          body = null;
        }
        if (status >= 200 && status < 300) {
          // Backend returns either { success, data } or the raw payload
          const env = body as { success?: boolean; data?: unknown } | null;
          if (env && typeof env.success === 'boolean') {
            resolve(env as ApiResponse<T>);
          } else {
            resolve({ success: true, data: body as T });
          }
        } else {
          const errorBody = body as { error?: ApiError; message?: string } | null;
          resolve({
            success: false,
            data: null as unknown as T,
            error: errorBody?.error ?? {
              code: String(status),
              message: errorBody?.message ?? `Upload failed (${status})`,
              details: [],
            },
          });
        }
      };

      xhr.onerror = () => {
        resolve({
          success: false,
          data: null as unknown as T,
          error: {
            code: 'NETWORK',
            message: 'Network error during upload',
            details: [],
          },
        });
      };

      xhr.send(formData);
    });
  },
};
