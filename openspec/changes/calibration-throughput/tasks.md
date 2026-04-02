## 1. Backend - Database & Duration Storage

- [x] 1.1 Add `shaking_duration_s REAL` nullable column to `calibrations` table
- [x] 1.2 Update `insertCalibration()` to accept optional `shakingDurationS` parameter
- [x] 1.3 Add throughput computation to `getCalibrationHistory()` — measured when duration available, computed from config params when not

## 2. Backend - Calibration Tracking

- [x] 2.1 Add per-client calibration state tracking (`Map<ws, CalibrationState>`) in `index.ts`
- [x] 2.2 Handle `startCalibration` message: initialize tracking state for the client
- [x] 2.3 Accumulate shaking time on ESP32 status updates: track `shaking` state transitions for active calibrations
- [x] 2.4 Handle `stopCalibration` message: finalize duration, respond with `calibrationStopped` including `shakingDurationS`
- [x] 2.5 Clean up calibration state on WebSocket disconnect
- [x] 2.6 Update `calibration` submit handler to pass `shakingDurationS` to `insertCalibration()`

## 3. Frontend - Protocol & State

- [x] 3.1 Add `startCalibration` / `stopCalibration` send helpers and `calibrationStopped` handler to `ws.ts`
- [x] 3.2 Add throughput fields to `ConfigEfficiency` type and `CalibrationData` types
- [x] 3.3 Store tracked `shakingDurationS` from `calibrationStopped` response for submit

## 4. Frontend - UI Updates

- [x] 4.1 Update `CalibrationPanel` to send `startCalibration`/`stopCalibration` messages and include duration on submit
- [x] 4.2 Update Settings Efficiency table to display throughput (steps/min) as primary metric, sort by throughput descending
- [x] 4.3 Show efficiency as secondary metric alongside throughput in each config row
