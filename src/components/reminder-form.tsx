import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { PlaceMap } from '@/components/place-map';
import { PlaceSearch } from '@/components/place-search';
import { Segmented } from '@/components/segmented';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Reminder, Trigger } from '@/lib/db';
import type { LatLng } from '@/lib/geo';
import { currentPosition, describePlace } from '@/lib/places';

export type ReminderFormValues = Pick<
  Reminder,
  'title' | 'note' | 'placeLabel' | 'latitude' | 'longitude' | 'radius' | 'trigger' | 'repeat'
>;

type Props = {
  initial?: ReminderFormValues;
  submitLabel: string;
  onSubmit: (values: ReminderFormValues) => void | Promise<void>;
  footer?: React.ReactNode;
};

// Phone geofences are only accurate to ~100 m, so smaller radii miss triggers.
const RADII = [100, 150, 300, 500, 1000];

export function ReminderForm({ initial, submitLabel, onSubmit, footer }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState(initial?.title ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [place, setPlace] = useState<LatLng | null>(
    initial ? { latitude: initial.latitude, longitude: initial.longitude } : null
  );
  const [placeLabel, setPlaceLabel] = useState(initial?.placeLabel ?? '');
  const [radius, setRadius] = useState(initial?.radius ?? 150);
  const [trigger, setTrigger] = useState<Trigger>(initial?.trigger ?? 'enter');
  const [repeat, setRepeat] = useState(initial?.repeat ?? false);
  const [me, setMe] = useState<LatLng | null>(null);
  const [saving, setSaving] = useState(false);

  const pick = (point: LatLng, label?: string) => {
    setPlace(point);
    setPlaceLabel(label ?? '');
    if (!label) describePlace(point).then(setPlaceLabel);
  };

  // Start new reminders centered on where you are.
  useEffect(() => {
    currentPosition()
      .then((position) => {
        setMe(position);
        if (!initial && position) pick(position);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSave = title.trim().length > 0 && place !== null && !saving;

  const submit = async () => {
    if (!place) return;
    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        note: note.trim(),
        placeLabel,
        latitude: place.latitude,
        longitude: place.longitude,
        radius,
        trigger,
        repeat,
      });
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = [styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }];

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ThemedView style={styles.flex}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.four }]}
          keyboardShouldPersistTaps="handled">
          <View style={styles.section}>
            <ThemedText type="smallBold">Remind me to</ThemedText>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Buy milk"
              placeholderTextColor={theme.textSecondary}
              style={inputStyle}
              autoFocus={!initial}
            />
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Notes (optional)"
              placeholderTextColor={theme.textSecondary}
              style={[inputStyle, styles.multiline]}
              multiline
            />
          </View>

          <View style={styles.section}>
            <ThemedText type="smallBold">When I</ThemedText>
            <Segmented<Trigger>
              value={trigger}
              onChange={setTrigger}
              options={[
                { value: 'enter', label: 'Arrive' },
                { value: 'exit', label: 'Leave' },
              ]}
            />
          </View>

          <View style={styles.section}>
            <ThemedText type="smallBold">Place</ThemedText>
            <PlaceSearch near={me ?? place} onSelect={(r) => pick(r, r.label)} />
            <PlaceMap place={place} radius={radius} onPick={(p) => pick(p)} />
            <View style={styles.row}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.flex} numberOfLines={2}>
                {place ? placeLabel || 'Finding address…' : 'Tap the map or search to choose a place'}
              </ThemedText>
              {me && <Button title="My location" variant="secondary" onPress={() => pick(me)} />}
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="smallBold">Radius</ThemedText>
            <Segmented<number>
              value={radius}
              onChange={setRadius}
              options={RADII.map((r) => ({ value: r, label: r >= 1000 ? `${r / 1000} km` : `${r} m` }))}
            />
          </View>

          <View style={[styles.row, styles.section]}>
            <View style={styles.flex}>
              <ThemedText type="smallBold">Every time</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {repeat ? 'Stays active after it fires' : 'Turns off after it fires once'}
              </ThemedText>
            </View>
            <Switch value={repeat} onValueChange={setRepeat} trackColor={{ true: theme.tint }} />
          </View>

          <Button title={saving ? 'Saving…' : submitLabel} onPress={submit} disabled={!canSave} />
          {footer}
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: Spacing.three,
    gap: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  section: { gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  input: {
    minHeight: 44,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  multiline: { minHeight: 80, paddingTop: Spacing.three, textAlignVertical: 'top' },
});
