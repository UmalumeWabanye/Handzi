import { API_ORIGIN as ORIGIN } from '@/api/config';
import { tokenStore } from '@/api/tokens';


/** Resolve an upload path from the API into an absolute URL. */
export const assetUrl = (path?: string | null) => (!path ? undefined : path.startsWith('/') ? `${ORIGIN}${path}` : path);

/** Image source for expo-image. Private uploads (ID, selfie, certificates) need the auth header. */
export function assetSource(path?: string | null) {
  const uri = assetUrl(path);
  if (!uri) return undefined;
  const isPrivate = path?.includes('/uploads/private/');
  const token = tokenStore.getAccess();
  return isPrivate && token ? { uri, headers: { Authorization: `Bearer ${token}` } } : { uri };
}
