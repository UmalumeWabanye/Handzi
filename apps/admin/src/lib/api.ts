// Minimal fetch client for the admin API (same-origin through the Vite proxy in dev).
// Access token lives in memory; the refresh token in localStorage so a reload keeps the session.

const BASE = import.meta.env.VITE_API_URL || '/api/v1';
const REFRESH_KEY = 'hc.admin.refresh';

let accessToken: string | null = null;
let onLogout: (() => void) | null = null;

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: { field: string; message: string }[]) {
    super(message);
  }
}

export const session = {
  set(access: string, refresh: string) {
    accessToken = access;
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    accessToken = null;
    localStorage.removeItem(REFRESH_KEY);
  },
  hasRefresh: () => !!localStorage.getItem(REFRESH_KEY),
  access: () => accessToken,
  onLogout: (fn: () => void) => {
    onLogout = fn;
  },
};

let refreshing: Promise<boolean> | null = null;
async function refresh(): Promise<boolean> {
  const token = localStorage.getItem(REFRESH_KEY);
  if (!token) return false;
  refreshing ??= fetch(`${BASE}/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: token }) })
    .then(async (r) => {
      if (!r.ok) return false;
      const d = await r.json();
      session.set(d.accessToken, d.refreshToken);
      return true;
    })
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

type Options = { method?: string; body?: unknown; query?: Record<string, string | number | boolean | undefined | null> };

export async function api<T>(path: string, { method = 'GET', body, query }: Options = {}, retried = false): Promise<T> {
  const qs = query
    ? '?' +
      Object.entries(query)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
    : '';
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}${qs}`, {
      method,
      headers: { ...(body !== undefined && { 'Content-Type': 'application/json' }), ...(accessToken && { Authorization: `Bearer ${accessToken}` }) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, OFFLINE);
  }
  // The dev proxy answers 502/504 (or 500 with no JSON) when the API itself isn't running.
  if ([502, 503, 504].includes(res.status) || (res.status === 500 && !res.headers.get('content-type')?.includes('json'))) {
    throw new ApiError(res.status, OFFLINE);
  }
  if (res.status === 401 && !retried && !path.startsWith('/auth/')) {
    if (await refresh()) return api<T>(path, { method, body, query }, true);
    session.clear();
    onLogout?.();
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.details?.[0]?.message || data.message || `Request failed (${res.status})`, data.details);
  return data as T;
}

export const errorText = (e: unknown) => (e instanceof Error ? e.message : 'Sorry, something broke on our side. Try again?');

const OFFLINE = "We can't reach the Handzi API. Make sure it's running (npm run api) and try again.";

/** Fetch a private upload (ID documents etc.) with the admin's token and return an object URL. */
export async function fetchPrivateImage(path: string, retried = false): Promise<string> {
  const res = await fetch(path, { headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {} });
  if (res.status === 401 && !retried && (await refresh())) return fetchPrivateImage(path, true);
  if (!res.ok) throw new ApiError(res.status, 'Could not load image');
  return URL.createObjectURL(await res.blob());
}

export { refresh as refreshSession };
