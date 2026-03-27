import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';
import type { AuthResponse, LoginCredentials, UserProfile } from '../types';

export function createAuthApi(client: ApiClient) {
  return {
    login: (credentials: LoginCredentials) =>
      client.post<AuthResponse & { refresh_token: string }>(
      '/api/auth/login',
      credentials,
      { skipBrandContext: true },
    ),

    getProfile: () =>
      client.get<UserProfile>('/api/auth/profile', { skipBrandContext: true }),

    refresh: (refreshToken: string) =>
      client.post<{ access_token: string; refresh_token: string }>(
      '/api/auth/refresh',
      { refresh_token: refreshToken },
      { skipBrandContext: true },
    ),
  };
}

export const authApi = createAuthApi(apiClient);
export type AuthApi = ReturnType<typeof createAuthApi>;
