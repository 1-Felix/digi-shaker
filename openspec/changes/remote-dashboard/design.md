## Context

The digi-shaker is an ESP32 + MG996R servo project that shakes a Digivice D3 V3 to accumulate steps. Currently all configuration is compile-time (`config.h` constants), monitoring is serial-only, and there's no stats persistence. The user needs to tune servo parameters to reliably trigger the Digivice's physical pendulum, and wants to track shake sessions to predict monster encounters (probabilistic at 400/450/500/550 steps).

The ESP32 is on a breadboard with separate power for the servo (5V/2.4A wall charger) and USB for the ESP32. It connects to the home Wi-Fi network. A Docker-hosted dashboard on a local NUC provides the remote interface.

## Goals / Non-Goals

**Goals:**
- ESP32 connects to home Wi-Fi and accepts WebSocket commands for real-time control
- Dashboard backend (Bun + Hono) relays between browser and ESP32, persists stats in SQLite
- SolidJS dashboard UI with live status, parameter tuning, encounter prediction, and session history
- Tuning mode for precise servo calibration without shaking
- Dockerized dashboard with GitHub Actions CI
- Repository restructured with `firmware/` and `dashboard/` directories

**Non-Goals:**
- OTA firmware updates (still flash via USB)
- Multiple ESP32 device support (single shaker)
- User authentication (local network only, trusted)
- Mobile-native app (web dashboard is sufficient)
- Digivice data capture / IR communication (separate future work)
- Home Assistant or MQTT integration

## Decisions

### 1. WebSocket for ESP32 communication
**Choice:** WebSocket (not REST polling or MQTT)
**Rationale:** Parameter tuning requires sub-second round-trip: user drags a slider, servo responds immediately. WebSocket provides persistent bidirectional connection. REST polling would add latency and overhead. MQTT adds a broker dependency for no benefit with a single device.
**Library:** `WebSockets` by Links2004 -- mature, widely used ESP32 WebSocket server library.

### 2. Bun runtime with Hono framework
**Choice:** Bun as the JavaScript runtime, Hono as the web framework
**Rationale:** Bun provides native SQLite (`bun:sqlite`) eliminating the need for a separate database dependency. Hono is lightweight (~14KB), has built-in WebSocket support via `Bun.serve()`, and runs on Bun natively. This keeps the Docker image small and the dependency count low.
**Alternative considered:** Node + Express + better-sqlite3 -- works but heavier, more dependencies, and less modern.

### 3. SolidJS for the dashboard UI
**Choice:** SolidJS with TypeScript, built with Vite
**Rationale:** Fine-grained reactivity without a virtual DOM is ideal for a real-time dashboard where WebSocket messages trigger frequent UI updates. Signals map naturally to live servo state. Small bundle size (~7KB runtime). TypeScript-first.
**Alternative considered:** React -- familiar but virtual DOM overhead is wasteful for a dashboard where individual values update independently. Svelte would also work but SolidJS's JSX familiarity is a plus.

### 4. Two-hop WebSocket architecture
**Choice:** Browser ↔ Hono backend ↔ ESP32 (not browser direct to ESP32)
**Rationale:** The ESP32 has limited WebSocket capacity (2-3 concurrent connections max). The backend acts as a relay and single consumer of the ESP32 connection. It also adds persistence -- the ESP32 doesn't need to store stats across reboots. The backend can serve the dashboard even when the ESP32 is offline.
```
Browser(s) ◀──WS──▶ Hono Server ◀──WS──▶ ESP32
                         │
                     bun:sqlite
```

### 5. ESP32 as WebSocket server, backend as client
**Choice:** ESP32 runs a WebSocket server. The Hono backend connects to it as a client.
**Rationale:** The ESP32 has a known address (mDNS: `digi-shaker.local` or static IP configured in firmware). The backend initiates the connection and reconnects on drops. This is simpler than having the ESP32 know the backend's address. The ESP32 just starts its server and waits.

### 6. JSON message protocol
**Choice:** Simple JSON messages over WebSocket
**Rationale:** Human-readable, easy to debug, and the message rate is low (status updates every ~500ms, commands are sporadic). Binary protocol overhead savings are negligible at this scale.

Message types:
```
// ESP32 → Backend (state reports)
{ "type": "status", "state": "shaking"|"resting"|"tuning"|"idle", "shakeCount": 387, "angle": 122, "params": { "center": 90, "amplitude": 35, "frequency": 3.0, "shakeDuration": 30, "restDuration": 5 }, "uptimeMs": 12345678 }

// Backend → ESP32 (commands)
{ "type": "command", "action": "start"|"stop"|"tune" }
{ "type": "config", "params": { "center": 87, "amplitude": 35, "frequency": 3.0, "shakeDuration": 30, "restDuration": 5 } }
{ "type": "tune", "angle": 87 }

// Backend → Browser (relayed state + enriched data)
{ "type": "status", ...espStatus, "encounter": { "probability": 0.4, "estimatedShakesRemaining": 63 } }
{ "type": "history", "sessions": [...] }
```

