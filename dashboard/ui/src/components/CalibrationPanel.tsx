import { createSignal, Show, For } from "solid-js";
import {
  status, calibrationData, sendCommand, trackedShakingDuration,
  submitCalibration, deleteCalibrationSample, requestCalibration,
  startCalibrationTracking, stopCalibrationTracking,
} from "../lib/ws";

export default function CalibrationPanel() {
  const s = () => status();
  const cal = () => calibrationData();

  const [calibrating, setCalibrating] = createSignal(false);
  const [startStepCount, setStartStepCount] = createSignal(0);
  const [oscillations, setOscillations] = createSignal(0);
  const [actualSteps, setActualSteps] = createSignal("");
  const [showDone, setShowDone] = createSignal(false);
  const [expandedConfig, setExpandedConfig] = createSignal<string | null>(null);

  function startCalibration() {
    const current = s()?.stepCount ?? 0;
    setStartStepCount(current);
    setCalibrating(true);
    setShowDone(false);
    setActualSteps("");
    startCalibrationTracking();
    // Start shaking if idle
    if (s()?.state === "idle" || s()?.state === "tuning") {
      sendCommand("start");
    }
  }

  function stopCalibration() {
    const current = s()?.stepCount ?? 0;
    setOscillations(current - startStepCount());
    setCalibrating(false);
    setShowDone(true);
    stopCalibrationTracking();
    sendCommand("stop");
  }

  function handleSubmit() {
    const steps = parseInt(actualSteps());
    const osc = oscillations();
    if (isNaN(steps) || steps <= 0 || steps > osc) return;
    submitCalibration(osc, steps, trackedShakingDuration() ?? undefined);
    setShowDone(false);
    setActualSteps("");
    // Refresh calibration data
    setTimeout(() => requestCalibration(), 200);
  }

  const validInput = () => {
    const steps = parseInt(actualSteps());
    return !isNaN(steps) && steps > 0 && steps <= oscillations();
  };

  const currentRatio = () => {
    const c = cal();
    if (!c) return null;
    return c;
  };

  const ratioLabel = () => {
    const c = currentRatio();
    if (!c || c.source === "none") return "Not calibrated";
    const pct = Math.round(c.ratio * 100);
    if (c.source === "config") return `${pct}% efficiency (${c.sampleCount} samples, this config)`;
    return `${pct}% efficiency (${c.sampleCount} samples, global avg)`;
  };

  function toggleConfig(key: string) {
    setExpandedConfig(expandedConfig() === key ? null : key);
  }

  return (
    <div class="panel">
      <div class="panel-title">Calibration</div>

      {/* Calibration flow */}
      <Show when={!calibrating() && !showDone()}>
        <button class="btn-primary" onClick={startCalibration} style="width: 100%">
          Start Calibration
        </button>
      </Show>

      <Show when={calibrating()}>
        <div style="text-align: center; margin-bottom: 0.75rem">
          <div style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.25rem">
            Oscillations this run
          </div>
          <div style="font-size: 2rem; font-weight: 700; color: var(--primary); font-variant-numeric: tabular-nums">
            {(s()?.stepCount ?? 0) - startStepCount()}
          </div>
        </div>
        <button class="btn-danger" onClick={stopCalibration} style="width: 100%">
          Stop Calibration
        </button>
      </Show>

      <Show when={showDone()}>
        <div style="margin-bottom: 0.75rem">
          <div style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.5rem">
            Oscillations recorded: <strong>{oscillations()}</strong>
          </div>
          <div style="font-size: 0.875rem; margin-bottom: 0.25rem">
            Actual steps on Digivice:
          </div>
          <div style="display: flex; gap: 0.5rem">
            <input
              type="number"
              min="1"
              max={oscillations()}
              value={actualSteps()}
              onInput={(e) => setActualSteps(e.currentTarget.value)}
              placeholder="Enter step count"
              style="flex: 1; padding: 0.5rem; border-radius: 0.5rem; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 0.875rem"
            />
            <button
              class="btn-primary"
              onClick={handleSubmit}
              disabled={!validInput()}
            >
              Submit
            </button>
          </div>
          <Show when={actualSteps() !== "" && !validInput()}>
            <div style="color: var(--danger); font-size: 0.8125rem; margin-top: 0.25rem">
              Must be between 1 and {oscillations()}
            </div>
          </Show>
        </div>
      </Show>

      {/* Current ratio */}
      <div style="margin-top: 0.75rem; font-size: 0.875rem; color: var(--text-muted)">
        {ratioLabel()}
      </div>

      {/* Settings efficiency comparison */}
      <Show when={cal()?.history && cal()!.history.length > 0}>
        <div style="margin-top: 1rem">
          <div class="panel-title">Settings Efficiency</div>
          <For each={cal()!.history}>
            {(config) => {
              const key = `${config.centerAngle}:${config.amplitude}:${config.frequency}`;
              const expanded = () => expandedConfig() === key;
              return (
                <div>
                  <div
                    class="history-day"
                    style="cursor: pointer"
                    onClick={() => toggleConfig(key)}
                  >
                    <div>
                      <span class="history-date">
                        c:{config.centerAngle}° a:{config.amplitude}° f:{config.frequency}Hz
                      </span>
                    </div>
                    <span class="history-stats">
                      {Math.round(config.throughput)} steps/min, {Math.round(config.avgRatio * 100)}% eff ({config.sampleCount})
                    </span>
                  </div>
                  <Show when={expanded()}>
                    <div style="padding: 0 0.5rem 0.5rem; font-size: 0.8125rem">
                      <For each={config.samples}>
                        {(sample) => (
                          <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.25rem 0; color: var(--text-muted)">
                            <span>
                              {sample.actualSteps}/{sample.oscillationCount} = {Math.round(sample.ratio * 100)}%
                            </span>
                            <button
                              class="btn-secondary btn-small"
                              style="padding: 0.125rem 0.5rem; font-size: 0.75rem"
                              onClick={() => deleteCalibrationSample(sample.id)}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </For>
                    </div>
                  </Show>
                </div>
              );
            }}
          </For>
        </div>
      </Show>
    </div>
  );
}
