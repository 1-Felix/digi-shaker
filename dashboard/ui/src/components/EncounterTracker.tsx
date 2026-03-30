import { status } from "../lib/ws";

export default function EncounterTracker() {
  const s = () => status();
  const encounter = () => s()?.encounter;
  const stepCount = () => s()?.stepCount ?? 0;

  const probability = () => encounter()?.probability ?? 0;
  const percentLabel = () => `${Math.round(probability() * 100)}%`;

  const shakesRemaining = () => {
    const remaining = encounter()?.estimatedShakesRemaining;
    if (remaining === null || remaining === undefined) return "–";
    if (remaining === 0 && stepCount() >= 550) return "Overdue";
    return `~${remaining}`;
  };

  const barWidth = () => {
    if (stepCount() >= 550) return 100;
    if (stepCount() < 400) return (stepCount() / 550) * 100;
    return (stepCount() / 550) * 100;
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
    // Steps per cycle = frequency * shakeDuration
    // Cycle time = shakeDuration + restDuration
    const stepsPerCycle = p.frequency * p.shakeDuration;
    const cycleTimeS = p.shakeDuration + p.restDuration;
    const cyclesNeeded = remaining / stepsPerCycle;
    const totalSeconds = cyclesNeeded * cycleTimeS;
    const minutes = Math.floor(totalSeconds / 60);

    if (minutes < 1) return `< 1 min`;
    return `~${minutes} min`;
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
        <span>Shakes: {stepCount()}</span>
        <span>Remaining: {shakesRemaining()}</span>
        <span>ETA: {estimatedTime()}</span>
      </div>
    </div>
  );
}
