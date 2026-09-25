import * as Location from 'expo-location';
import { Platform } from 'react-native';

import {
  getReminder,
  listActiveReminders,
  markReminderTriggered,
  setReminderInside,
  type Reminder,
} from '@/lib/db';
import { distanceMeters, type LatLng } from '@/lib/geo';
import { showReminderNotification } from '@/lib/notifications';

export const GEOFENCE_TASK = 'location-reminder-geofence';

/** iOS monitors at most 20 regions per app; Android allows 100. */
const MAX_REGIONS = Platform.OS === 'ios' ? 20 : 100;

/** Ignore repeat triggers of the same reminder within this window (GPS jitter at the edge). */
const REPEAT_COOLDOWN_MS = 10 * 60 * 1000;

async function lastKnownPosition(): Promise<LatLng | null> {
  try {
    const position = await Location.getLastKnownPositionAsync({ maxAge: 5 * 60 * 1000 });
    return position?.coords ?? null;
  } catch {
    return null;
  }
}

/** Best guess of whether we're currently inside a region, used when (re)activating a reminder. */
export async function guessInside(region: LatLng & { radius: number }): Promise<boolean | null> {
  const position = await lastKnownPosition();
  return position ? distanceMeters(position, region) <= region.radius : null;
}

/**
 * Registers every active reminder as a geofence with the OS. Call after any change.
 * Calling startGeofencingAsync again replaces the previously registered regions.
 */
export async function syncGeofences() {
  const { granted } = await Location.getBackgroundPermissionsAsync();
  if (!granted) return;

  let reminders = listActiveReminders();
  const started = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK);

  if (reminders.length === 0) {
    if (started) await Location.stopGeofencingAsync(GEOFENCE_TASK);
    return;
  }

  if (reminders.length > MAX_REGIONS) {
    const position = await lastKnownPosition();
    if (position) {
      reminders = [...reminders].sort(
        (a, b) => distanceMeters(position, a) - distanceMeters(position, b)
      );
    }
    reminders = reminders.slice(0, MAX_REGIONS);
  }

  await Location.startGeofencingAsync(
    GEOFENCE_TASK,
    reminders.map((r) => ({
      identifier: String(r.id),
      latitude: r.latitude,
      longitude: r.longitude,
      radius: r.radius,
      // Watch both directions so we always know whether we're inside.
      notifyOnEnter: true,
      notifyOnExit: true,
    }))
  );
}

function shouldFire(reminder: Reminder, entered: boolean): boolean {
  if (!reminder.active) return false;
  if (reminder.trigger !== (entered ? 'enter' : 'exit')) return false;
  // Only real transitions: skip "enter" if we already knew we were inside, etc.
  if (reminder.inside === entered) return false;
  if (reminder.lastTriggeredAt && Date.now() - reminder.lastTriggeredAt < REPEAT_COOLDOWN_MS) {
    return false;
  }
  return true;
}

export async function handleGeofenceEvent(
  eventType: Location.GeofencingEventType,
  region: Location.LocationRegion
) {
  const id = Number(region.identifier);
  const reminder = Number.isFinite(id) ? getReminder(id) : null;
  if (!reminder) return;

  const entered = eventType === Location.GeofencingEventType.Enter;
  const fire = shouldFire(reminder, entered);
  setReminderInside(id, entered);

  if (!fire) return;

  markReminderTriggered(id, !reminder.repeat);
  await showReminderNotification(reminder);
  if (!reminder.repeat) await syncGeofences();
}
