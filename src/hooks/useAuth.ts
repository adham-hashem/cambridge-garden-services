import { createContext, createElement, useState, useEffect, useCallback, useContext, type ReactNode } from 'react';
import { apiGet, apiSend } from '@/lib/api';

type AdminUser = {
  username: string;
};

type AuthContextValue = {
  user: AdminUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: unknown | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<{ authenticated: boolean; user: AdminUser | null }>('/api/admin/session')
      .then((session) => setUser(session.authenticated ? session.user : null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const session = await apiSend<{ authenticated: boolean; user: AdminUser }>('/api/admin/login', 'POST', {
        username: email,
        password,
      });
      setUser(session.user);
      return { error: null };
    } catch (error) {
      return { error };
    }
  }, []);

  const signOut = useCallback(async () => {
    await apiSend('/api/admin/logout', 'POST').catch(() => undefined);
    setUser(null);
  }, []);

  return createElement(AuthContext.Provider, { value: { user, loading, signIn, signOut } }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
