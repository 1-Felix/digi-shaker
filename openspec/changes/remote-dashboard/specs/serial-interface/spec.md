## MODIFIED Requirements

### Requirement: Serial initialization
The system SHALL initialize the serial interface at 115200 baud during setup.

#### Scenario: Serial starts on boot
- **WHEN** the ESP32 boots up
- **THEN** the serial interface SHALL be initialized and print a startup message including the project name, configured shake parameters, and Wi-Fi connection status

### Requirement: Shake cycle logging
The system SHALL print status messages to serial when shake state changes.

#### Scenario: Shake start logged
- **WHEN** a shake cycle begins
- **THEN** the system SHALL print a message indicating the shake cycle number and start time

#### Scenario: Rest start logged
- **WHEN** a rest period begins
- **THEN** the system SHALL print a message indicating the rest period and total shakes completed

## ADDED Requirements

### Requirement: Wi-Fi status logging
The system SHALL print Wi-Fi connection events to serial.

#### Scenario: Connection logged
- **WHEN** the ESP32 connects to Wi-Fi
- **THEN** it SHALL print the SSID, IP address, and mDNS hostname to serial

#### Scenario: Disconnection logged
- **WHEN** the Wi-Fi connection drops
- **THEN** it SHALL print a disconnection warning to serial

### Requirement: WebSocket event logging
The system SHALL print WebSocket connection events to serial.

#### Scenario: Client connected
- **WHEN** a WebSocket client connects
- **THEN** the system SHALL print a message indicating a client connected

#### Scenario: Command received
- **WHEN** a WebSocket command is received
- **THEN** the system SHALL print the command type to serial for debugging
