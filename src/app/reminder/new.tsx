import { router } from 'expo-router';

import { ReminderForm } from '@/components/reminder-form';
import { addReminder } from '@/lib/reminders';

export default function NewReminderScreen() {
  return (
    <ReminderForm
      submitLabel="Save reminder"
      onSubmit={async (values) => {
        await addReminder(values);
        router.back();
      }}
    />
  );
}
