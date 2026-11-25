import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { userApi } from '@/api/endpoints';
import { palette } from '@/ui/theme';

let currentToken: string | null = null;
export const getPushToken = () => currentToken;

// Live events already show an in-app toast, so don't also show a system banner while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: false, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

/**
 * Ask for permission and register this device's Expo push token with the API.
 * Returns null (silently) when push isn't available: simulators, permission denied,
 * no EAS project id yet, or Android in Expo Go (which no longer supports remote push).
 */
export async function registerForPush(): Promise<string | null> {
  try {
    if (!Device.isDevice) return null;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Jobs, quotes & messages',
        importance: Notifications.AndroidImportance.HIGH,
        lightColor: palette.orange,
      });
    }
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') ({ status } = await Notifications.requestPermissionsAsync());
    if (status !== 'granted') return null;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) {
      if (__DEV__) console.info('[push] No EAS projectId (run `eas init`); push notifications are disabled.');
      return null;
    }
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    await userApi.registerPushToken(data);
    currentToken = data;
    return data;
  } catch (e) {
    if (__DEV__) console.info('[push] unavailable:', (e as Error).message);
    return null;
  }
}
