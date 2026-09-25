import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { getPermissionState, requestPermissions, type PermissionState } from '@/lib/permissions';

/** Permission state, refreshed on focus and when returning from system settings. */
export function usePermissions() {
  const [state, setState] = useState<PermissionState | null>(null);

  const refresh = useCallback(() => {
    getPermissionState().then(setState);
  }, []);

  useFocusEffect(refresh);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  const request = useCallback(async () => {
    const next = await requestPermissions();
    setState(next);
    return next;
  }, []);

  return { permissions: state, request };
}
