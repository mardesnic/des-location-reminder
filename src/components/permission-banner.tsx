import { StyleSheet } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { usePermissions } from '@/hooks/use-permissions';
import { syncGeofences } from '@/lib/geofence';
import { allGranted } from '@/lib/permissions';

/** Explains and requests the permissions reminders need. Hidden once everything is granted. */
export function PermissionBanner() {
  const { permissions, request } = usePermissions();
  if (!permissions || allGranted(permissions)) return null;

  const missing = [
    !permissions.notifications && 'notifications',
    !permissions.foreground && 'location',
    permissions.foreground && !permissions.background && 'location "Allow all the time"',
  ].filter(Boolean);

  return (
    <ThemedView type="backgroundElement" style={styles.banner}>
      <ThemedText type="smallBold">Reminders can’t fire yet</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        To notice when you arrive somewhere while the app is closed, it needs {missing.join(' and ')}.
        Your location never leaves your phone.
      </ThemedText>
      <Button
        title="Grant access"
        onPress={async () => {
          const next = await request();
          if (next.background) await syncGeofences();
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  banner: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
});
