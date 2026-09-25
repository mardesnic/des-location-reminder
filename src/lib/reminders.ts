/** Reminder actions used by the UI: every change is persisted and then synced to the OS. */
import type { ReminderFormValues } from '@/components/reminder-form';
import { createReminder, deleteReminder, getReminder, setReminderActive, updateReminder } from '@/lib/db';
import { guessInside, syncGeofences } from '@/lib/geofence';

export async function addReminder(values: ReminderFormValues): Promise<number> {
  const inside = await guessInside(values);
  const id = createReminder({ ...values, active: true, inside });
  await syncGeofences();
  return id;
}

export async function editReminder(id: number, values: ReminderFormValues) {
  const previous = getReminder(id);
  if (!previous) return;
  const moved =
    previous.latitude !== values.latitude ||
    previous.longitude !== values.longitude ||
    previous.radius !== values.radius;
  const inside = moved ? await guessInside(values) : previous.inside;
  // Saving re-arms the reminder, which is what you want after editing a fired one.
  updateReminder(id, { ...values, active: true, inside });
  await syncGeofences();
}

export async function toggleReminder(id: number, active: boolean) {
  const reminder = getReminder(id);
  if (!reminder) return;
  const inside = active ? await guessInside(reminder) : reminder.inside;
  setReminderActive(id, active, inside);
  await syncGeofences();
}

export async function removeReminder(id: number) {
  deleteReminder(id);
  await syncGeofences();
}
