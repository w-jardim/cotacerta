import { apiClient } from '../../lib/api-client';
import type { AuthResponse, LoginCredentials, RegisterData, User } from './types';

export const authApi = {
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  async me(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },
};
