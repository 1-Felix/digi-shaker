## Context

The calibration system stores efficiency ratio (actualSteps / oscillationCount) per config. The Settings Efficiency table sorts by ratio. But the user optimizes for **time-to-encounter** — the metric that matters is steps/minute throughput, not per-oscillation efficiency.

Currently, throughput can be computed from existing data: `freq × ratio × 60 × (shakeDur / (shakeDur + restDur))`. But this is theoretical — it doesn't account for servo lag, startup time, or physical constraints at high frequencies. Storing measured shaking duration per sample enables actual throughput measurement.

## Goals / Non-Goals

**Goals:**
- Compute and display throughput (steps/min) for all existing calibration data using config parameters
- Track elapsed shaking time (excluding rest/idle) on new calibration samples for measured throughput
- Make throughput the primary sort/comparison metric in the UI
- Use measured throughput when available, fall back to computed

**Non-Goals:**
- Firmware changes (ESP32 already broadcasts state in status messages)
- Changing the calibration collection workflow (start/stop/submit stays the same)
- Historical backfill of shaking duration for existing samples

## Decisions

### 1. Track shaking time on the backend, not the frontend

The backend already receives every ESP32 status update with `state` field. During a calibration run, the backend can accumulate time spent in `shaking` state by tracking state transitions. This is more accurate than frontend timing (no network latency skew) and requires no protocol changes.

**Alternative**: Frontend tracks time via `status.state` — rejected because backend already has the status stream and can track more precisely without round-trip latency.

### 2. Nullable `shaking_duration_s` column

Add `shaking_duration_s REAL` (nullable) to the `calibrations` table. Existing rows remain NULL. When duration is available, compute `measured_throughput = actualSteps / (shaking_duration_s / 60)`. When NULL, fall back to computed throughput from config params.

**Alternative**: Separate throughput table — rejected as unnecessary complexity for a single additional column.

### 3. Backend tracks calibration state per browser client

The calibration start/stop is initiated by a specific browser client. The backend needs to track which client is calibrating, when they started, and accumulate shaking seconds. A simple `Map<ws, CalibrationState>` keyed by WebSocket connection handles this.

State tracked per calibration run:
- `startedAt`: timestamp
- `shakingMs`: accumulated milliseconds in shaking state
- `lastShakingStart`: timestamp when current shaking interval began (null if resting/idle)

On each ESP32 status update, for any active calibration: if state transitioned to `shaking`, record `lastShakingStart`. If state transitioned away from `shaking`, add elapsed to `shakingMs`.

### 4. Throughput computation for existing data

For samples without `shaking_duration_s`:
```
computedThroughput = frequency × avgRatio × 60 × (shakeDuration / (shakeDuration + restDuration))
```

This uses the config params stored on the calibration sample and the config's average ratio. It's a per-config metric displayed in the efficiency table.

### 5. Frontend sends `startCalibration` / `stopCalibration` messages

New message types so the backend knows when to start/stop tracking shaking time. The existing `calibration` submit message includes the accumulated duration from the backend's tracking.

## Risks / Trade-offs

- **[Stale tracking on disconnect]** → If browser disconnects mid-calibration, the tracking state is lost. Acceptable since the user would need to restart calibration anyway.
- **[Clock precision]** → Using `Date.now()` for millisecond tracking. Sufficient for 30s+ calibration runs where we need ~1s accuracy.
- **[Computed vs measured mismatch]** → Users may see different throughput numbers for old (computed) vs new (measured) samples of the same config. The UI should indicate which is which.
