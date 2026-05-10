import { api } from '@/lib/api';
import type { ApiResponse } from '@/lib/api';
import type { SubscriberProfile, ProfileUpdate } from '@/lib/types';

export const profileService = {
  /** Get the current subscriber's profile. */
  async getProfile(): Promise<ApiResponse<SubscriberProfile>> {
    return api.get<SubscriberProfile>('/auth/profile');
  },

  /** Update profile fields (business name, email, address, etc.). */
  async updateProfile(
    data: ProfileUpdate,
  ): Promise<ApiResponse<SubscriberProfile>> {
    return api.patch<SubscriberProfile>('/auth/profile', data);
  },

  /** Upload a business logo. Accepts a File object. */
  async uploadLogo(
    file: File,
  ): Promise<ApiResponse<{ logo_url: string }>> {
    const formData = new FormData();
    formData.append('logo', file);
    return api.upload<{ logo_url: string }>('/auth/profile/logo', formData);
  },

  /**
   * Upload a business logo with real upload progress (0–100 callback).
   * Falls back to the no-progress upload on browsers without XHR support.
   */
  async uploadLogoWithProgress(
    file: File,
    onProgress: (percent: number) => void,
  ): Promise<ApiResponse<{ logo_url: string }>> {
    const formData = new FormData();
    formData.append('logo', file);
    return api.uploadWithProgress<{ logo_url: string }>(
      '/auth/profile/logo',
      formData,
      onProgress,
    );
  },
};