### 7. Runtime parameter storage on ESP32
**Choice:** Parameters stored in RAM with compile-time defaults. No EEPROM/NVS persistence on the ESP32.
**Rationale:** The backend is the source of truth for configuration. When the ESP32 reboots, it starts with defaults from `config.h`. The backend can resend the last-used config on reconnection. This avoids EEPROM wear and keeps the firmware simple. If NVS persistence is needed later, it can be added without protocol changes.

### 8. Tuning mode state machine
**Choice:** Add `TUNING` and `IDLE` states alongside existing `SHAKING` and `RESTING`.
```
              start
  IDLE ──────────────────▶ SHAKING
   ▲                         │
   │ stop                    │ duration elapsed
   │                         ▼
   ├──────────────────── RESTING
   │                         │
   │                         │ rest elapsed
   │                         ▼
   │                      SHAKING (cycle)
   │
   │  tune
   ▼
 TUNING ─── (servo holds target angle)
   │
   │ start / stop
   ▼
 IDLE or SHAKING
```
**Rationale:** `IDLE` is the stopped state (servo detached). `TUNING` holds a specific angle for calibration. The existing `SHAKING ↔ RESTING` cycle remains unchanged. Commands can transition between states cleanly.

### 9. Encounter probability calculation
**Choice:** Backend calculates cumulative encounter probability based on shake count.
```
Steps  | Individual | Cumulative
400    | 40%        | 40%
450    | 20%        | 60%
500    | 30%        | 90%
550    | 10%        | 100%
```
**Rationale:** The ESP32 doesn't need this logic -- it just counts shakes. The backend enriches the status with encounter probability before sending to the browser. The thresholds are configurable in the backend (not hardcoded in firmware) so they can be adjusted as the user learns more about the game mechanics through reverse engineering.

### 10. Repository restructuring
**Choice:** Move firmware into `firmware/` subdirectory.
```
digi-shaker/
├── firmware/
│   ├── platformio.ini
│   ├── src/main.cpp
│   └── include/config.h
├── dashboard/
│   ├── server/
│   │   ├── index.ts
│   │   ├── db.ts
│   │   └── esp32-client.ts
│   ├── ui/
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   ├── components/
│   │   │   └── lib/ws.ts
│   │   └── index.html
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── .github/workflows/docker.yml
├── models/
└── openspec/
```
**Rationale:** Clean separation. PlatformIO works fine from a subdirectory (`pio run -d firmware/`). The Docker image only needs the `dashboard/` context. GitHub Actions can build the image on push to main.

### 11. Docker image strategy
**Choice:** Single-stage Bun Docker image. GitHub Actions builds and pushes to GitHub Container Registry (ghcr.io) on push to main.
**Rationale:** Bun images are small. The dashboard is a single server process serving both the API/WebSocket and the static SolidJS build. Volume mount for SQLite data persistence. Simple `docker-compose.yml` for the NUC.

```yaml
# docker-compose.yml (on NUC)
services:
  digi-shaker:
    image: ghcr.io/<user>/digi-shaker:latest
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      - ESP32_HOST=digi-shaker.local  # or IP
```

## Risks / Trade-offs

- **Wi-Fi reliability on ESP32** → The ESP32's Wi-Fi stack can be flaky under heavy servo PWM. Mitigation: WebSocket reconnection logic in the backend with exponential backoff. Status updates every 500ms act as a heartbeat.
- **mDNS resolution** → `digi-shaker.local` may not resolve reliably across all networks. Mitigation: support both mDNS and static IP configuration in the backend's environment variables.
- **ESP32 memory with WebSocket + Wi-Fi** → Wi-Fi and WebSocket server together consume significant RAM. Mitigation: limit to 1-2 concurrent WebSocket connections, keep JSON messages small, avoid string concatenation in firmware.
- **SQLite on Docker volume** → If the container is recreated without the volume mount, data is lost. Mitigation: document the volume mount clearly, include it in the example docker-compose.yml.
- **Single point of failure** → If the backend goes down, there's no way to control the shaker remotely. Mitigation: the ESP32 continues its current shake cycle autonomously. It doesn't stop just because the WebSocket disconnects. The backend is stateless enough to restart cleanly.
- **Parameter drift** → If the ESP32 reboots it loses runtime config. Mitigation: backend resends last-known config on WebSocket reconnection.
