import { createSignal } from "solid-js";

export interface ShakeParams {
  center: number;
  amplitude: number;
  frequency: number;
  shakeDuration: number;
  restDuration: number;
}

export interface EncounterInfo {
  probability: number;
  estimatedShakesRemaining: number | null;
}

export interface ShakerStatus {
  type: "status";
  state: "idle" | "shaking" | "resting" | "tuning";
  shakeCount: number;
  angle: number;
  uptimeMs: number;
  params: ShakeParams;
  encounter: EncounterInfo;
  esp32Connected: boolean;
}

export interface DailyHistory {
  date: string;
  sessionCount: number;
  totalShakes: number;
  encounters: Array<{ occurredAt: string; shakeCount: number }>;
}

// --- Signals ---
const [status, setStatus] = createSignal<ShakerStatus | null>(null);
const [backendConnected, setBackendConnected] = createSignal(false);
const [esp32Connected, setEsp32Connected] = createSignal(false);
const [history, setHistory] = createSignal<DailyHistory[]>([]);

let socket: WebSocket | null = null;

function connect() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const url = `${protocol}//${window.location.host}/ws`;
  socket = new WebSocket(url);

  socket.addEventListener("open", () => {
    setBackendConnected(true);
    // Request history on connect
    socket?.send(JSON.stringify({ type: "history", days: 14 }));
  });

  socket.addEventListener("message", (event) => {
    try {
      const data = JSON.parse(event.data);

      if (data.type === "status") {
        setStatus(data);
        setEsp32Connected(data.esp32Connected);
      } else if (data.type === "connection") {
        setEsp32Connected(data.esp32Connected);
      } else if (data.type === "history") {
        setHistory(data.data);
      }
    } catch {
      // ignore
    }
  });

  socket.addEventListener("close", () => {
    setBackendConnected(false);
    setEsp32Connected(false);
    socket = null;
    setTimeout(connect, 2000);
  });

  socket.addEventListener("error", () => {
    // close will fire
  });
}

// --- Send helpers ---

function send(data: Record<string, unknown>) {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  }
}

export function sendCommand(action: string) {
  send({ type: "command", action });
}

export function sendConfig(params: ShakeParams) {
  send({ type: "config", params });
}

export function sendTuneAngle(angle: number) {
  send({ type: "tune", angle });
}

export function resetCount() {
  send({ type: "command", action: "resetCount" });
}

export function requestHistory(days = 14) {
  send({ type: "history", days });
}

// Initialize on import
connect();

export { status, backendConnected, esp32Connected, history };
