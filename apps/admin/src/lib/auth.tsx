import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, ApiError, refreshSession, session } from './api';

export type Admin = { id: string; firstName: string; lastName: string; email?: string; roles: string[] };
type AuthState = { admin: Admin | null; ready: boolean; login: (email: string, password: string) => Promise<void>; logout: () => Promise<void> };

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    session.onLogout(() => setAdmin(null));
    (async () => {
      try {
        if (session.hasRefresh() && (await refreshSession())) {
          const { user } = await api<{ user: Admin }>('/auth/me');
          if (user.roles.includes('admin')) setAdmin(user);
          else session.clear();
        }
      } catch {
        session.clear();
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      admin,
      ready,
      login: async (email, password) => {
        const res = await api<{ user: Admin; accessToken: string; refreshToken: string }>('/auth/login', { method: 'POST', body: { identifier: email, password } });
        if (!res.user.roles.includes('admin')) throw new ApiError(403, 'This account does not have admin access.');
        session.set(res.accessToken, res.refreshToken);
        setAdmin(res.user);
      },
      logout: async () => {
        await api('/auth/logout', { method: 'POST', body: {} }).catch(() => {});
        session.clear();
        qc.clear();
        setAdmin(null);
      },
    }),
    [admin, ready, qc]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
}
