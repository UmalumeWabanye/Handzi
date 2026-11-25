import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_URL } from './config';
import { tokenStore } from './tokens';

export const api = axios.create({ baseURL: API_URL, timeout: 15000 });

let onSessionExpired: (() => void) | null = null;
export const setSessionExpiredHandler = (fn: () => void) => {
  onSessionExpired = fn;
};

api.interceptors.request.use((config) => {
  const token = tokenStore.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Single in-flight refresh shared by all requests that hit a 401 at the same time.
let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await tokenStore.getRefresh();
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
    await tokenStore.save({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    return data.accessToken;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    // Credential endpoints return 401 for bad input, not expired sessions: don't try to refresh those.
    const isCredentialCall = /^\/auth\/(login|register|refresh|otp|password)/.test(original?.url ?? '');
    if (error.response?.status !== 401 || !original || original._retried || isCredentialCall) {
      throw error;
    }
    original._retried = true;
    refreshing ??= refreshAccessToken().finally(() => {
      refreshing = null;
    });
    const token = await refreshing;
    if (!token) {
      await tokenStore.clear();
      onSessionExpired?.();
      throw error;
    }
    original.headers.Authorization = `Bearer ${token}`;
    return api(original);
  }
);

// Turn API/network errors into a message suitable for the UI.
export function errorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string; details?: { message: string }[] } | undefined;
    if (data?.details?.length) return data.details[0].message;
    if (data?.message) return data.message;
    if (!err.response) return "We can't reach Handzi right now. Check your connection and try again.";
    if (err.response.status >= 500) return 'Sorry, something broke on our side. Try again?';
  }
  return 'Sorry, something broke on our side. Try again?';
}
