import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Mode } from '@handyconnect/shared';
import { useQueryClient } from '@tanstack/react-query';
import { setSessionExpiredHandler } from '@/api/client';
import { authApi, RegisterInput, userApi } from '@/api/endpoints';
import { tokenStore } from '@/api/tokens';
import type { AuthResponse, GeoPoint, User } from '@/api/types';
import { getPushToken } from '@/lib/push';
import { disconnectSocket } from '@/lib/socket';

type AuthState = {
  user: User | null;
  ready: boolean; // finished restoring the session from secure storage
  devCode?: string; // development only: the last OTP, shown on the verify screen
  side: Mode; // which side of the platform the UI is showing (chosen on the start screen, then the active mode)
  chooseSide: (side: Mode) => void;
  login: (identifier: string, password: string) => Promise<User>;
  register: (input: Omit<RegisterInput, 'mode'>) => Promise<{ devCode?: string }>;
  verifyPhone: (code: string) => Promise<User>;
  resendOtp: () => Promise<{ devCode?: string }>;
  updateUser: (input: Parameters<typeof userApi.update>[0]) => Promise<User>;
  setUser: (user: User) => void;
  completeClientOnboarding: (input: { location: GeoPoint; interests?: string[]; avatar?: string }) => Promise<User>;
  switchMode: (mode: Mode) => Promise<User>;
  becomeHandyman: () => Promise<User>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const [user, setUserState] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [chosenSide, setChosenSide] = useState<Mode>('client');
  const [devCode, setDevCode] = useState<string | undefined>();

  const applySession = useCallback(async (res: AuthResponse) => {
    await tokenStore.save(res);
    setUserState(res.user);
    return res.user;
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(() => setUserState(null));
    (async () => {
      try {
        if (await tokenStore.load()) setUserState(await authApi.me());
      } catch {
        await tokenStore.clear();
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      ready,
      devCode,
      side: user?.activeMode ?? chosenSide,
      chooseSide: setChosenSide,
      login: async (identifier, password) => applySession(await authApi.login(identifier, password, chosenSide)),
      register: async (input) => {
        const res = await authApi.register({ ...input, mode: chosenSide });
        setDevCode(res.devCode);
        await applySession(res);
        return { devCode: res.devCode };
      },
      verifyPhone: async (code) => {
        if (!user) throw new Error('Not signed in');
        const res = await authApi.verifyOtp(user.phone, code);
        setDevCode(undefined);
        setUserState(res.user);
        return res.user;
      },
      resendOtp: async () => {
        const res = user ? await authApi.sendOtp(user.phone) : {};
        setDevCode(res.devCode);
        return res;
      },
      updateUser: async (input) => {
        const next = await userApi.update(input);
        setUserState(next);
        return next;
      },
      setUser: setUserState,
      completeClientOnboarding: async (input) => {
        const next = await userApi.completeClientOnboarding(input);
        setUserState(next);
        return next;
      },
      switchMode: async (mode) => applySession(await userApi.switchMode(mode)),
      becomeHandyman: async () => applySession(await userApi.becomeHandyman()),
      logout: async () => {
        try {
          await authApi.logout(getPushToken()); // stop pushes to this device
        } catch {
          // Clear locally even if the server can't be reached.
        }
        disconnectSocket();
        await tokenStore.clear();
        qc.clear();
        setUserState(null);
      },
    }),
    [user, ready, chosenSide, devCode, applySession, qc]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
