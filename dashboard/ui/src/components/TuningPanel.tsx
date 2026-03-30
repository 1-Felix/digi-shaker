import { createSignal, Show, createEffect } from "solid-js";
import { status, sendCommand, sendConfig, sendTuneAngle, type ShakeParams } from "../lib/ws";

export default function TuningPanel() {
  const s = () => status();
  const params = () => s()?.params;
  const isTuning = () => s()?.state === "tuning";

  // Local slider state -- initialize from ESP32 params when they arrive
  const [center, setCenter] = createSignal(60);
  const [amp, setAmp] = createSignal(60);
  const [freq, setFreq] = createSignal(4.0);
  const [shakeDur, setShakeDur] = createSignal(30);
  const [restDur, setRestDur] = createSignal(5);
  const [tuneAngle, setTuneAngle] = createSignal(90);
  const [mode, setMode] = createSignal<"shake" | "tune">("shake");
  const [initialized, setInitialized] = createSignal(false);

  // Sync from ESP32 once on first status
  createEffect(() => {
    const p = params();
    if (p && !initialized()) {
      setCenter(p.center);
      setAmp(p.amplitude);
      setFreq(p.frequency);
      setShakeDur(p.shakeDuration);
      setRestDur(p.restDuration);
      setTuneAngle(p.center);
      setInitialized(true);
    }
  });

  let configTimeout: ReturnType<typeof setTimeout> | undefined;

  function sendConfigDebounced() {
    clearTimeout(configTimeout);
    configTimeout = setTimeout(() => {
      sendConfig({
        center: center(),
        amplitude: amp(),
        frequency: freq(),
        shakeDuration: shakeDur(),
        restDuration: restDur(),
      });
    }, 80);
  }

  let tuneTimeout: ReturnType<typeof setTimeout> | undefined;

  function sendTuneDebounced(angle: number) {
    setTuneAngle(angle);
    clearTimeout(tuneTimeout);
    tuneTimeout = setTimeout(() => {
      sendTuneAngle(angle);
    }, 50);
  }

  function enterTuneMode() {
    setMode("tune");
    sendCommand("tune");
  }

  function exitTuneMode() {
    setMode("shake");
    sendCommand("stop");
  }

  function setAsCenter() {
    setCenter(tuneAngle());
    sendConfigDebounced();
  }

  function setAsMin() {
    const newAmp = center() - tuneAngle();
    if (newAmp > 0) {
      setAmp(newAmp);
      sendConfigDebounced();
    }
  }

  function setAsMax() {
    const newAmp = tuneAngle() - center();
    if (newAmp > 0) {
      setAmp(newAmp);
      sendConfigDebounced();
    }
  }

  function testShake() {
    sendConfig({
      center: center(),
      amplitude: amp(),
      frequency: freq(),
      shakeDuration: shakeDur(),
      restDuration: restDur(),
    });
    sendCommand("start");
    setMode("shake");
  }

  return (
    <div class="panel">
      <div class="panel-title">Tuning</div>

      <div class="mode-toggle">
        <button class={mode() === "shake" ? "active" : ""} onClick={exitTuneMode}>
          Shake Parameters
        </button>
        <button class={mode() === "tune" ? "active" : ""} onClick={enterTuneMode}>
          Calibration
        </button>
      </div>

      {/* Live angle readout */}
      <div class="live-angle">{s()?.angle ?? "–"}°</div>
      <div class="live-angle-label" style="text-align: center; margin-bottom: 1rem">Current angle</div>

      <Show when={mode() === "shake"}>
        <Slider label="Center angle" value={center()} min={0} max={180} unit="°"
          onChange={(v) => { setCenter(v); sendConfigDebounced(); }} />
        <Slider label="Amplitude" value={amp()} min={1} max={90} unit="°"
          onChange={(v) => { setAmp(v); sendConfigDebounced(); }} />
        <Slider label="Frequency" value={freq()} min={0.5} max={8} step={0.5} unit=" Hz"
          onChange={(v) => { setFreq(v); sendConfigDebounced(); }} />
        <Slider label="Shake duration" value={shakeDur()} min={5} max={120} unit="s"
          onChange={(v) => { setShakeDur(v); sendConfigDebounced(); }} />
        <Slider label="Rest duration" value={restDur()} min={1} max={30} unit="s"
          onChange={(v) => { setRestDur(v); sendConfigDebounced(); }} />
      </Show>

      <Show when={mode() === "tune"}>
        <Slider label="Target angle" value={tuneAngle()} min={0} max={180} unit="°"
          onChange={(v) => sendTuneDebounced(v)} />

        <div class="btn-row" style="margin-top: 0.75rem">
          <button class="btn-secondary btn-small" onClick={setAsCenter}>Set as center</button>
          <button class="btn-secondary btn-small" onClick={setAsMin}>Set as min</button>
          <button class="btn-secondary btn-small" onClick={setAsMax}>Set as max</button>
        </div>

        <div style="margin-top: 0.75rem; font-size: 0.875rem; color: var(--text-muted)">
          Center: {center()}° | Min: {center() - amp()}° | Max: {center() + amp()}°
        </div>

        <div class="btn-row" style="margin-top: 0.75rem">
          <button class="btn-primary" onClick={testShake}>Test shake</button>
        </div>
      </Show>
    </div>
  );
}

function Slider(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div class="slider-group">
      <div class="slider-label">
        <span>{props.label}</span>
        <span class="slider-value">{props.value}{props.unit}</span>
      </div>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step ?? 1}
        value={props.value}
        onInput={(e) => props.onChange(Number(e.currentTarget.value))}
      />
    </div>
  );
}
