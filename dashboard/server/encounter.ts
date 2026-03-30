// Encounter probability thresholds for Digivice D3 V3
// Steps  | Individual | Cumulative
// 400    | 40%        | 40%
// 450    | 20%        | 60%
// 500    | 30%        | 90%
// 550    | 10%        | 100%

const THRESHOLDS = [
  { steps: 400, probability: 0.4 },
  { steps: 450, probability: 0.2 },
  { steps: 500, probability: 0.3 },
  { steps: 550, probability: 0.1 },
];

export function getCumulativeProbability(shakeCount: number): number {
  let cumulative = 0;
  for (const t of THRESHOLDS) {
    if (shakeCount >= t.steps) {
      cumulative += t.probability;
    }
  }
  return Math.min(cumulative, 1);
}

export function getEstimatedShakesRemaining(shakeCount: number): number | null {
  if (shakeCount >= 550) return 0;
  if (shakeCount < 400) return 400 - shakeCount;

  // Weighted expected remaining based on conditional probabilities
  let remainingExpected = 0;
  let remainingProbMass = 0;

  for (const t of THRESHOLDS) {
    if (shakeCount < t.steps) {
      remainingExpected += (t.steps - shakeCount) * t.probability;
      remainingProbMass += t.probability;
    }
  }

  if (remainingProbMass === 0) return 0;
  return Math.round(remainingExpected / remainingProbMass);
}

export function getEncounterInfo(shakeCount: number) {
  return {
    probability: getCumulativeProbability(shakeCount),
    estimatedShakesRemaining: getEstimatedShakesRemaining(shakeCount),
  };
}
