import { Show } from "solid-js";
import { status, sendCommand, resetCount } from "../lib/ws";

function formatUptime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function StatusPanel() {
  const s = () => status();
  const state = () => s()?.state ?? "idle";
  const isRunning = () => state() === "shaking" || state() === "resting";

  return (
    <div class="panel">
      <div class="panel-title">Status</div>
      <Show when={s()} fallback={<span class="state-label idle">Waiting...</span>}>
        <div class={`state-label ${state()}`}>{state()}</div>
        <div class="stat-row">
          <span>Steps: {s()!.stepCount}</span>
          <span>Cycle #{s()!.cycleCount}</span>
          <span>Uptime: {formatUptime(s()!.uptimeMs)}</span>
        </div>
        <div class="btn-row" style="margin-top: 0.75rem">
          <button
            class="btn-primary"
            onClick={() => sendCommand("start")}
            disabled={state() === "shaking"}
          >
            Start
          </button>
          <button
            class="btn-danger"
            onClick={() => sendCommand("stop")}
            disabled={state() === "idle"}
          >
            Stop
          </button>
          <button
            class="btn-secondary"
            onClick={() => {
              resetCount();
            }}
          >
            Monster encountered
          </button>
        </div>
      </Show>
    </div>
  );
}
