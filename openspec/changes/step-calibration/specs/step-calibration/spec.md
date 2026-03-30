## ADDED Requirements

### Requirement: Calibration data persistence
The backend SHALL store calibration samples in a `calibrations` SQLite table with columns: id, created_at, oscillation_count, actual_steps, ratio, center_angle, amplitude, frequency.

#### Scenario: Table creation
- **WHEN** the backend starts and the calibrations table does not exist
- **THEN** it SHALL be created with the schema above

#### Scenario: Sample storage
- **WHEN** a calibration sample is submitted with oscillation_count and actual_steps
- **THEN** the backend SHALL store it with the current shake parameters and computed ratio (actual_steps / oscillation_count)

### Requirement: Calibration ratio lookup
The backend SHALL provide a calibration ratio using a three-tier fallback: exact config match, global average, or 1.0.

#### Scenario: Exact config match
- **WHEN** calibration samples exist for the current center_angle, amplitude, and frequency
- **THEN** the ratio SHALL be the average of matching samples' ratios

#### Scenario: Global fallback
- **WHEN** no calibration samples match the current config but other samples exist
- **THEN** the ratio SHALL be the average of all samples' ratios

#### Scenario: No calibrations
- **WHEN** no calibration samples exist at all
- **THEN** the ratio SHALL be 1.0

### Requirement: Calibration submission via WebSocket
The backend SHALL accept calibration submissions over the browser WebSocket.

#### Scenario: Submit calibration
- **WHEN** the browser sends `{ "type": "calibration", "oscillationCount": <number>, "actualSteps": <number> }`
- **THEN** the backend SHALL store the sample with the current ESP32 parameters and respond with the updated ratio

### Requirement: Calibration history via WebSocket
The backend SHALL provide calibration history and current ratio to browser clients.

#### Scenario: Request calibration data
- **WHEN** the browser sends `{ "type": "getCalibration" }`
- **THEN** the backend SHALL respond with the current ratio, sample count, and per-config efficiency breakdown

#### Scenario: Ratio included in status
- **WHEN** the backend enriches an ESP32 status message for browser clients
- **THEN** it SHALL include the current calibration ratio and calibrated step count

### Requirement: Delete calibration sample
The backend SHALL support deleting individual calibration samples.

#### Scenario: Delete sample
- **WHEN** the browser sends `{ "type": "deleteCalibration", "id": <number> }`
- **THEN** the backend SHALL remove that sample and respond with the updated ratio
