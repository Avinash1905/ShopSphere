import { create } from 'zustand';
import { User, AuthSession, LoginCredentials, RegisterData } from '../types';
import { authService } from '../services';

interface AuthState {
  user: User | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  checkAuth: () => Promise<void>;
  switchUserRole: (role: 'customer' | 'seller' | 'admin') => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authService.login(credentials);
      set({
        user: res.data.user,
        session: res.data,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message || 'Login failed', isLoading: false });
      throw err;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authService.register(data);
      set({
        user: res.data.user,
        session: res.data,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message || 'Registration failed', isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
    } finally {
      set({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authService.updateProfile(data);
      set({ user: res.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Profile update failed', isLoading: false });
      throw err;
    }
  },

  checkAuth: async () => {
    try {
      const sessionStr = localStorage.getItem('shopsphere_session');
      if (sessionStr) {
        const session: AuthSession = JSON.parse(sessionStr);
        set({ user: session.user, session, isAuthenticated: true });
      }
    } catch {
      set({ user: null, session: null, isAuthenticated: false });
    }
  },

  switchUserRole: (role) => {
    const { user, session } = get();
    if (user && session) {
      const updatedUser: User = { ...user, role };
      const updatedSession: AuthSession = { ...session, user: updatedUser };
      localStorage.setItem('shopsphere_session', JSON.stringify(updatedSession));
      set({ user: updatedUser, session: updatedSession });
    }
  },

  clearError: () => set({ error: null }),
}));
