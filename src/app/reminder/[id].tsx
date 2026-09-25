import { router, useLocalSearchParams } from 'expo-router';
import { Alert, StyleSheet } from 'react-native';

import { Button } from '@/components/button';
import { ReminderForm } from '@/components/reminder-form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useReminder } from '@/hooks/use-reminders';
import { editReminder, removeReminder } from '@/lib/reminders';

export default function EditReminderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const reminderId = Number(id);
  const reminder = useReminder(reminderId);

  if (!reminder) {
    return (
      <ThemedView style={styles.missing}>
        <ThemedText themeColor="textSecondary">This reminder no longer exists.</ThemedText>
      </ThemedView>
    );
  }

  const confirmDelete = () =>
    Alert.alert('Delete reminder?', reminder.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await removeReminder(reminderId);
          router.back();
        },
      },
    ]);

  return (
    <ReminderForm
      // Remount when the stored reminder changes so the form shows fresh values.
      key={reminder.id}
      initial={reminder}
      submitLabel={reminder.active ? 'Save changes' : 'Save and turn on'}
      onSubmit={async (values) => {
        await editReminder(reminderId, values);
        router.back();
      }}
      footer={<Button title="Delete reminder" variant="danger" onPress={confirmDelete} />}
    />
  );
}

const styles = StyleSheet.create({
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
});
