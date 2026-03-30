## 1. Backend - Database & Ratio Logic

- [x] 1.1 Add `calibrations` table to SQLite schema in `db.ts`
- [x] 1.2 Add `insertCalibration(oscillationCount, actualSteps, centerAngle, amplitude, frequency)` function
- [x] 1.3 Add `deleteCalibration(id)` function
- [x] 1.4 Add `getCalibrationRatio(centerAngle, amplitude, frequency)` function with three-tier fallback
- [x] 1.5 Add `getCalibrationHistory()` function returning per-config grouped samples with averages

## 2. Backend - WebSocket Integration

- [x] 2.1 Handle `calibration` message type: store sample using current ESP32 params, respond with updated ratio
- [x] 2.2 Handle `getCalibration` message type: respond with current ratio and efficiency breakdown
- [x] 2.3 Handle `deleteCalibration` message type: delete sample, respond with updated ratio
- [x] 2.4 Include `calibrationRatio` and `calibratedStepCount` in enriched status messages to browsers

## 3. Frontend - Calibration Panel

- [x] 3.1 Create `CalibrationPanel.tsx` with start/stop calibration flow tracking stepCount delta
- [x] 3.2 Add actual steps input with validation and submit button
- [x] 3.3 Display current ratio with source indicator (config-specific vs global vs uncalibrated)
- [x] 3.4 Display settings efficiency comparison table sorted by efficiency
- [x] 3.5 Add expandable sample history per config with delete buttons
- [x] 3.6 Add calibration panel to App.tsx layout

## 4. Frontend - Encounter Tracker Update

- [x] 4.1 Update `ws.ts` types to include `calibrationRatio` and `calibratedStepCount` in status
- [x] 4.2 Update EncounterTracker to use `calibratedStepCount` for probability calculation
- [x] 4.3 Display both calibrated and raw step counts when ratio is not 1.0
