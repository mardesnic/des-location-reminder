import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Linking } from 'react-native';

import { ensureNotificationChannel } from '@/lib/notifications';

export type PermissionState = {
  notifications: boolean;
  foreground: boolean;
  background: boolean;
};

export const allGranted = (p: PermissionState) => p.notifications && p.foreground && p.background;

export async function getPermissionState(): Promise<PermissionState> {
  const [notifications, foreground, background] = await Promise.all([
    Notifications.getPermissionsAsync(),
    Location.getForegroundPermissionsAsync(),
    Location.getBackgroundPermissionsAsync(),
  ]);
  return {
    notifications: notifications.granted,
    foreground: foreground.granted,
    background: background.granted,
  };
}

/**
 * Asks for everything in the order the OS requires: notifications, then location
 * while using the app, then "Allow all the time". On Android 11+ the last step
 * opens system settings. Falls back to app settings if something was denied for good.
 */
export async function requestPermissions(): Promise<PermissionState> {
  await ensureNotificationChannel();
  const notifications = await Notifications.requestPermissionsAsync();

  const foreground = await Location.requestForegroundPermissionsAsync();
  if (!foreground.granted) {
    if (!foreground.canAskAgain) await Linking.openSettings();
    return getPermissionState();
  }

  const background = await Location.requestBackgroundPermissionsAsync();
  if (!background.granted && !background.canAskAgain) await Linking.openSettings();

  if (!notifications.granted && !notifications.canAskAgain) await Linking.openSettings();
  return getPermissionState();
}
