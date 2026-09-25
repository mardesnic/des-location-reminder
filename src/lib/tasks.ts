/**
 * Background task definitions. Imported from the app entry (index.ts) so they are
 * registered in global scope, even when the OS starts the app headless.
 */
import * as BackgroundTask from 'expo-background-task';
import type * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { GEOFENCE_TASK, handleGeofenceEvent, syncGeofences } from '@/lib/geofence';
import { configureNotificationHandler } from '@/lib/notifications';

export const RESYNC_TASK = 'location-reminder-resync';

configureNotificationHandler();

type GeofenceEventData = {
  eventType: Location.GeofencingEventType;
  region: Location.LocationRegion;
};

TaskManager.defineTask<GeofenceEventData>(GEOFENCE_TASK, async ({ data, error }) => {
  if (error) {
    console.warn('[geofence] task error', error.message);
    return;
  }
  try {
    await handleGeofenceEvent(data.eventType, data.region);
  } catch (e) {
    console.warn('[geofence] failed to handle event', e);
  }
});

// Android drops geofences on reboot, and iOS only watches the 20 nearest ones.
// A periodic task re-registers them so neither case silently breaks reminders.
TaskManager.defineTask(RESYNC_TASK, async () => {
  try {
    await syncGeofences();
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (e) {
    console.warn('[resync] failed', e);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerResyncTask() {
  if (await TaskManager.isTaskRegisteredAsync(RESYNC_TASK)) return;
  await BackgroundTask.registerTaskAsync(RESYNC_TASK, { minimumInterval: 60 });
}
