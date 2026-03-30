## Why

The encounter tracker counts sine wave oscillations as "steps," but the Digivice D3 V3's physical pendulum doesn't register every oscillation. The actual step registration rate depends on amplitude, frequency, and cradle positioning. Without calibration, encounter predictions are inaccurate -- the system might say 400 steps were taken when the Digivice only counted 290.

A calibration tool lets the user run the shaker, read the actual step count from the Digivice, and feed it back. The system derives a ratio (e.g., 72.5% of oscillations register as steps) and uses it to correct encounter predictions. Storing calibrations per parameter set also enables comparing which settings are most efficient.

## What Changes

- Add a calibration workflow to the dashboard: start calibration → shake → enter actual Digivice steps → submit
- Store calibration samples in SQLite with the active shake parameters
- Calculate per-config and global calibration ratios from stored samples
- Apply calibration ratio to encounter tracker predictions (calibrated steps = oscillations × ratio)
- Display calibrated vs raw step counts in the encounter tracker
- Show a settings efficiency comparison from calibration history

## Capabilities

### New Capabilities
- `step-calibration`: Calibration workflow, ratio storage, per-config and global ratio lookup, efficiency comparison UI

### Modified Capabilities
- `encounter-tracker`: Use calibrated step count instead of raw oscillation count for probability calculation
- `dashboard-ui`: Add calibration panel to the dashboard

## Impact

- **Backend (`dashboard/server/`)**: New `calibrations` table in SQLite, ratio lookup logic, calibration data exposed via WebSocket
- **Frontend (`dashboard/ui/`)**: New CalibrationPanel component, modified EncounterTracker to show calibrated values
- **Firmware**: No changes needed -- `stepCount` delta between start/stop provides the oscillation count
