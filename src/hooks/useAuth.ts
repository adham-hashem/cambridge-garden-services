import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiSend } from '@/lib/api';

type AdminUser = {
  username: string;
};

export function useAuth() {
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

  return { user, loading, signIn, signOut };
}
