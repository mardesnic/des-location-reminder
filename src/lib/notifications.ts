import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Reminder } from '@/lib/db';

const CHANNEL_ID = 'reminders';

export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/** Android needs the channel to exist before the permission prompt can appear. */
export async function ensureNotificationChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Location reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  });
}

export async function showReminderNotification(reminder: Reminder) {
  const where = reminder.placeLabel || 'your place';
  const fallbackBody = reminder.trigger === 'enter' ? `You arrived at ${where}` : `You left ${where}`;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: reminder.title,
      body: reminder.note || fallbackBody,
      data: { reminderId: reminder.id },
    },
    trigger: Platform.OS === 'android' ? { channelId: CHANNEL_ID } : null,
  });
}

export function reminderIdFromResponse(
  response: Notifications.NotificationResponse | null | undefined
): number | null {
  const id = response?.notification.request.content.data?.reminderId;
  return typeof id === 'number' ? id : null;
}
