import { create } from 'zustand';
import { ToastMessage } from '../components/ui/Toast';

interface UiState {
  theme: 'light' | 'dark';
  toasts: ToastMessage[];
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;
  removeToast: (id: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  theme: 'dark',
  toasts: [],

  setTheme: (theme) => set({ theme }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastMessage = { ...toast, id };
    set((state) => ({ toasts: [...state.toasts, newToast] }));
  },

  dismissToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));

export const useUIStore = useUiStore;
