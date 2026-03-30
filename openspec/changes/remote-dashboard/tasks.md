## 1. Repository Restructuring

- [x] 1.1 Move `platformio.ini`, `src/`, `include/`, `lib/`, `test/` into `firmware/` subdirectory
- [x] 1.2 Update any PlatformIO paths or configs to work from `firmware/` directory
- [x] 1.3 Create `dashboard/` directory with `package.json` (Bun + Hono + SolidJS + Vite)
- [x] 1.4 Add `include/wifi_credentials.h` to `.gitignore` and create `include/wifi_credentials.example.h` template

## 2. ESP32 Wi-Fi & mDNS

- [x] 2.1 Add Wi-Fi station mode initialization to firmware: connect to SSID/password from `wifi_credentials.h`, retry on failure
- [x] 2.2 Add mDNS registration (`digi-shaker.local`) after successful Wi-Fi connection
- [x] 2.3 Add Wi-Fi status logging to serial (IP address, connection/disconnection events)
- [x] 2.4 Add Wi-Fi reconnection logic that does not interrupt active shake cycles

## 3. ESP32 WebSocket Server

- [x] 3.1 Add WebSockets library dependency to `platformio.ini`
- [x] 3.2 Initialize WebSocket server on port 81 after Wi-Fi connects
- [x] 3.3 Implement periodic status message broadcast (JSON, every 500ms) with state, shake count, angle, params, uptime
- [x] 3.4 Implement command message parsing: start, stop, tune, resetCount
- [x] 3.5 Implement config update message parsing: update runtime shake parameters
- [x] 3.6 Implement tune angle message: move servo to target angle in TUNING state
- [x] 3.7 Add WebSocket event logging to serial (connect/disconnect/command received)
- [x] 3.8 Add invalid message handling (malformed JSON, unknown types)

## 4. ESP32 State Machine Refactor

- [x] 4.1 Extend state enum to IDLE, SHAKING, RESTING, TUNING
- [x] 4.2 Implement IDLE state: servo centered and detached, waiting for commands
- [x] 4.3 Implement TUNING state: slow servo movement to target angle (1 degree per 20ms), hold position
- [x] 4.4 Implement state transitions: start→SHAKING, stop→IDLE, tune→TUNING from any state
- [x] 4.5 Refactor shake parameters from compile-time constants to runtime variables with config.h defaults
- [x] 4.6 Implement shake counter reset command
- [x] 4.7 Remove the DEBUG_ANGLE serial logging (replaced by WebSocket status reporting)

## 5. Dashboard Backend

- [x] 5.1 Set up Hono server with Bun, listening on configurable port (default 3000)
- [x] 5.2 Implement ESP32 WebSocket client: connect to `ESP32_HOST:81`, reconnect with exponential backoff
- [x] 5.3 Implement browser WebSocket endpoint at `/ws`: accept connections, relay ESP32 status
- [x] 5.4 Implement command relay: forward browser commands to ESP32, return error if ESP32 disconnected
- [x] 5.5 Implement status enrichment: calculate encounter probability from shake count, append to status messages
- [x] 5.6 Set up SQLite database with `bun:sqlite`: schema for sessions, encounters, and config
- [x] 5.7 Implement session recording: log shake cycles with timestamps, counts, duration, parameters
- [x] 5.8 Implement encounter recording: log counter resets with timestamp and shake count
- [x] 5.9 Implement history query endpoint: sessions grouped by day
- [x] 5.10 Implement last-known config persistence and resend on ESP32 reconnection
- [x] 5.11 Configure Hono to serve static SolidJS build files

## 6. Dashboard UI - Setup & Layout

- [x] 6.1 Initialize SolidJS project with Vite and TypeScript in `dashboard/ui/`
- [x] 6.2 Create WebSocket client module (`lib/ws.ts`): connect to backend, expose reactive signals for status
- [x] 6.3 Create App layout with header (title + connection indicator) and main content panels

## 7. Dashboard UI - Status & Controls

- [x] 7.1 Build connection status indicator component (green/yellow/red)
- [x] 7.2 Build status panel: current state, cycle count, uptime
- [x] 7.3 Build start/stop control buttons
- [x] 7.4 Build counter reset button ("Monster encountered")

## 8. Dashboard UI - Parameter Tuning

- [x] 8.1 Build parameter slider components for: center angle, amplitude, frequency, shake duration, rest duration
- [x] 8.2 Wire sliders to send config updates via WebSocket with debounced sending (< 100ms)
- [x] 8.3 Build tuning mode toggle and target angle slider
- [x] 8.4 Build "Set as center" / "Set as min" / "Set as max" buttons in tuning mode
- [x] 8.5 Build "Test shake" button in tuning mode
- [x] 8.6 Display live current angle readout

## 9. Dashboard UI - Encounter Tracker

- [x] 9.1 Build encounter probability display with cumulative probability calculation (0%/40%/60%/90%/100%)
- [x] 9.2 Build progress bar with visual urgency colors (neutral → warning → alert)
- [x] 9.3 Build estimated shakes remaining display
- [x] 9.4 Build estimated time remaining display (based on shake frequency and duration params)

## 10. Dashboard UI - Session History

- [x] 10.1 Build history panel with daily session summaries
- [x] 10.2 Display encounter markers in history (when monster was encountered, at what shake count)

## 11. Docker & CI

- [x] 11.1 Create `dashboard/Dockerfile`: Bun base image, build SolidJS, run Hono server
- [x] 11.2 Create `docker-compose.example.yml` with port mapping, volume mount, and ESP32_HOST env var
- [x] 11.3 Create GitHub Actions workflow: build Docker image on push to main, push to ghcr.io with `latest` and commit SHA tags
