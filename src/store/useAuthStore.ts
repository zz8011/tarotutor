import { create } from 'zustand';
import * as authApi from '../services/api/auth';
import { setToken, getToken } from '../services/api/client';

interface AuthState {
  user: authApi.AuthUser | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nickname?: string) => Promise<void>;
  logout: () => void;
  bootstrap: () => Promise<void>; // 启动时若有 token 拉用户
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  error: null,
  initialized: false,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { token, user } = await authApi.login(email, password);
      setToken(token);
      set({ user, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  register: async (email, password, nickname) => {
    set({ loading: true, error: null });
    try {
      const { token, user } = await authApi.register(email, password, nickname);
      setToken(token);
      set({ user, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  logout: () => { setToken(null); set({ user: null }); },

  bootstrap: async () => {
    if (!getToken()) { set({ initialized: true }); return; }
    try {
      const { user } = await authApi.me();
      set({ user, initialized: true });
    } catch {
      setToken(null);
      set({ user: null, initialized: true });
    }
  },
}));
