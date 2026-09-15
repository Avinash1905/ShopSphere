import { httpClient } from './httpClient';
import {
  User,
  AuthSession,
  LoginCredentials,
  RegisterData,
  ChangePasswordData,
  ApiResponse,
  TwoFactorSetupResponse,
} from '../../types';

export interface IAuthService {
  login(credentials: LoginCredentials): Promise<ApiResponse<AuthSession>>;
  register(data: RegisterData): Promise<ApiResponse<AuthSession>>;
  logout(): Promise<ApiResponse<{ success: boolean }>>;
  getCurrentUser(): Promise<ApiResponse<User>>;
  updateProfile(data: Partial<User>): Promise<ApiResponse<User>>;
  changePassword(data: ChangePasswordData): Promise<ApiResponse<{ success: boolean }>>;
  requestPasswordReset(email: string): Promise<ApiResponse<{ success: boolean }>>;
  setup2FA(): Promise<ApiResponse<TwoFactorSetupResponse>>;
  verify2FA(code: string): Promise<ApiResponse<{ success: boolean }>>;
}

export class ApiAuthService implements IAuthService {
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthSession>> {
    return httpClient.post<AuthSession>('/auth/login', credentials);
  }

  async register(data: RegisterData): Promise<ApiResponse<AuthSession>> {
    return httpClient.post<AuthSession>('/auth/register', data);
  }

  async logout(): Promise<ApiResponse<{ success: boolean }>> {
    return httpClient.post<{ success: boolean }>('/auth/logout');
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return httpClient.get<User>('/auth/me');
  }

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return httpClient.patch<User>('/auth/profile', data);
  }

  async changePassword(data: ChangePasswordData): Promise<ApiResponse<{ success: boolean }>> {
    return httpClient.post<{ success: boolean }>('/auth/change-password', data);
  }

  async requestPasswordReset(email: string): Promise<ApiResponse<{ success: boolean }>> {
    return httpClient.post<{ success: boolean }>('/auth/forgot-password', { email });
  }

  async setup2FA(): Promise<ApiResponse<TwoFactorSetupResponse>> {
    return httpClient.post<TwoFactorSetupResponse>('/auth/2fa/setup');
  }

  async verify2FA(code: string): Promise<ApiResponse<{ success: boolean }>> {
    return httpClient.post<{ success: boolean }>('/auth/2fa/verify', { code });
  }
}

export const apiAuthService = new ApiAuthService();
