## ADDED Requirements

### Requirement: Serial initialization
The system SHALL initialize the serial interface at 115200 baud during setup.

#### Scenario: Serial starts on boot
- **WHEN** the ESP32 boots up
- **THEN** the serial interface SHALL be initialized and print a startup message including the project name and configured shake parameters

### Requirement: Shake cycle logging
The system SHALL print status messages to serial when shake state changes.

#### Scenario: Shake start logged
- **WHEN** a shake cycle begins
- **THEN** the system SHALL print a message indicating the shake cycle number and start time

#### Scenario: Rest start logged
- **WHEN** a rest period begins
- **THEN** the system SHALL print a message indicating the rest period and total shakes completed

### Requirement: Shake counter
The system SHALL maintain a count of completed shake cycles since boot and report it via serial.

#### Scenario: Count increments
- **WHEN** a shake cycle completes
- **THEN** the internal counter SHALL increment by one and be included in the next serial status message
