## MODIFIED Requirements

### Requirement: Angle control
The system SHALL provide a function to set the servo angle between 0 degrees and 180 degrees. The angle SHALL be clamped to valid range. The function SHALL be used by both the shake pattern and the tuning mode.

#### Scenario: Set valid angle
- **WHEN** the servo is commanded to move to 45 degrees
- **THEN** the servo SHALL move to the 45 degree position

#### Scenario: Clamp out-of-range angle
- **WHEN** the servo is commanded to move to 200 degrees
- **THEN** the servo SHALL clamp to 180 degrees and move there

## ADDED Requirements

### Requirement: Extended state machine
The servo control system SHALL support four states: IDLE, SHAKING, RESTING, and TUNING.

#### Scenario: IDLE state
- **WHEN** the system is in IDLE state
- **THEN** the servo SHALL be centered and detached (no PWM signal)

#### Scenario: SHAKING state
- **WHEN** the system is in SHAKING state
- **THEN** the servo SHALL execute the configured oscillation pattern

#### Scenario: RESTING state
- **WHEN** the system is in RESTING state
- **THEN** the servo SHALL be centered and detached until the rest period elapses

#### Scenario: TUNING state
- **WHEN** the system is in TUNING state
- **THEN** the servo SHALL hold at the target angle and remain attached

### Requirement: Shake counter
The system SHALL maintain a count of completed shake cycles since the last reset.

#### Scenario: Count increments
- **WHEN** a shake duration elapses and the system transitions to RESTING
- **THEN** the shake counter SHALL increment by one

#### Scenario: Count reset
- **WHEN** a resetCount command is received
- **THEN** the shake counter SHALL reset to 0

#### Scenario: Count survives state changes
- **WHEN** the system transitions between IDLE, TUNING, and SHAKING states
- **THEN** the shake counter SHALL retain its value (not reset)
