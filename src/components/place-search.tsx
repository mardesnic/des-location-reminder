import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { LatLng } from '@/lib/geo';
import { searchPlaces, type PlaceResult } from '@/lib/places';

type Props = {
  near: LatLng | null;
  onSelect: (result: PlaceResult) => void;
};

export function PlaceSearch({ near, onSelect }: Props) {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    try {
      const found = await searchPlaces(q, near);
      setResults(found);
      if (found.length === 0) setError('No places found');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.inputRow, { backgroundColor: theme.backgroundElement }]}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={search}
          placeholder="Search an address or place"
          placeholderTextColor={theme.textSecondary}
          returnKeyType="search"
          style={[styles.input, { color: theme.text }]}
        />
        {loading && <ActivityIndicator color={theme.tint} />}
      </View>

      {error && (
        <ThemedText type="small" themeColor="textSecondary">
          {error}
        </ThemedText>
      )}

      {results.map((result) => (
        <Pressable
          key={`${result.latitude},${result.longitude}`}
          onPress={() => {
            onSelect(result);
            setResults([]);
            setQuery('');
          }}
          style={({ pressed }) => [styles.result, { opacity: pressed ? 0.6 : 1 }]}>
          <ThemedText type="smallBold">{result.label}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
            {result.detail}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.two },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  input: { flex: 1, minHeight: 44, fontSize: 16 },
  result: { paddingVertical: Spacing.two, gap: Spacing.half },
});
