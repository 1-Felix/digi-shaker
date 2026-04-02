## ADDED Requirements

### Requirement: Shaking duration tracking
The system SHALL track elapsed shaking time (time spent in `shaking` state only, excluding rest and idle periods) during calibration runs. The backend SHALL start tracking when it receives a `startCalibration` message and stop when it receives a `stopCalibration` message from the same browser client.

#### Scenario: Normal calibration run with shaking and resting
- **WHEN** a calibration run spans 3 shake cycles (30s each) with 5s rest between them
- **THEN** the tracked shaking duration SHALL be ~90 seconds (excluding the 10s of rest)

#### Scenario: Calibration run where shaker is stopped mid-shake
- **WHEN** the user stops calibration while the servo is in shaking state
- **THEN** the system SHALL include the partial shaking interval in the total duration

#### Scenario: Browser disconnects during calibration
- **WHEN** the browser WebSocket disconnects while a calibration is active
- **THEN** the tracking state SHALL be discarded (no partial data stored)

### Requirement: Shaking duration storage
The system SHALL store `shaking_duration_s` (real, nullable) in the calibrations table. New calibration samples submitted via `stopCalibration` SHALL include the tracked shaking duration. Existing samples without duration SHALL have NULL for this field.

#### Scenario: New calibration sample with duration
- **WHEN** a calibration sample is submitted after a tracked run of 90 seconds of shaking
- **THEN** the sample SHALL be stored with `shaking_duration_s = 90`

#### Scenario: Existing sample without duration
- **WHEN** the system reads a calibration sample that was created before this feature
- **THEN** `shaking_duration_s` SHALL be NULL

### Requirement: Throughput computation
The system SHALL compute throughput (steps per minute) for each calibration config. When `shaking_duration_s` is available, throughput SHALL be `actualSteps / (shaking_duration_s / 60)`. When not available, throughput SHALL be computed as `frequency × avgRatio × 60 × (shakeDuration / (shakeDuration + restDuration))` using the config's stored parameters.

#### Scenario: Measured throughput from tracked duration
- **WHEN** a config has samples with `shaking_duration_s` recorded
- **THEN** throughput SHALL be calculated from the measured duration: `sum(actualSteps) / (sum(shaking_duration_s) / 60)`

#### Scenario: Computed throughput from config parameters
- **WHEN** a config has only samples without `shaking_duration_s` (legacy data)
- **THEN** throughput SHALL be estimated as `frequency × avgRatio × 60 × (shakeDuration / (shakeDuration + restDuration))`

### Requirement: Efficiency table sorted by throughput
The Settings Efficiency table SHALL sort configs by throughput (steps/min) descending instead of by efficiency ratio. Each config entry SHALL display both throughput and efficiency.

#### Scenario: Two configs with different throughput rankings
- **WHEN** Config A has 70% efficiency at 4Hz (throughput ~168 steps/min) and Config B has 40% efficiency at 8Hz (throughput ~192 steps/min)
- **THEN** Config B SHALL appear above Config A in the table

#### Scenario: Throughput display format
- **WHEN** a config has throughput of 168.4 steps/min and 70% efficiency
- **THEN** the entry SHALL display throughput rounded to nearest integer and efficiency as percentage (e.g., "168 steps/min, 70% eff")

### Requirement: Calibration WebSocket protocol additions
The browser SHALL send `startCalibration` message when beginning a calibration run and `stopCalibration` message when ending it. The backend SHALL respond to `stopCalibration` with the accumulated shaking duration. The existing `calibration` submit message SHALL accept an optional `shakingDurationS` field.

#### Scenario: Start calibration message
- **WHEN** the user clicks "Start Calibration"
- **THEN** the browser SHALL send `{ type: "startCalibration" }` to the backend

#### Scenario: Stop calibration message and response
- **WHEN** the user clicks "Stop Calibration"
- **THEN** the browser SHALL send `{ type: "stopCalibration" }` and the backend SHALL respond with `{ type: "calibrationStopped", shakingDurationS: <number> }`

#### Scenario: Submit with duration
- **WHEN** the user submits a calibration with actual steps after receiving the shaking duration
- **THEN** the `calibration` message SHALL include `shakingDurationS` alongside `oscillationCount` and `actualSteps`
