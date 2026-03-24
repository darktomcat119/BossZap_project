import { api, clearTokens } from '@/lib/api';
import type { ApiResponse } from '@/lib/api';
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  SubscriberProfile,
} from '@/lib/types';

export const authService = {
  /** Authenticate with phone + password. Returns tokens and subscriber profile. */
  async login(payload: LoginPayload): Promise<ApiResponse<AuthResponse>> {
    const res = await api.post<AuthResponse>('/auth/login', payload);

    if (res.success && res.data.tokens) {
      localStorage.setItem('access_token', res.data.tokens.access_token);
      localStorage.setItem('refresh_token', res.data.tokens.refresh_token);
    }

    return res;
  },

  /** Register a new subscriber account. */
  async register(payload: RegisterPayload): Promise<ApiResponse<AuthResponse>> {
    const res = await api.post<AuthResponse>('/auth/register', payload);

    if (res.success && res.data.tokens) {
      localStorage.setItem('access_token', res.data.tokens.access_token);
      localStorage.setItem('refresh_token', res.data.tokens.refresh_token);
    }

    return res;
  },

  /** Log out the current subscriber — clears tokens. */
  async logout(): Promise<void> {
    try {
      await api.post<void>('/auth/logout', {});
    } catch {
      // Swallow errors — we clear tokens regardless.
    } finally {
      clearTokens();
    }
  },

  /** Fetch the currently authenticated subscriber profile. */
  async getProfile(): Promise<ApiResponse<SubscriberProfile>> {
    return api.get<SubscriberProfile>('/auth/profile');
  },
};
