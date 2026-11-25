import Constants from 'expo-constants';

// In development, reach the API on the same machine as the Expo dev server so physical devices work too.
function devApiUrl() {
  const host = Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost';
  return `http://${host}:5000/api/v1`;
}

export const API_URL = process.env.EXPO_PUBLIC_API_URL || devApiUrl();

/** Server origin (no /api/v1): used for uploads and the Socket.io connection. */
export const API_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, '');
