import { IAuthService } from '../api/authService';
import { mockStorage } from './mockStorage';
import {
  User,
  AuthSession,
  LoginCredentials,
  RegisterData,
  ChangePasswordData,
  ApiResponse,
  TwoFactorSetupResponse,
} from '../../types';

export class MockAuthService implements IAuthService {
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthSession>> {
    await mockStorage.delay(350);
    const users = mockStorage.getUsers();

    // Check by email
    const user = users.find((u) => u.email.toLowerCase() === credentials.email.toLowerCase());

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (user.status === 'banned') {
      throw new Error('This account has been suspended by platform administration.');
    }

    const session: AuthSession = {
      user,
      token: `mock_jwt_token_${user.id}_${Date.now()}`,
      refreshToken: `mock_refresh_token_${user.id}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    localStorage.setItem('shopsphere_session', JSON.stringify(session));

    return {
      success: true,
      data: session,
      message: 'Login successful',
    };
  }

  async register(data: RegisterData): Promise<ApiResponse<AuthSession>> {
    await mockStorage.delay(400);
    const users = mockStorage.getUsers();

    const existing = users.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      email: data.email,
      fullName: data.fullName,
      role: data.role || 'customer',
      status: 'active',
      phoneNumber: data.phoneNumber,
      emailVerified: true,
      twoFactorEnabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      addresses: [],
    };

    users.push(newUser);
    mockStorage.saveUsers(users);

    const session: AuthSession = {
      user: newUser,
      token: `mock_jwt_token_${newUser.id}_${Date.now()}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    localStorage.setItem('shopsphere_session', JSON.stringify(session));

    return {
      success: true,
      data: session,
      message: 'Account created successfully',
    };
  }

  async logout(): Promise<ApiResponse<{ success: boolean }>> {
    await mockStorage.delay(100);
    localStorage.removeItem('shopsphere_session');
    return {
      success: true,
      data: { success: true },
      message: 'Logged out successfully',
    };
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    await mockStorage.delay(150);
    const sessionStr = localStorage.getItem('shopsphere_session');
    if (!sessionStr) {
      throw new Error('No active session');
    }

    const session: AuthSession = JSON.parse(sessionStr);
    const users = mockStorage.getUsers();
    const user = users.find((u) => u.id === session.user.id);

    if (!user) {
      throw new Error('User not found');
    }

    return {
      success: true,
      data: user,
    };
  }

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    await mockStorage.delay(300);
    const sessionStr = localStorage.getItem('shopsphere_session');
    if (!sessionStr) throw new Error('Not authenticated');

    const session: AuthSession = JSON.parse(sessionStr);
    const users = mockStorage.getUsers();
    const index = users.findIndex((u) => u.id === session.user.id);

    if (index === -1) throw new Error('User not found');

    const updatedUser: User = {
      ...users[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    users[index] = updatedUser;
    mockStorage.saveUsers(users);

    // Sync session
    session.user = updatedUser;
    localStorage.setItem('shopsphere_session', JSON.stringify(session));

    return {
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully',
    };
  }

  async changePassword(_data: ChangePasswordData): Promise<ApiResponse<{ success: boolean }>> {
    await mockStorage.delay(300);
    return {
      success: true,
      data: { success: true },
      message: 'Password changed successfully',
    };
  }

  async requestPasswordReset(_email: string): Promise<ApiResponse<{ success: boolean }>> {
    await mockStorage.delay(400);
    return {
      success: true,
      data: { success: true },
      message: 'Password reset link sent to your email address.',
    };
  }

  async setup2FA(): Promise<ApiResponse<TwoFactorSetupResponse>> {
    await mockStorage.delay(300);
    return {
      success: true,
      data: {
        secret: 'HX26E7V8B9K01LMN',
        qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/ShopSphere:Alex?secret=HX26E7V8B9K01LMN&issuer=ShopSphere',
        backupCodes: ['8912-3412', '9012-7721', '6621-0091', '1284-9901'],
      },
    };
  }

  async verify2FA(_code: string): Promise<ApiResponse<{ success: boolean }>> {
    await mockStorage.delay(200);
    return {
      success: true,
      data: { success: true },
      message: 'Two-Factor Authentication verified and enabled.',
    };
  }
}

export const mockAuthService = new MockAuthService();
