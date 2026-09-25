import { addDatabaseChangeListener } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { getReminder, listReminders, type Reminder } from '@/lib/db';

/** Reloads on screen focus and whenever the database changes (e.g. from the background task). */
function useLiveQuery<T>(query: () => T): T {
  const [value, setValue] = useState(query);

  useFocusEffect(
    useCallback(() => {
      setValue(query());
    }, [query])
  );

  useEffect(() => {
    const subscription = addDatabaseChangeListener(() => setValue(query()));
    return () => subscription.remove();
  }, [query]);

  return value;
}

export function useReminders(): Reminder[] {
  return useLiveQuery(listReminders);
}

export function useReminder(id: number): Reminder | null {
  const query = useCallback(() => getReminder(id), [id]);
  return useLiveQuery(query);
}
