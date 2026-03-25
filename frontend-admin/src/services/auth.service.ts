const API_BASE =
  process.env.NEXT_PUBLIC_ADMIN_API_URL ?? 'http://localhost:4000/api/v1/admin';

type LoginResponse = {
  access_token: string;
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

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(body.message ?? 'Login failed');
  }

  const data: LoginResponse = await res.json();
  localStorage.setItem('admin_access_token', data.access_token);
  return data.access_token;
}

export function adminLogout(): void {
  localStorage.removeItem('admin_access_token');
}
