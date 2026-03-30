## ADDED Requirements

### Requirement: ESP32 WebSocket server
The ESP32 SHALL run a WebSocket server on port 81 that accepts connections from the dashboard backend.

#### Scenario: Server starts after Wi-Fi
- **WHEN** the ESP32 successfully connects to Wi-Fi
- **THEN** a WebSocket server SHALL start listening on port 81

#### Scenario: Client connects
- **WHEN** the backend connects to the ESP32 WebSocket server
- **THEN** the ESP32 SHALL accept the connection and begin sending status messages

#### Scenario: Connection limit
- **WHEN** more than 2 WebSocket clients attempt to connect
- **THEN** the ESP32 SHALL reject additional connections to preserve memory

### Requirement: Status reporting
The ESP32 SHALL send periodic JSON status messages to all connected WebSocket clients.

#### Scenario: Periodic status broadcast
- **WHEN** a WebSocket client is connected
- **THEN** the ESP32 SHALL send a status message every 500ms containing: current state, shake count, current servo angle, active parameters, and uptime in milliseconds

#### Scenario: Status message format
- **WHEN** the ESP32 sends a status message
- **THEN** it SHALL be a JSON object with the structure: `{ "type": "status", "state": "<state>", "shakeCount": <number>, "angle": <number>, "params": { "center": <number>, "amplitude": <number>, "frequency": <number>, "shakeDuration": <number>, "restDuration": <number> }, "uptimeMs": <number> }`

### Requirement: Command reception
The ESP32 SHALL accept JSON command messages from connected WebSocket clients and execute them.

#### Scenario: Start command
- **WHEN** the ESP32 receives `{ "type": "command", "action": "start" }`
- **THEN** it SHALL transition to the SHAKING state and begin a shake cycle

#### Scenario: Stop command
- **WHEN** the ESP32 receives `{ "type": "command", "action": "stop" }`
- **THEN** it SHALL transition to the IDLE state, center the servo, and detach it

#### Scenario: Tune command
- **WHEN** the ESP32 receives `{ "type": "command", "action": "tune" }`
- **THEN** it SHALL transition to the TUNING state

#### Scenario: Config update
- **WHEN** the ESP32 receives `{ "type": "config", "params": { ... } }`
- **THEN** it SHALL update the active shake parameters to the provided values and use them for subsequent shake cycles

#### Scenario: Tune angle
- **WHEN** the ESP32 receives `{ "type": "tune", "angle": <number> }` while in TUNING state
- **THEN** the servo SHALL move slowly to the specified angle and hold

#### Scenario: Reset count
- **WHEN** the ESP32 receives `{ "type": "command", "action": "resetCount" }`
- **THEN** the shake counter SHALL reset to 0

### Requirement: Invalid message handling
The ESP32 SHALL ignore malformed or unknown WebSocket messages without crashing.

#### Scenario: Malformed JSON
- **WHEN** the ESP32 receives a non-JSON or malformed WebSocket message
- **THEN** it SHALL ignore the message and log a warning to serial

#### Scenario: Unknown message type
- **WHEN** the ESP32 receives a JSON message with an unrecognized `type` field
- **THEN** it SHALL ignore the message
