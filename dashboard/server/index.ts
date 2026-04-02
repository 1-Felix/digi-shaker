import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { Esp32Client } from "./esp32-client";
import { getEncounterInfo } from "./encounter";
import { getHistory, insertCalibration, deleteCalibration, getCalibrationRatio, getCalibrationHistory } from "./db";
import type { ServerWebSocket } from "bun";

const PORT = Number(process.env.PORT ?? 3000);
const ESP32_HOST = process.env.ESP32_HOST ?? "digi-shaker.local";
const ESP32_PORT = Number(process.env.ESP32_PORT ?? 81);

// --- ESP32 client ---
const esp32 = new Esp32Client(ESP32_HOST, ESP32_PORT);
esp32.connect();

// --- Browser WebSocket clients ---
const browserClients = new Set<ServerWebSocket<unknown>>();

// --- Calibration tracking per client ---
interface CalibrationState {
  shakingMs: number;
  lastShakingStart: number | null;
  lastState: string | null;
}

const calibrationTracking = new Map<ServerWebSocket<unknown>, CalibrationState>();

// Relay ESP32 status to all browser clients with encounter enrichment
esp32.onStatus((status) => {
  // Update shaking duration for active calibration runs
  for (const [, cal] of calibrationTracking) {
    const now = Date.now();
    if (cal.lastState === "shaking" && status.state !== "shaking") {
      // Transitioned away from shaking — accumulate elapsed
      if (cal.lastShakingStart !== null) {
        cal.shakingMs += now - cal.lastShakingStart;
        cal.lastShakingStart = null;
      }
    } else if (cal.lastState !== "shaking" && status.state === "shaking") {
      // Transitioned into shaking — start timing
      cal.lastShakingStart = now;
    }
    cal.lastState = status.state;
  }

  const calibration = getCalibrationRatio(
    status.params.center, status.params.amplitude, status.params.frequency,
  );
  const calibratedStepCount = Math.round(status.stepCount * calibration.ratio);
  const enriched = {
    ...status,
    encounter: getEncounterInfo(calibratedStepCount),
    calibrationRatio: calibration.ratio,
    calibrationSource: calibration.source,
    calibratedStepCount,
    esp32Connected: esp32.isConnected,
  };
  const json = JSON.stringify(enriched);
  for (const client of browserClients) {
    client.send(json);
  }
});

// --- Hono app ---
const app = new Hono();

// REST endpoint for history
app.get("/api/history", (c) => {
  const days = Number(c.req.query("days") ?? 14);
  return c.json(getHistory(days));
});

// Serve static SolidJS build
app.use("/*", serveStatic({ root: "./dist/public" }));

// SPA fallback
app.get("*", serveStatic({ path: "./dist/public/index.html" }));

// --- Start server with WebSocket upgrade ---
const server = Bun.serve({
  port: PORT,
  fetch(req, server) {
    const url = new URL(req.url);

    // WebSocket upgrade for /ws
    if (url.pathname === "/ws") {
      if (server.upgrade(req)) return;
      return new Response("WebSocket upgrade failed", { status: 400 });
    }

    // Delegate to Hono
    return app.fetch(req);
  },
  websocket: {
    open(ws) {
      browserClients.add(ws);
      console.log(`[WS] Browser connected (${browserClients.size} total)`);

      // Send current connection status
      ws.send(JSON.stringify({
        type: "connection",
        esp32Connected: esp32.isConnected,
      }));
    },
    message(ws, message) {
      try {
        const data = JSON.parse(String(message));

        switch (data.type) {
          case "command":
            if (!esp32.isConnected) {
              ws.send(JSON.stringify({ type: "error", message: "ESP32 not connected" }));
              return;
            }
            if (data.action === "resetCount") {
              esp32.sendResetCount();
            } else {
              esp32.sendCommand(data.action);
            }
            break;
          case "config":
            if (!esp32.isConnected) {
              ws.send(JSON.stringify({ type: "error", message: "ESP32 not connected" }));
              return;
            }
            esp32.sendConfig(data.params);
            break;
          case "tune":
            if (!esp32.isConnected) {
              ws.send(JSON.stringify({ type: "error", message: "ESP32 not connected" }));
              return;
            }
            esp32.sendTuneAngle(data.angle);
            break;
          case "history":
            ws.send(JSON.stringify({
              type: "history",
              data: getHistory(data.days ?? 14),
            }));
            break;
          case "startCalibration": {
            calibrationTracking.set(ws, {
              shakingMs: 0,
              lastShakingStart: null,
              lastState: null,
            });
            break;
          }
          case "stopCalibration": {
            const cal = calibrationTracking.get(ws);
            let shakingDurationS = 0;
            if (cal) {
              // Finalize any in-progress shaking interval
              if (cal.lastShakingStart !== null) {
                cal.shakingMs += Date.now() - cal.lastShakingStart;
              }
              shakingDurationS = Math.round(cal.shakingMs / 1000 * 10) / 10;
              calibrationTracking.delete(ws);
            }
            ws.send(JSON.stringify({
              type: "calibrationStopped",
              shakingDurationS,
            }));
            break;
          }
          case "calibration": {
            const params = esp32.lastParams;
            if (!params) {
              ws.send(JSON.stringify({ type: "error", message: "No ESP32 params available" }));
              return;
            }
            insertCalibration(
              data.oscillationCount, data.actualSteps,
              params.center, params.amplitude, params.frequency,
              data.shakingDurationS,
            );
            const ratio = getCalibrationRatio(params.center, params.amplitude, params.frequency);
            ws.send(JSON.stringify({
              type: "calibrationUpdate",
              ...ratio,
              history: getCalibrationHistory(),
            }));
            break;
          }
          case "getCalibration": {
            const params = esp32.lastParams;
            const ratio = params
              ? getCalibrationRatio(params.center, params.amplitude, params.frequency)
              : { ratio: 1.0, source: "none", sampleCount: 0 };
            ws.send(JSON.stringify({
              type: "calibrationUpdate",
              ...ratio,
              history: getCalibrationHistory(),
            }));
            break;
          }
          case "deleteCalibration": {
            deleteCalibration(data.id);
            const params = esp32.lastParams;
            const ratio = params
              ? getCalibrationRatio(params.center, params.amplitude, params.frequency)
              : { ratio: 1.0, source: "none", sampleCount: 0 };
            ws.send(JSON.stringify({
              type: "calibrationUpdate",
              ...ratio,
              history: getCalibrationHistory(),
            }));
            break;
          }
        }
      } catch {
        // ignore malformed messages
      }
    },
    close(ws) {
      browserClients.delete(ws);
      calibrationTracking.delete(ws);
      console.log(`[WS] Browser disconnected (${browserClients.size} total)`);
    },
  },
});

console.log(`[SERVER] Dashboard running on http://localhost:${server.port}`);
console.log(`[SERVER] ESP32 target: ws://${ESP32_HOST}:${ESP32_PORT}`);
