import { status } from "../lib/ws";

export default function EncounterTracker() {
  const s = () => status();
  const encounter = () => s()?.encounter;
  const rawSteps = () => s()?.stepCount ?? 0;
  const calibratedSteps = () => s()?.calibratedStepCount ?? rawSteps();
  const isCalibrated = () => (s()?.calibrationSource ?? "none") !== "none";

  const probability = () => encounter()?.probability ?? 0;
  const percentLabel = () => `${Math.round(probability() * 100)}%`;

  const shakesRemaining = () => {
    const remaining = encounter()?.estimatedShakesRemaining;
    if (remaining === null || remaining === undefined) return "–";
    if (remaining === 0 && calibratedSteps() >= 550) return "Overdue";
    return `~${remaining}`;
  };

  const barWidth = () => {
    const steps = calibratedSteps();
    if (steps >= 550) return 100;
    return (steps / 550) * 100;
  };

  const urgency = () => {
    const p = probability();
    if (p >= 0.9) return "high";
    if (p >= 0.4) return "medium";
    return "low";
  };

  const estimatedTime = () => {
    const remaining = encounter()?.estimatedShakesRemaining;
    if (!remaining || !s()) return "–";

    const p = s()!.params;
    const ratio = s()!.calibrationRatio ?? 1;
    // Calibrated steps per cycle = frequency * shakeDuration * ratio
    const calibratedStepsPerCycle = p.frequency * p.shakeDuration * ratio;
    const cycleTimeS = p.shakeDuration + p.restDuration;
    const cyclesNeeded = remaining / calibratedStepsPerCycle;
    const totalSeconds = cyclesNeeded * cycleTimeS;
    const minutes = Math.floor(totalSeconds / 60);

    if (minutes < 1) return "< 1 min";
    return `~${minutes} min`;
  };

  const stepsDisplay = () => {
    if (isCalibrated()) {
      return `~${calibratedSteps()} / ${rawSteps()} steps`;
    }
    return `${rawSteps()} steps`;
  };

  return (
    <div class="panel">
      <div class="panel-title">Encounter Tracker</div>

      <div class="encounter-bar-container">
        <div
          class={`encounter-bar ${urgency()}`}
          style={`width: ${Math.max(barWidth(), 5)}%`}
        >
          {percentLabel()}
        </div>
      </div>

      <div class="encounter-stats">
        <span>{stepsDisplay()}</span>
        <span>Remaining: {shakesRemaining()}</span>
        <span>ETA: {estimatedTime()}</span>
      </div>
    </div>
  );
}
