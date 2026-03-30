import { Database } from "bun:sqlite";
import { mkdirSync, existsSync } from "fs";

const DATA_DIR = process.env.DATA_DIR ?? "data";

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(`${DATA_DIR}/shaker.sqlite`);
db.exec("PRAGMA journal_mode=WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    ended_at TEXT,
    shake_count_start INTEGER NOT NULL,
    shake_count_end INTEGER,
    duration_s INTEGER,
    center_angle INTEGER,
    amplitude INTEGER,
    frequency REAL,
    shake_duration_s INTEGER,
    rest_duration_s INTEGER
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS encounters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    occurred_at TEXT NOT NULL DEFAULT (datetime('now')),
    shake_count INTEGER NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    center_angle INTEGER NOT NULL DEFAULT 60,
    amplitude INTEGER NOT NULL DEFAULT 60,
    frequency REAL NOT NULL DEFAULT 4.0,
    shake_duration_s INTEGER NOT NULL DEFAULT 30,
    rest_duration_s INTEGER NOT NULL DEFAULT 5,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// Ensure config row exists
db.exec(`INSERT OR IGNORE INTO config (id) VALUES (1)`);

// --- Query helpers ---

export interface ShakeParams {
  center: number;
  amplitude: number;
  frequency: number;
  shakeDuration: number;
  restDuration: number;
}

export function getLastConfig(): ShakeParams | null {
  const row = db
    .query("SELECT * FROM config WHERE id = 1")
    .get() as Record<string, unknown> | null;
  if (!row) return null;
  return {
    center: row.center_angle as number,
    amplitude: row.amplitude as number,
    frequency: row.frequency as number,
    shakeDuration: row.shake_duration_s as number,
    restDuration: row.rest_duration_s as number,
  };
}

export function saveConfig(params: ShakeParams) {
  db.query(`
    UPDATE config SET
      center_angle = ?,
      amplitude = ?,
      frequency = ?,
      shake_duration_s = ?,
      rest_duration_s = ?,
      updated_at = datetime('now')
    WHERE id = 1
  `).run(
    params.center,
    params.amplitude,
    params.frequency,
    params.shakeDuration,
    params.restDuration,
  );
}

export function recordSessionStart(shakeCountStart: number, params: ShakeParams): number {
  const result = db.query(`
    INSERT INTO sessions (shake_count_start, center_angle, amplitude, frequency, shake_duration_s, rest_duration_s)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    shakeCountStart,
    params.center,
    params.amplitude,
    params.frequency,
    params.shakeDuration,
    params.restDuration,
  );
  return Number(result.lastInsertRowid);
}

export function recordSessionEnd(sessionId: number, shakeCountEnd: number, durationS: number) {
  db.query(`
    UPDATE sessions SET ended_at = datetime('now'), shake_count_end = ?, duration_s = ?
    WHERE id = ?
  `).run(shakeCountEnd, durationS, sessionId);
}

export function recordEncounter(shakeCount: number) {
  db.query("INSERT INTO encounters (shake_count) VALUES (?)").run(shakeCount);
}

export interface DailyHistory {
  date: string;
  sessionCount: number;
  totalShakes: number;
  encounters: Array<{ occurredAt: string; shakeCount: number }>;
}

export function getHistory(days = 14): DailyHistory[] {
  const sessions = db.query(`
    SELECT date(started_at) as day, COUNT(*) as cnt,
      COALESCE(SUM(shake_count_end - shake_count_start), 0) as shakes
    FROM sessions
    WHERE started_at >= datetime('now', ? || ' days')
    GROUP BY day ORDER BY day DESC
  `).all(`-${days}`) as Array<{ day: string; cnt: number; shakes: number }>;

  const encounters = db.query(`
    SELECT date(occurred_at) as day, occurred_at, shake_count
    FROM encounters
    WHERE occurred_at >= datetime('now', ? || ' days')
    ORDER BY occurred_at DESC
  `).all(`-${days}`) as Array<{ day: string; occurred_at: string; shake_count: number }>;

  const dayMap = new Map<string, DailyHistory>();

  for (const s of sessions) {
    dayMap.set(s.day, {
      date: s.day,
      sessionCount: s.cnt,
      totalShakes: s.shakes,
      encounters: [],
    });
  }

  for (const e of encounters) {
    let day = dayMap.get(e.day);
    if (!day) {
      day = { date: e.day, sessionCount: 0, totalShakes: 0, encounters: [] };
      dayMap.set(e.day, day);
    }
    day.encounters.push({ occurredAt: e.occurred_at, shakeCount: e.shake_count });
  }

  return Array.from(dayMap.values()).sort((a, b) => b.date.localeCompare(a.date));
}

export default db;
