## Why

The current calibration system only measures efficiency (steps per oscillation ratio), but the metric that actually matters is **throughput** — how many real steps the Digivice registers per minute. A config with lower efficiency but higher frequency can produce more steps/min than a high-efficiency slow config. Without throughput data, the user can't meaningfully compare settings to find the fastest path to an encounter.

## What Changes

- Compute and display **steps/minute throughput** for each calibration config, derived from existing data (frequency × ratio × duty cycle)
- Store **elapsed shaking time** (excluding rest/idle periods) on new calibration samples for measured throughput
- Sort the Settings Efficiency table by throughput (steps/min) instead of efficiency ratio
- Show throughput as the primary metric in the calibration comparison UI, with efficiency as secondary

## Capabilities

### New Capabilities
- `calibration-throughput`: Throughput calculation, storage, and display for calibration configs — both computed (from existing data) and measured (from new samples with tracked duration)

### Modified Capabilities

## Impact

- **Database**: `calibrations` table gets a new `shaking_duration_s` column (nullable for existing rows)
- **Backend**: Server tracks shaking time during calibration runs via ESP32 state transitions; enriches calibration responses with throughput
- **Frontend**: CalibrationPanel and EncounterTracker updated to display throughput; efficiency table re-sorted
- **No firmware changes** — ESP32 already broadcasts state in status messages
