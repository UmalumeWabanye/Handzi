import * as SecureStore from 'expo-secure-store';

const ACCESS = 'hc.accessToken';
const REFRESH = 'hc.refreshToken';

export type Tokens = { accessToken: string; refreshToken: string };

let accessCache: string | null = null;

export const tokenStore = {
  async load() {
    accessCache = await SecureStore.getItemAsync(ACCESS);
    const refreshToken = await SecureStore.getItemAsync(REFRESH);
    return accessCache && refreshToken ? { accessToken: accessCache, refreshToken } : null;
  },
  getAccess: () => accessCache,
  getRefresh: () => SecureStore.getItemAsync(REFRESH),
  async save({ accessToken, refreshToken }: Tokens) {
    accessCache = accessToken;
    await SecureStore.setItemAsync(ACCESS, accessToken);
    await SecureStore.setItemAsync(REFRESH, refreshToken);
  },
  async clear() {
    accessCache = null;
    await SecureStore.deleteItemAsync(ACCESS);
    await SecureStore.deleteItemAsync(REFRESH);
  },
};
