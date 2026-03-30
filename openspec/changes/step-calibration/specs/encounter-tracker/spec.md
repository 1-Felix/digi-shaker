## MODIFIED Requirements

### Requirement: Encounter probability display
The dashboard SHALL display the cumulative probability of a monster encounter based on the **calibrated** step count (raw oscillations multiplied by the calibration ratio).

#### Scenario: Below first threshold
- **WHEN** the calibrated step count is below 400
- **THEN** the encounter probability SHALL display as 0% with a progress bar showing distance to 400

#### Scenario: Cumulative probability at thresholds
- **WHEN** the calibrated step count reaches 400, 450, 500, or 550
- **THEN** the encounter probability SHALL display the cumulative value (40%, 60%, 90%, 100%)

#### Scenario: Display raw and calibrated
- **WHEN** a calibration ratio other than 1.0 is active
- **THEN** the display SHALL show both calibrated and raw counts (e.g., "~87 / 120 steps")

#### Scenario: No calibration
- **WHEN** no calibration data exists (ratio is 1.0)
- **THEN** the display SHALL show the raw step count without a calibrated value
