## MODIFIED Requirements

### Requirement: Configurable shake parameters
The system SHALL expose the following shake parameters as constants in `include/config.h` that serve as defaults. At runtime, parameters SHALL be overridable via WebSocket commands without recompiling.
- `SHAKE_CENTER_ANGLE`: center position in degrees (default 90)
- `SHAKE_AMPLITUDE`: degrees of sweep from center in each direction (default 35)
- `SHAKE_FREQUENCY_HZ`: oscillation frequency in Hz (default 3.0)
- `SHAKE_DURATION_S`: how long to shake in seconds (default 30)
- `SHAKE_REST_S`: rest period between shake cycles in seconds (default 5)

#### Scenario: Parameters defined in config
- **WHEN** a developer opens `include/config.h`
- **THEN** all shake parameters SHALL be visible as named constants with documented defaults

#### Scenario: Runtime parameter update
- **WHEN** a config update message is received via WebSocket with new parameter values
- **THEN** the active parameters SHALL be updated in memory and used for subsequent shake cycles

#### Scenario: Defaults on boot
- **WHEN** the ESP32 boots without receiving a config update
- **THEN** it SHALL use the compile-time defaults from `config.h`

### Requirement: Vigorous oscillation pattern
The system SHALL oscillate the servo between `center - amplitude` and `center + amplitude` at the configured frequency, using runtime parameter values. The motion SHALL use a sinusoidal wave pattern for smooth reversals.

#### Scenario: Shake at default settings
- **WHEN** the shake cycle is active with default parameters
- **THEN** the servo SHALL sweep between 55 degrees and 125 degrees approximately 3 times per second

#### Scenario: Smooth direction change
- **WHEN** the servo reaches the end of a sweep
- **THEN** it SHALL reverse direction without abrupt stops (smooth acceleration/deceleration)

#### Scenario: Parameter change mid-shake
- **WHEN** parameters are updated while a shake cycle is active
- **THEN** the new parameters SHALL take effect on the next loop iteration without restarting the cycle
