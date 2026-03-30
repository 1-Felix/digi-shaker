## ADDED Requirements

### Requirement: Configurable shake parameters
The system SHALL expose the following shake parameters as constants in `include/config.h`:
- `SHAKE_CENTER_ANGLE`: center position in degrees (default 90)
- `SHAKE_AMPLITUDE`: degrees of sweep from center in each direction (default 35)
- `SHAKE_FREQUENCY_HZ`: oscillation frequency in Hz (default 3.0)
- `SHAKE_DURATION_S`: how long to shake in seconds (default 30)
- `SHAKE_REST_S`: rest period between shake cycles in seconds (default 5)

#### Scenario: Parameters defined in config
- **WHEN** a developer opens `include/config.h`
- **THEN** all shake parameters SHALL be visible as named constants with documented defaults

### Requirement: Vigorous oscillation pattern
The system SHALL oscillate the servo between `SHAKE_CENTER_ANGLE - SHAKE_AMPLITUDE` and `SHAKE_CENTER_ANGLE + SHAKE_AMPLITUDE` at the configured frequency. The motion SHALL use a sinusoidal or triangle wave pattern for smooth reversals.

#### Scenario: Shake at default settings
- **WHEN** the shake cycle is active with default parameters
- **THEN** the servo SHALL sweep between 55° and 125° approximately 3 times per second

#### Scenario: Smooth direction change
- **WHEN** the servo reaches the end of a sweep
- **THEN** it SHALL reverse direction without abrupt stops (smooth acceleration/deceleration)

### Requirement: Shake and rest cycle
The system SHALL alternate between shaking for `SHAKE_DURATION_S` seconds and resting for `SHAKE_REST_S` seconds. This cycle SHALL repeat indefinitely.

#### Scenario: Shake then rest
- **WHEN** the shake duration completes
- **THEN** the servo SHALL stop and rest for the configured rest period before starting the next shake cycle

#### Scenario: Continuous cycling
- **WHEN** the system is running
- **THEN** it SHALL continuously cycle between shake and rest periods without manual intervention

### Requirement: Non-blocking timing
The system SHALL use `millis()`-based timing for all shake pattern logic. The main `loop()` function SHALL NOT use `delay()` for any timing longer than 1ms.

#### Scenario: Loop remains responsive
- **WHEN** the shake pattern is running
- **THEN** the `loop()` function SHALL complete each iteration in under 5ms, allowing serial and other processing to occur
