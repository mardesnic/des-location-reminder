import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props<T extends string | number> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

export function Segmented<T extends string | number>({ options, value, onChange }: Props<T>) {
  const theme = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundElement }]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.option, selected && { backgroundColor: theme.tint }]}>
            <ThemedText type="smallBold" style={{ color: selected ? theme.onTint : theme.text }}>
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: Spacing.three,
    padding: Spacing.one,
    gap: Spacing.one,
  },
  option: {
    flex: 1,
    minHeight: 36,
    borderRadius: Spacing.three - Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
