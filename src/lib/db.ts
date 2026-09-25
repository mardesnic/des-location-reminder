import * as SQLite from 'expo-sqlite';

import type { LatLng } from '@/lib/geo';

export type Trigger = 'enter' | 'exit';

export type Reminder = LatLng & {
  id: number;
  title: string;
  note: string;
  placeLabel: string;
  /** Geofence radius in meters. */
  radius: number;
  trigger: Trigger;
  /** Fire every time (true) or once and then deactivate (false). */
  repeat: boolean;
  active: boolean;
  /**
   * Last known position relative to the geofence: true = inside, false = outside,
   * null = unknown. The OS can re-report "enter" when regions are re-registered
   * while you're already inside, so we only fire on real transitions.
   */
  inside: boolean | null;
  lastTriggeredAt: number | null;
  createdAt: number;
};

export type ReminderInput = Omit<Reminder, 'id' | 'lastTriggeredAt' | 'createdAt'>;

type Row = {
  id: number;
  title: string;
  note: string;
  place_label: string;
  latitude: number;
  longitude: number;
  radius: number;
  trigger: Trigger;
  repeat: number;
  active: number;
  inside: number | null;
  last_triggered_at: number | null;
  created_at: number;
};

let db: SQLite.SQLiteDatabase | null = null;

/** Opened lazily so the background task and the UI share one connection. */
export function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync('reminders.db', { enableChangeListener: true });
    migrate(db);
  }
  return db;
}

function migrate(database: SQLite.SQLiteDatabase) {
  const { user_version: version } = database.getFirstSync<{ user_version: number }>(
    'PRAGMA user_version'
  ) ?? { user_version: 0 };

  if (version < 1) {
    database.execSync(`
      CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        note TEXT NOT NULL DEFAULT '',
        place_label TEXT NOT NULL DEFAULT '',
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        radius REAL NOT NULL,
        trigger TEXT NOT NULL CHECK (trigger IN ('enter', 'exit')),
        repeat INTEGER NOT NULL DEFAULT 0,
        active INTEGER NOT NULL DEFAULT 1,
        inside INTEGER,
        last_triggered_at INTEGER,
        created_at INTEGER NOT NULL
      );
      PRAGMA user_version = 1;
    `);
  }
}

function fromRow(row: Row): Reminder {
  return {
    id: row.id,
    title: row.title,
    note: row.note,
    placeLabel: row.place_label,
    latitude: row.latitude,
    longitude: row.longitude,
    radius: row.radius,
    trigger: row.trigger,
    repeat: row.repeat === 1,
    active: row.active === 1,
    inside: row.inside === null ? null : row.inside === 1,
    lastTriggeredAt: row.last_triggered_at,
    createdAt: row.created_at,
  };
}

const toInt = (value: boolean | null) => (value === null ? null : value ? 1 : 0);

export function listReminders(): Reminder[] {
  return getDb()
    .getAllSync<Row>('SELECT * FROM reminders ORDER BY active DESC, created_at DESC')
    .map(fromRow);
}

export function listActiveReminders(): Reminder[] {
  return getDb().getAllSync<Row>('SELECT * FROM reminders WHERE active = 1').map(fromRow);
}

export function getReminder(id: number): Reminder | null {
  const row = getDb().getFirstSync<Row>('SELECT * FROM reminders WHERE id = ?', id);
  return row ? fromRow(row) : null;
}

export function createReminder(input: ReminderInput): number {
  const result = getDb().runSync(
    `INSERT INTO reminders
      (title, note, place_label, latitude, longitude, radius, trigger, repeat, active, inside, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    input.title,
    input.note,
    input.placeLabel,
    input.latitude,
    input.longitude,
    input.radius,
    input.trigger,
    toInt(input.repeat),
    toInt(input.active),
    toInt(input.inside),
    Date.now()
  );
  return result.lastInsertRowId;
}

export function updateReminder(id: number, input: ReminderInput) {
  getDb().runSync(
    `UPDATE reminders SET
      title = ?, note = ?, place_label = ?, latitude = ?, longitude = ?, radius = ?,
      trigger = ?, repeat = ?, active = ?, inside = ?
     WHERE id = ?`,
    input.title,
    input.note,
    input.placeLabel,
    input.latitude,
    input.longitude,
    input.radius,
    input.trigger,
    toInt(input.repeat),
    toInt(input.active),
    toInt(input.inside),
    id
  );
}

export function setReminderActive(id: number, active: boolean, inside: boolean | null) {
  getDb().runSync(
    'UPDATE reminders SET active = ?, inside = ? WHERE id = ?',
    toInt(active),
    toInt(inside),
    id
  );
}

export function setReminderInside(id: number, inside: boolean) {
  getDb().runSync('UPDATE reminders SET inside = ? WHERE id = ?', toInt(inside), id);
}

export function markReminderTriggered(id: number, deactivate: boolean) {
  getDb().runSync(
    'UPDATE reminders SET last_triggered_at = ?, active = CASE WHEN ? THEN 0 ELSE active END WHERE id = ?',
    Date.now(),
    toInt(deactivate),
    id
  );
}

export function deleteReminder(id: number) {
  getDb().runSync('DELETE FROM reminders WHERE id = ?', id);
}
