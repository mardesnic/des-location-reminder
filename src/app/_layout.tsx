import * as Notifications from 'expo-notifications';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, router } from 'expo-router';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { syncGeofences } from '@/lib/geofence';
import { reminderIdFromResponse } from '@/lib/notifications';
import { registerResyncTask } from '@/lib/tasks';

function openReminderFrom(response: Notifications.NotificationResponse | null | undefined) {
  const id = reminderIdFromResponse(response);
  if (id !== null) router.push({ pathname: '/reminder/[id]', params: { id: String(id) } });
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const lastResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    // Re-register geofences on every launch (e.g. after a reboot cleared them).
    syncGeofences().catch((e) => console.warn('[geofence] sync failed', e));
    registerResyncTask().catch((e) => console.warn('[resync] register failed', e));
  }, []);

  // Tapping a reminder notification opens that reminder.
  useEffect(() => {
    openReminderFrom(lastResponse);
  }, [lastResponse]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Location Reminders' }} />
        <Stack.Screen name="reminder/new" options={{ title: 'New reminder', presentation: 'modal' }} />
        <Stack.Screen name="reminder/[id]" options={{ title: 'Edit reminder' }} />
      </Stack>
    </ThemeProvider>
  );
}
