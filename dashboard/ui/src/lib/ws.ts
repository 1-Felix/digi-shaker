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
  stepCount: number;
  cycleCount: number;
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

export interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}
const [toasts, setToasts] = createSignal<Toast[]>([]);
let toastId = 0;

export function addToast(message: string, type: Toast["type"] = "info") {
  const id = ++toastId;
  setToasts((prev) => [...prev, { id, message, type }]);
  setTimeout(() => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, 3000);
}

export function dismissToast(id: number) {
  setToasts((prev) => prev.filter((t) => t.id !== id));
}

let socket: WebSocket | null = null;

function connect() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const url = `${protocol}//${window.location.host}/ws`;
  socket = new WebSocket(url);

  socket.addEventListener("open", () => {
    setBackendConnected(true);
    addToast("Connected to dashboard", "success");
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
        if (!data.esp32Connected) {
          addToast("ESP32 disconnected", "error");
        }
      } else if (data.type === "history") {
        setHistory(data.data);
      } else if (data.type === "error") {
        addToast(data.message, "error");
      }
    } catch {
      // ignore
    }
  });

  socket.addEventListener("close", () => {
    setBackendConnected(false);
    setEsp32Connected(false);
    addToast("Disconnected from dashboard", "error");
    socket = null;
    setTimeout(connect, 2000);
  });

  socket.addEventListener("error", () => {
    // close will fire
  });
}

// --- Send helpers ---

function send(data: Record<string, unknown>): boolean {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
    return true;
  }
  addToast("Not connected", "error");
  return false;
}

export function sendCommand(action: string) {
  if (send({ type: "command", action })) {
    const labels: Record<string, string> = {
      start: "Starting shaker",
      stop: "Stopping shaker",
      tune: "Entering tuning mode",
      resetCount: "Counter reset",
    };
    addToast(labels[action] ?? `Command: ${action}`, "success");
  }
}

export function sendConfig(params: ShakeParams) {
  send({ type: "config", params });
}

export function sendTuneAngle(angle: number) {
  send({ type: "tune", angle });
}

export function resetCount() {
  sendCommand("resetCount");
}

export function requestHistory(days = 14) {
  send({ type: "history", days });
}

// Initialize on import
connect();

export { status, backendConnected, esp32Connected, history, toasts };
