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

db.exec(`
  CREATE TABLE IF NOT EXISTS calibrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    oscillation_count INTEGER NOT NULL,
    actual_steps INTEGER NOT NULL,
    ratio REAL NOT NULL,
    center_angle INTEGER NOT NULL,
    amplitude INTEGER NOT NULL,
    frequency REAL NOT NULL,
    shaking_duration_s REAL
  )
`);

// Migration: add shaking_duration_s to existing calibrations table
try {
  db.exec(`ALTER TABLE calibrations ADD COLUMN shaking_duration_s REAL`);
} catch {
  // Column already exists
}

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

// --- Calibration helpers ---

export interface CalibrationSample {
  id: number;
  createdAt: string;
  oscillationCount: number;
  actualSteps: number;
  ratio: number;
  centerAngle: number;
  amplitude: number;
  frequency: number;
  shakingDurationS: number | null;
}

export interface ConfigEfficiency {
  centerAngle: number;
  amplitude: number;
  frequency: number;
  avgRatio: number;
  throughput: number;
  throughputMeasured: boolean;
  sampleCount: number;
  samples: CalibrationSample[];
}

export function insertCalibration(
  oscillationCount: number,
  actualSteps: number,
  centerAngle: number,
  amplitude: number,
  frequency: number,
  shakingDurationS?: number,
): number {
  const ratio = actualSteps / oscillationCount;
  const result = db.query(`
    INSERT INTO calibrations (oscillation_count, actual_steps, ratio, center_angle, amplitude, frequency, shaking_duration_s)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(oscillationCount, actualSteps, ratio, centerAngle, amplitude, frequency, shakingDurationS ?? null);
  return Number(result.lastInsertRowid);
}

export function deleteCalibration(id: number) {
  db.query("DELETE FROM calibrations WHERE id = ?").run(id);
}

export function getCalibrationRatio(centerAngle: number, amplitude: number, frequency: number): { ratio: number; source: "config" | "global" | "none"; sampleCount: number } {
  // Tier 1: exact config match
  const configMatch = db.query(`
    SELECT AVG(ratio) as avg_ratio, COUNT(*) as cnt
    FROM calibrations
    WHERE center_angle = ? AND amplitude = ? AND frequency = ?
  `).get(centerAngle, amplitude, frequency) as { avg_ratio: number | null; cnt: number };

  if (configMatch.avg_ratio !== null && configMatch.cnt > 0) {
    return { ratio: configMatch.avg_ratio, source: "config", sampleCount: configMatch.cnt };
  }

  // Tier 2: global average
  const globalMatch = db.query(`
    SELECT AVG(ratio) as avg_ratio, COUNT(*) as cnt FROM calibrations
  `).get() as { avg_ratio: number | null; cnt: number };

  if (globalMatch.avg_ratio !== null && globalMatch.cnt > 0) {
    return { ratio: globalMatch.avg_ratio, source: "global", sampleCount: globalMatch.cnt };
  }

  // Tier 3: no calibrations
  return { ratio: 1.0, source: "none", sampleCount: 0 };
}

export function getCalibrationHistory(): ConfigEfficiency[] {
  const rows = db.query(`
    SELECT id, created_at, oscillation_count, actual_steps, ratio, center_angle, amplitude, frequency, shaking_duration_s
    FROM calibrations ORDER BY created_at DESC
  `).all() as Array<{
    id: number; created_at: string; oscillation_count: number; actual_steps: number;
    ratio: number; center_angle: number; amplitude: number; frequency: number;
    shaking_duration_s: number | null;
  }>;

  // Get current config for computed throughput fallback
  const currentConfig = getLastConfig();
  const shakeDuration = currentConfig?.shakeDuration ?? 30;
  const restDuration = currentConfig?.restDuration ?? 5;
  const dutyCycle = shakeDuration / (shakeDuration + restDuration);

  const configMap = new Map<string, ConfigEfficiency>();

  for (const row of rows) {
    const key = `${row.center_angle}:${row.amplitude}:${row.frequency}`;
    let config = configMap.get(key);
    if (!config) {
      config = {
        centerAngle: row.center_angle,
        amplitude: row.amplitude,
        frequency: row.frequency,
        avgRatio: 0,
        throughput: 0,
        throughputMeasured: false,
        sampleCount: 0,
        samples: [],
      };
      configMap.set(key, config);
    }
    config.samples.push({
      id: row.id,
      createdAt: row.created_at,
      oscillationCount: row.oscillation_count,
      actualSteps: row.actual_steps,
      ratio: row.ratio,
      centerAngle: row.center_angle,
      amplitude: row.amplitude,
      frequency: row.frequency,
      shakingDurationS: row.shaking_duration_s,
    });
  }

  for (const config of configMap.values()) {
    config.sampleCount = config.samples.length;
    config.avgRatio = config.samples.reduce((sum, s) => sum + s.ratio, 0) / config.sampleCount;

    // Compute throughput: prefer measured (from samples with duration), fall back to computed
    const measuredSamples = config.samples.filter((s) => s.shakingDurationS !== null && s.shakingDurationS > 0);
    if (measuredSamples.length > 0) {
      const totalSteps = measuredSamples.reduce((sum, s) => sum + s.actualSteps, 0);
      const totalDurationS = measuredSamples.reduce((sum, s) => sum + (s.shakingDurationS ?? 0), 0);
      config.throughput = totalSteps / (totalDurationS / 60);
      config.throughputMeasured = true;
    } else {
      // Computed: freq × avgRatio × 60 × dutyCycle
      config.throughput = config.frequency * config.avgRatio * 60 * dutyCycle;
      config.throughputMeasured = false;
    }
  }

  return Array.from(configMap.values()).sort((a, b) => b.throughput - a.throughput);
}

export default db;
