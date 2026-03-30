import type { ShakeParams } from "./db";
import { getLastConfig, saveConfig, recordSessionStart, recordSessionEnd, recordEncounter } from "./db";

type StatusHandler = (status: Esp32Status) => void;

export interface Esp32Status {
  type: "status";
  state: "idle" | "shaking" | "resting" | "tuning";
  stepCount: number;
  cycleCount: number;
  angle: number;
  uptimeMs: number;
  params: ShakeParams;
}

export class Esp32Client {
  private ws: WebSocket | null = null;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private statusHandlers: StatusHandler[] = [];
  private connected = false;
  private lastState: string | null = null;
  private lastShakeCount = 0;
  private _lastParams: ShakeParams | null = null;
  private activeSessionId: number | null = null;
  private sessionStartCount = 0;
  private sessionStartTime = 0;

  constructor(private host: string, private port = 81) {}

  get isConnected() {
    return this.connected;
  }

  get lastParams() {
    return this._lastParams;
  }

  onStatus(handler: StatusHandler) {
    this.statusHandlers.push(handler);
  }

  connect() {
    const url = `ws://${this.host}:${this.port}`;
    console.log(`[ESP32] Connecting to ${url}`);

    try {
      this.ws = new WebSocket(url);
    } catch {
      console.error(`[ESP32] Failed to create WebSocket to ${url}`);
      this.scheduleReconnect();
      return;
    }

    this.ws.addEventListener("open", () => {
      console.log("[ESP32] Connected");
      this.connected = true;
      this.reconnectDelay = 1000;

      // Resend last-known config
      const config = getLastConfig();
      if (config) {
        this.sendConfig(config);
        console.log("[ESP32] Resent last-known config");
      }
    });

    this.ws.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(String(event.data));
        if (data.type === "status") {
          this.handleStatusUpdate(data);
          for (const handler of this.statusHandlers) {
            handler(data);
          }
        }
      } catch {
        // ignore malformed messages
      }
    });

    this.ws.addEventListener("close", () => {
      console.log("[ESP32] Disconnected");
      this.connected = false;
      this.ws = null;
      this.scheduleReconnect();
    });

    this.ws.addEventListener("error", () => {
      // close event will fire after this
    });
  }

  send(message: Record<string, unknown>) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;
    this.ws.send(JSON.stringify(message));
    return true;
  }

  sendCommand(action: string) {
    return this.send({ type: "command", action });
  }

  sendConfig(params: ShakeParams) {
    saveConfig(params);
    return this.send({ type: "config", params });
  }

  sendTuneAngle(angle: number) {
    return this.send({ type: "tune", angle });
  }

  sendResetCount() {
    recordEncounter(this.lastShakeCount);
    return this.sendCommand("resetCount");
  }

  private handleStatusUpdate(status: Esp32Status) {
    // Track state transitions for session recording
    const prevState = this.lastState;
    this.lastState = status.state;
    this.lastShakeCount = status.stepCount;
    this._lastParams = status.params;

    // Session started: idle/resting → shaking
    if (status.state === "shaking" && prevState !== "shaking" && prevState !== null) {
      this.sessionStartCount = status.stepCount;
      this.sessionStartTime = Date.now();
      this.activeSessionId = recordSessionStart(this.sessionStartCount, status.params);
    }

    // Session ended: shaking → resting/idle
    if (prevState === "shaking" && status.state !== "shaking" && this.activeSessionId !== null) {
      const durationS = Math.round((Date.now() - this.sessionStartTime) / 1000);
      recordSessionEnd(this.activeSessionId, status.stepCount, durationS);
      this.activeSessionId = null;
    }
  }

  private scheduleReconnect() {
    console.log(`[ESP32] Reconnecting in ${this.reconnectDelay / 1000}s`);
    setTimeout(() => this.connect(), this.reconnectDelay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
  }
}
