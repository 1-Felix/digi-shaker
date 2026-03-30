import { For, Show, createEffect } from "solid-js";
import { history, requestHistory } from "../lib/ws";

export default function HistoryPanel() {
  // Refresh history every 60 seconds
  createEffect(() => {
    const interval = setInterval(() => requestHistory(), 60_000);
    return () => clearInterval(interval);
  });

  return (
    <div class="panel">
      <div class="panel-title">History</div>
      <Show when={history().length > 0} fallback={
        <div style="color: var(--text-muted); font-size: 0.875rem">No sessions recorded yet</div>
      }>
        <For each={history()}>
          {(day) => (
            <div class="history-day">
              <div>
                <span class="history-date">{day.date}</span>
                <For each={day.encounters}>
                  {(enc) => (
                    <span class="encounter-marker">
                      Battle @ {enc.shakeCount}
                    </span>
                  )}
                </For>
              </div>
              <span class="history-stats">
                {day.sessionCount} sessions · {day.totalShakes} shakes
              </span>
            </div>
          )}
        </For>
      </Show>
    </div>
  );
}
