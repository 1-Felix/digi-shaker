## ADDED Requirements

### Requirement: Tuning state
The firmware SHALL support a TUNING state in which the servo moves slowly to a target angle and holds position for calibration.

#### Scenario: Enter tuning mode
- **WHEN** a tune command is received
- **THEN** the system SHALL transition to TUNING state and the servo SHALL attach if not already attached

#### Scenario: Set target angle in tuning mode
- **WHEN** the system is in TUNING state and receives a target angle
- **THEN** the servo SHALL move to that angle at a reduced speed (stepping 1 degree per 20ms) and hold

#### Scenario: Angle clamping in tuning mode
- **WHEN** a target angle outside 0-180 degrees is requested
- **THEN** the angle SHALL be clamped to the valid range

#### Scenario: Exit tuning via start
- **WHEN** a start command is received while in TUNING state
- **THEN** the system SHALL transition to SHAKING state and begin a shake cycle with current parameters

#### Scenario: Exit tuning via stop
- **WHEN** a stop command is received while in TUNING state
- **THEN** the system SHALL transition to IDLE state, center the servo, and detach

### Requirement: Slow servo movement
In TUNING state, the servo SHALL move gradually to the target angle rather than jumping instantly.

#### Scenario: Gradual movement
- **WHEN** the servo is at 90 degrees and a target of 60 degrees is set
- **THEN** the servo SHALL step from 90 to 60 one degree at a time with a 20ms delay between steps

#### Scenario: New target during movement
- **WHEN** a new target angle is received while the servo is still moving toward a previous target
- **THEN** the servo SHALL change direction toward the new target from its current position
