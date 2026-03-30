## ADDED Requirements

### Requirement: Calibration panel
The dashboard SHALL include a calibration panel for measuring and recording the step registration ratio.

#### Scenario: Start calibration
- **WHEN** the user clicks "Start Calibration"
- **THEN** the system SHALL record the current stepCount, start the shaker if idle, and begin tracking oscillations

#### Scenario: Stop calibration
- **WHEN** the user clicks "Stop Calibration" during a calibration run
- **THEN** the shaker SHALL stop and the UI SHALL display the oscillation count (current stepCount minus start stepCount) and prompt for actual Digivice steps

#### Scenario: Submit actual steps
- **WHEN** the user enters the actual step count and clicks "Submit"
- **THEN** the calibration sample SHALL be sent to the backend and a success toast SHALL appear

#### Scenario: Validation
- **WHEN** the user submits an actual step count that is zero, negative, or greater than the oscillation count
- **THEN** the UI SHALL show an error and not submit

### Requirement: Current ratio display
The calibration panel SHALL display the current calibration ratio and how it was determined.

#### Scenario: Config-specific ratio
- **WHEN** calibrations exist for the current parameter set
- **THEN** the panel SHALL display the ratio and sample count for the current config

#### Scenario: Global fallback display
- **WHEN** using the global average fallback
- **THEN** the panel SHALL indicate that the ratio is a global average, not config-specific

### Requirement: Settings efficiency comparison
The calibration panel SHALL display a comparison of calibration efficiency across different parameter configurations.

#### Scenario: Multiple configs calibrated
- **WHEN** calibration samples exist for more than one parameter configuration
- **THEN** the panel SHALL show each config with its average efficiency percentage and sample count, sorted by efficiency

#### Scenario: Single config
- **WHEN** calibrations exist for only one config
- **THEN** only that config's efficiency SHALL be shown

### Requirement: Calibration history management
The calibration panel SHALL allow viewing and deleting individual calibration samples.

#### Scenario: View samples
- **WHEN** the user expands a config in the efficiency comparison
- **THEN** individual samples SHALL be visible with their oscillation count, actual steps, and ratio

#### Scenario: Delete sample
- **WHEN** the user clicks delete on a calibration sample
- **THEN** the sample SHALL be removed and the ratio recalculated
