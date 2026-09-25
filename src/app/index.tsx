import { Link, router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { PermissionBanner } from '@/components/permission-banner';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useReminders } from '@/hooks/use-reminders';
import { useTheme } from '@/hooks/use-theme';
import type { Reminder } from '@/lib/db';
import { toggleReminder } from '@/lib/reminders';

function describe(reminder: Reminder) {
  const when = reminder.trigger === 'enter' ? 'Arriving at' : 'Leaving';
  const how = reminder.repeat ? 'every time' : 'once';
  return `${when} ${reminder.placeLabel || 'a place'} · ${how}`;
}

function ReminderRow({ reminder }: { reminder: Reminder }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: '/reminder/[id]', params: { id: String(reminder.id) } })
      }
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
      ]}>
      <View style={styles.rowText}>
        <ThemedText
          type="default"
          themeColor={reminder.active ? 'text' : 'textSecondary'}
          numberOfLines={1}>
          {reminder.title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
          {describe(reminder)}
        </ThemedText>
      </View>
      <Switch
        value={reminder.active}
        onValueChange={(active) => toggleReminder(reminder.id, active)}
        trackColor={{ true: theme.tint }}
      />
    </Pressable>
  );
}

export default function RemindersScreen() {
  const reminders = useReminders();
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={reminders}
        keyExtractor={(r) => String(r.id)}
        renderItem={({ item }) => <ReminderRow reminder={item} />}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<PermissionBanner />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <ThemedText type="smallBold">No reminders yet</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
              Add one for something you need to do once you get somewhere — the store, the office,
              your parents’ place.
            </ThemedText>
          </View>
        }
      />
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.three }]}>
        <Link href="/reminder/new" asChild>
          <Button title="New reminder" />
        </Link>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: {
    padding: Spacing.three,
    gap: Spacing.two,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  rowText: { flex: 1, gap: Spacing.half },
  empty: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.six },
  center: { textAlign: 'center' },
  footer: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two },
});
