## ADDED Requirements

### Requirement: Hono HTTP server
The dashboard backend SHALL run a Hono server on Bun, listening on port 3000 (configurable via `PORT` environment variable).

#### Scenario: Server starts
- **WHEN** the dashboard application starts
- **THEN** the Hono server SHALL listen on the configured port and serve the static SolidJS build files

#### Scenario: Static file serving
- **WHEN** a browser requests `/` or any UI route
- **THEN** the server SHALL serve the SolidJS application's `index.html` and associated assets

### Requirement: ESP32 WebSocket client
The backend SHALL maintain a WebSocket connection to the ESP32 as a client.

#### Scenario: Connect to ESP32
- **WHEN** the backend starts
- **THEN** it SHALL connect to the ESP32 WebSocket server at the address specified by the `ESP32_HOST` environment variable (default: `digi-shaker.local`) on port 81

#### Scenario: Reconnection
- **WHEN** the WebSocket connection to the ESP32 drops
- **THEN** the backend SHALL reconnect with exponential backoff starting at 1 second, capping at 30 seconds

#### Scenario: Connection status tracking
- **WHEN** the ESP32 connection state changes (connected/disconnected)
- **THEN** the backend SHALL include the connection status in messages to browser clients

### Requirement: Browser WebSocket server
The backend SHALL accept WebSocket connections from browser dashboard clients.

#### Scenario: Browser connects
- **WHEN** a browser client connects to `ws://<host>:3000/ws`
- **THEN** the backend SHALL accept the connection and begin relaying ESP32 status messages

#### Scenario: Multiple browsers
- **WHEN** multiple browser clients connect simultaneously
- **THEN** all clients SHALL receive the same status broadcasts

#### Scenario: Command relay
- **WHEN** a browser client sends a command message
- **THEN** the backend SHALL forward it to the ESP32 over the ESP32 WebSocket connection

#### Scenario: ESP32 offline
- **WHEN** a browser sends a command but the ESP32 is disconnected
- **THEN** the backend SHALL respond with an error message: `{ "type": "error", "message": "ESP32 not connected" }`

### Requirement: Status enrichment
The backend SHALL enrich ESP32 status messages with encounter probability data before relaying to browsers.

#### Scenario: Probability calculation
- **WHEN** the backend receives a status message from the ESP32
- **THEN** it SHALL calculate the cumulative encounter probability based on shake count and append it to the message before sending to browsers

#### Scenario: Configurable thresholds
- **WHEN** encounter probability thresholds are defined in the backend configuration
- **THEN** the backend SHALL use those thresholds for probability calculation instead of hardcoded defaults

### Requirement: SQLite stats persistence
The backend SHALL persist shake session data in a SQLite database using `bun:sqlite`.

#### Scenario: Database initialization
- **WHEN** the backend starts and no database file exists at `data/shaker.sqlite`
- **THEN** it SHALL create the database and initialize the schema

#### Scenario: Session recording
- **WHEN** a shake cycle completes (ESP32 transitions from SHAKING to RESTING)
- **THEN** the backend SHALL record the session with: timestamp, shake count at start, shake count at end, duration, and active parameters

#### Scenario: Counter reset recording
- **WHEN** the user resets the shake counter (indicating a monster encounter)
- **THEN** the backend SHALL record the encounter with: timestamp and total shakes before reset

#### Scenario: History query
- **WHEN** a browser client requests session history
- **THEN** the backend SHALL query the database and return sessions grouped by day with totals

### Requirement: Last-known config resend
The backend SHALL persist the last-known parameter configuration and resend it to the ESP32 on reconnection.

#### Scenario: Config persistence
- **WHEN** the user changes parameters via the dashboard
- **THEN** the backend SHALL store the parameters in the database

#### Scenario: Resend on reconnect
- **WHEN** the ESP32 reconnects after a reboot
- **THEN** the backend SHALL send the last-known parameter configuration to the ESP32
