import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { Esp32Client } from "./esp32-client";
import { getEncounterInfo } from "./encounter";
import { getHistory } from "./db";
import type { ServerWebSocket } from "bun";

const PORT = Number(process.env.PORT ?? 3000);
const ESP32_HOST = process.env.ESP32_HOST ?? "digi-shaker.local";
const ESP32_PORT = Number(process.env.ESP32_PORT ?? 81);

// --- ESP32 client ---
const esp32 = new Esp32Client(ESP32_HOST, ESP32_PORT);
esp32.connect();

// --- Browser WebSocket clients ---
const browserClients = new Set<ServerWebSocket<unknown>>();

// Relay ESP32 status to all browser clients with encounter enrichment
esp32.onStatus((status) => {
  const enriched = {
    ...status,
    encounter: getEncounterInfo(status.stepCount),
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

        if (!esp32.isConnected) {
          ws.send(JSON.stringify({ type: "error", message: "ESP32 not connected" }));
          return;
        }

        switch (data.type) {
          case "command":
            if (data.action === "resetCount") {
              esp32.sendResetCount();
            } else {
              esp32.sendCommand(data.action);
            }
            break;
          case "config":
            esp32.sendConfig(data.params);
            break;
          case "tune":
            esp32.sendTuneAngle(data.angle);
            break;
          case "history":
            ws.send(JSON.stringify({
              type: "history",
              data: getHistory(data.days ?? 14),
            }));
            break;
        }
      } catch {
        // ignore malformed messages
      }
    },
    close(ws) {
      browserClients.delete(ws);
      console.log(`[WS] Browser disconnected (${browserClients.size} total)`);
    },
  },
});

console.log(`[SERVER] Dashboard running on http://localhost:${server.port}`);
console.log(`[SERVER] ESP32 target: ws://${ESP32_HOST}:${ESP32_PORT}`);
