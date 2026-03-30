## ADDED Requirements

### Requirement: Servo initialization
The system SHALL initialize the MG996R servo on GPIO 13 using the ESP32Servo library during setup. The servo SHALL be attached with configurable minimum and maximum pulse widths (default 500µs and 2400µs).

#### Scenario: Servo attaches on boot
- **WHEN** the ESP32 boots up
- **THEN** the servo SHALL be attached to GPIO 13 and move to the center position (90°)

#### Scenario: Custom pulse range
- **WHEN** `min_pulse_us` and `max_pulse_us` are defined in config.h
- **THEN** the servo SHALL use those values for its pulse width range instead of defaults

### Requirement: Angle control
The system SHALL provide a function to set the servo angle between 0° and 180°. The angle SHALL be clamped to valid range.

#### Scenario: Set valid angle
- **WHEN** the servo is commanded to move to 45°
- **THEN** the servo SHALL move to 45° position

#### Scenario: Clamp out-of-range angle
- **WHEN** the servo is commanded to move to 200°
- **THEN** the servo SHALL clamp to 180° and move there

### Requirement: Safe detach
The system SHALL provide a way to detach the servo (stop sending PWM pulses) to reduce power draw and servo buzz during rest periods.

#### Scenario: Detach during rest
- **WHEN** the shake pattern enters a rest period
- **THEN** the servo SHALL be detached (no PWM signal sent) until the next shake cycle begins
