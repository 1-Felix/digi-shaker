## Why

The digi-shaker currently requires serial access to monitor shake state and a firmware recompile to adjust parameters like center angle, amplitude, and frequency. Tuning the servo motion to reliably trigger the Digivice D3 V3's physical pendulum is tedious -- each adjustment means reconnecting USB, editing config.h, recompiling, and reflashing. There's also no way to track how many shakes have been performed, which matters because a monster encounter triggers at a random step count (400-550 steps) and requires manual interaction with the device.

A remote dashboard solves both problems: live parameter tuning over Wi-Fi and session/shake tracking with encounter probability estimation, so the user knows when to come back to the device.

## What Changes

- Add Wi-Fi connectivity to the ESP32 firmware with a WebSocket server for bidirectional communication
- Add a "slow/tuning" mode to the firmware where the servo moves to a target angle and holds for calibration
- Make all shake parameters runtime-configurable via WebSocket commands (no more recompile)
- Build a web dashboard (Bun + Hono backend, SolidJS frontend) that connects to the ESP32 over WebSocket
- Dashboard provides: live status, start/stop controls, parameter tuning sliders, encounter probability tracker, and session history
- Backend persists shake stats in SQLite (bun:sqlite) for historical tracking
- Dockerize the dashboard for deployment on a NUC via GitHub Actions
- Restructure the repo: move firmware into `firmware/` subdirectory, add `dashboard/` for the web app

## Capabilities

### New Capabilities
- `wifi-connectivity`: ESP32 Wi-Fi station mode, connects to home network, mDNS discovery
- `websocket-protocol`: Bidirectional WebSocket communication protocol between ESP32, backend, and browser
- `tuning-mode`: Slow servo mode for calibration -- move to target angle, hold, set as center/min/max
- `dashboard-backend`: Hono server on Bun -- relays commands between browser and ESP32, persists stats in SQLite
- `dashboard-ui`: SolidJS frontend -- status panel, tuning controls, encounter tracker, session history
- `encounter-tracker`: Shake counting with probabilistic encounter prediction (40% at 400, 20% at 450, 30% at 500, 10% at 550)
- `docker-deployment`: Dockerfile and GitHub Actions workflow for building and publishing the dashboard container

### Modified Capabilities
- `shake-patterns`: Parameters become runtime-configurable via WebSocket instead of compile-time constants. Constants in config.h become defaults that can be overridden at runtime.
- `servo-control`: Add slow/tuning mode alongside the existing shake mode. Servo accepts target angle commands for calibration.
- `serial-interface`: Serial logging remains for local debugging but is no longer the primary monitoring interface.

## Impact

- **Firmware (`firmware/src/main.cpp`, `firmware/include/config.h`)**: Major changes -- Wi-Fi stack, WebSocket server, runtime parameter storage, tuning mode state machine
- **Project structure**: Existing firmware files move from root `src/`/`include/` to `firmware/src/`/`firmware/include/`. `platformio.ini` moves to `firmware/`
- **New directory**: `dashboard/` with Hono server, SolidJS app, Dockerfile
- **New dependencies (firmware)**: WiFi.h, ESPmDNS, WebSocketsServer (or similar ESP32 WebSocket library)
- **New dependencies (dashboard)**: Bun runtime, Hono, SolidJS, Vite
- **CI/CD**: New GitHub Actions workflow for Docker image build and push
- **Network**: ESP32 needs Wi-Fi credentials (SSID/password in config), dashboard needs to know ESP32's address (mDNS or configured IP)
