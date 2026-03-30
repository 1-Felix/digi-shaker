## ADDED Requirements

### Requirement: Connection status indicator
The dashboard SHALL display the connection status to both the backend and the ESP32.

#### Scenario: Fully connected
- **WHEN** the browser is connected to the backend and the backend is connected to the ESP32
- **THEN** a green indicator SHALL display "Connected"

#### Scenario: ESP32 disconnected
- **WHEN** the browser is connected to the backend but the ESP32 is offline
- **THEN** a yellow indicator SHALL display "ESP32 Offline"

#### Scenario: Backend disconnected
- **WHEN** the browser loses connection to the backend
- **THEN** a red indicator SHALL display "Disconnected" and the browser SHALL attempt to reconnect

### Requirement: Status panel
The dashboard SHALL display the current shaker state prominently.

#### Scenario: Shaking state
- **WHEN** the ESP32 is in SHAKING state
- **THEN** the panel SHALL display "SHAKING", the current cycle number, and the uptime

#### Scenario: Resting state
- **WHEN** the ESP32 is in RESTING state
- **THEN** the panel SHALL display "RESTING" and the time remaining until the next shake cycle

#### Scenario: Idle state
- **WHEN** the ESP32 is in IDLE state
- **THEN** the panel SHALL display "IDLE"

#### Scenario: Tuning state
- **WHEN** the ESP32 is in TUNING state
- **THEN** the panel SHALL display "TUNING" and the current servo angle

### Requirement: Start and stop controls
The dashboard SHALL provide buttons to start and stop the shaker.

#### Scenario: Start button
- **WHEN** the shaker is in IDLE or TUNING state and the user clicks "Start"
- **THEN** a start command SHALL be sent to the ESP32

#### Scenario: Stop button
- **WHEN** the shaker is in SHAKING, RESTING, or TUNING state and the user clicks "Stop"
- **THEN** a stop command SHALL be sent to the ESP32

### Requirement: Parameter tuning controls
The dashboard SHALL provide slider controls to adjust shake parameters in real time.

#### Scenario: Center angle slider
- **WHEN** the user adjusts the center angle slider
- **THEN** the new value SHALL be sent to the ESP32 and the slider SHALL display the current value in degrees

#### Scenario: Amplitude slider
- **WHEN** the user adjusts the amplitude slider
- **THEN** the new value SHALL be sent to the ESP32

#### Scenario: Frequency slider
- **WHEN** the user adjusts the frequency slider
- **THEN** the new value SHALL be sent to the ESP32 and the slider SHALL display the value in Hz

#### Scenario: Shake duration slider
- **WHEN** the user adjusts the shake duration slider
- **THEN** the new value SHALL be sent to the ESP32

#### Scenario: Rest duration slider
- **WHEN** the user adjusts the rest duration slider
- **THEN** the new value SHALL be sent to the ESP32

#### Scenario: Live feedback
- **WHEN** any parameter slider is adjusted
- **THEN** the change SHALL be sent within 100ms and the current servo angle readout SHALL reflect the new parameters

### Requirement: Tuning mode UI
The dashboard SHALL provide a dedicated tuning interface for precise servo calibration.

#### Scenario: Enter tuning mode
- **WHEN** the user switches to tuning mode
- **THEN** a tune command SHALL be sent to the ESP32 and the tuning controls SHALL appear

#### Scenario: Target angle slider
- **WHEN** the user adjusts the target angle slider in tuning mode
- **THEN** the servo SHALL move to the specified angle slowly

#### Scenario: Set as center button
- **WHEN** the user clicks "Set as center" in tuning mode
- **THEN** the current target angle SHALL be saved as the center angle parameter

#### Scenario: Set as min button
- **WHEN** the user clicks "Set as min" in tuning mode
- **THEN** the amplitude SHALL be recalculated as `center - currentAngle`

#### Scenario: Set as max button
- **WHEN** the user clicks "Set as max" in tuning mode
- **THEN** the amplitude SHALL be recalculated as `currentAngle - center`

#### Scenario: Test shake button
- **WHEN** the user clicks "Test shake" in tuning mode
- **THEN** a start command SHALL be sent with the current tuning parameters to preview the motion

### Requirement: Counter reset
The dashboard SHALL provide a way to reset the shake counter, indicating a monster encounter occurred.

#### Scenario: Reset button
- **WHEN** the user clicks "Reset counter" (or "Monster encountered")
- **THEN** a resetCount command SHALL be sent to the ESP32 and the encounter SHALL be recorded in the backend

### Requirement: Session history display
The dashboard SHALL display historical shake session data.

#### Scenario: Daily summary
- **WHEN** the history panel is visible
- **THEN** it SHALL show sessions grouped by day with total shakes per day

#### Scenario: Encounter markers
- **WHEN** a monster encounter was recorded on a given day
- **THEN** it SHALL be marked in the history alongside the shake count at which it occurred
