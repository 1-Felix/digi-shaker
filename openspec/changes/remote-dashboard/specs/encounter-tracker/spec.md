## ADDED Requirements

### Requirement: Encounter probability display
The dashboard SHALL display the cumulative probability of a monster encounter based on the current shake count.

#### Scenario: Below first threshold
- **WHEN** the shake count is below 400
- **THEN** the encounter probability SHALL display as 0% with a progress bar showing distance to 400

#### Scenario: At 400 shakes
- **WHEN** the shake count reaches 400
- **THEN** the encounter probability SHALL display as 40%

#### Scenario: Between thresholds
- **WHEN** the shake count is between 400 and 450
- **THEN** the encounter probability SHALL remain at 40% until the next threshold

#### Scenario: Cumulative at 450
- **WHEN** the shake count reaches 450
- **THEN** the encounter probability SHALL display as 60%

#### Scenario: Cumulative at 500
- **WHEN** the shake count reaches 500
- **THEN** the encounter probability SHALL display as 90%

#### Scenario: Certain at 550
- **WHEN** the shake count reaches 550
- **THEN** the encounter probability SHALL display as 100%

### Requirement: Estimated shakes remaining
The dashboard SHALL display an estimate of how many shakes remain before a likely encounter.

#### Scenario: Early in session
- **WHEN** the shake count is below 400
- **THEN** the estimate SHALL show the number of shakes until 400 (first possible encounter)

#### Scenario: In encounter zone
- **WHEN** the shake count is between 400 and 550
- **THEN** the estimate SHALL show the expected remaining shakes based on the probability distribution

#### Scenario: Past maximum
- **WHEN** the shake count exceeds 550
- **THEN** the estimate SHALL display "Overdue" indicating the encounter should have occurred

### Requirement: Estimated time remaining
The dashboard SHALL display an estimated time until the next encounter based on current shake frequency and duration parameters.

#### Scenario: Time calculation
- **WHEN** the shake count, shake duration, rest duration, and frequency are known
- **THEN** the time estimate SHALL be calculated from the estimated remaining shakes divided by the effective shakes-per-minute rate

### Requirement: Visual urgency
The encounter tracker SHALL use visual cues to indicate urgency as the encounter probability increases.

#### Scenario: Low probability
- **WHEN** the encounter probability is 0%
- **THEN** the progress bar SHALL use a neutral color

#### Scenario: Medium probability
- **WHEN** the encounter probability is 40-60%
- **THEN** the progress bar SHALL use a warning color and display a warning label

#### Scenario: High probability
- **WHEN** the encounter probability is 90-100%
- **THEN** the progress bar SHALL use an alert color and display an alert label
