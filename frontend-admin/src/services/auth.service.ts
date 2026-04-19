const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin`
  : 'http://localhost:3000/api/v1/admin';

type LoginData = {
  access_token: string;
  refresh_token?: string;
};

type LoginResponse = {
  success: boolean;
  data?: LoginData;
  error?: { message?: string };
  // Some backends return tokens at top level; keep fallback for safety.
  access_token?: string;
  refresh_token?: string;
};

export async function adminLogin(
  email: string,
  password: string,
): Promise<string> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const body = (await res.json().catch(() => ({}))) as LoginResponse;

  if (!res.ok) {
    throw new Error(body.error?.message ?? 'Login failed');
  }

  const tokens = body.data ?? body;
  const accessToken = tokens.access_token;
  const refreshToken = tokens.refresh_token;

  if (!accessToken) {
    throw new Error('Login response missing access token');
  }

  localStorage.setItem('admin_access_token', accessToken);
  if (refreshToken) {
    localStorage.setItem('admin_refresh_token', refreshToken);
  }
  return accessToken;
}

export function adminLogout(): void {
  localStorage.removeItem('admin_access_token');
  localStorage.removeItem('admin_refresh_token');
}
