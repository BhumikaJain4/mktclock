import { request } from './api';
import { AuthMeResponse, Student } from '../types';

export const authService = {
  async getMe(): Promise<AuthMeResponse> {
    return request<AuthMeResponse>('/api/auth/me');
  },

  async loginGoogle(credential: string): Promise<{ success: boolean; student: Student; token: string }> {
    return request<{ success: boolean; student: Student; token: string }>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    });
  },

  async logout(): Promise<{ success: boolean }> {
    return request<{ success: boolean }>('/api/auth/logout', {
      method: 'POST',
    });
  },
};
