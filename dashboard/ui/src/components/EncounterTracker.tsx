import { status } from "../lib/ws";

export default function EncounterTracker() {
  const s = () => status();
  const encounter = () => s()?.encounter;
  const shakeCount = () => s()?.shakeCount ?? 0;

  const probability = () => encounter()?.probability ?? 0;
  const percentLabel = () => `${Math.round(probability() * 100)}%`;

  const shakesRemaining = () => {
    const remaining = encounter()?.estimatedShakesRemaining;
    if (remaining === null || remaining === undefined) return "–";
    if (remaining === 0 && shakeCount() >= 550) return "Overdue";
    return `~${remaining}`;
  };

  const barWidth = () => {
    if (shakeCount() >= 550) return 100;
    if (shakeCount() < 400) return (shakeCount() / 550) * 100;
    return (shakeCount() / 550) * 100;
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
    // Each shake cycle = shakeDuration + restDuration seconds, and counts as 1 shake
    const secondsPerShake = p.shakeDuration + p.restDuration;
    const totalSeconds = remaining * secondsPerShake;
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
        <span>Shakes: {shakeCount()}</span>
        <span>Remaining: {shakesRemaining()}</span>
        <span>ETA: {estimatedTime()}</span>
      </div>
    </div>
  );
}
