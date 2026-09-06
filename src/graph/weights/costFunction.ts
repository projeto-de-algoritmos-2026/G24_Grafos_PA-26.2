import type { SimulationIntensity } from '@/types';

export type OptimizationCriteria = 'SHORTEST' | 'FASTEST' | 'SAFEST' | 'BALANCED';

export interface CriteriaWeights {
  distance: number;
  time: number;
  risk: number;
}

/**
 * Base weights for each evacuation objective the user can choose on the
 * simulation screen. Each triplet sums to 1 so the resulting cost stays on
 * a comparable, dimensionless [0, 1]-ish scale once combined with the
 * normalized attributes (see `normalize`).
 */
export const CRITERIA_WEIGHTS: Record<OptimizationCriteria, CriteriaWeights> = {
  SHORTEST: { distance: 0.8, time: 0.1, risk: 0.1 },
  FASTEST: { distance: 0.1, time: 0.8, risk: 0.1 },
  SAFEST: { distance: 0.1, time: 0.1, risk: 0.8 },
  BALANCED: { distance: 0.34, time: 0.33, risk: 0.33 },
};

/**
 * How much extra importance risk should gain as the emergency intensity
 * increases (section 10 of the spec). These are expressed as the same kind
 * of [distance, time, risk] triplet as CRITERIA_WEIGHTS.
 */
export const INTENSITY_WEIGHTS: Record<SimulationIntensity, CriteriaWeights> = {
  LOW: { distance: 0.4, time: 0.4, risk: 0.2 },
  MEDIUM: { distance: 0.3, time: 0.35, risk: 0.35 },
  HIGH: { distance: 0.2, time: 0.3, risk: 0.5 },
  CRITICAL: { distance: 0.1, time: 0.2, risk: 0.7 },
};

const normalizeWeights = (weights: CriteriaWeights): CriteriaWeights => {
  const sum = weights.distance + weights.time + weights.risk;
  if (sum <= 0) return { distance: 1 / 3, time: 1 / 3, risk: 1 / 3 };
  return { distance: weights.distance / sum, time: weights.time / sum, risk: weights.risk / sum };
};

/**
 * Blends the user-selected optimization criteria with the intensity-driven
 * profile from section 10.
 *
 * Design decision (documented per section 9/10 of the spec): when the user
 * has an explicit, "extreme" preference (SHORTEST/FASTEST/SAFEST) we honor
 * it strongly and let the emergency intensity only nudge the risk weight
 * up a little (influence = 0.25). When the user asks for the BALANCED
 * objective, intensity fully drives the balance (influence = 1), which is
 * exactly the table described in section 10. This keeps both requirements
 * (configurable objective + intensity-aware balancing) coherent instead of
 * one silently overriding the other.
 */
export const resolveCriteriaWeights = (
  criteria: OptimizationCriteria,
  intensity: SimulationIntensity,
): CriteriaWeights => {
  const base = CRITERIA_WEIGHTS[criteria];
  const intensityProfile = INTENSITY_WEIGHTS[intensity];
  const influence = criteria === 'BALANCED' ? 1 : 0.25;

  return normalizeWeights({
    distance: base.distance * (1 - influence) + intensityProfile.distance * influence,
    time: base.time * (1 - influence) + intensityProfile.time * influence,
    risk: base.risk * (1 - influence) + intensityProfile.risk * influence,
  });
};

export interface NormalizationStats {
  maxDistance: number;
  maxTime: number;
}

/** Normalizes a raw attribute (e.g. meters, seconds) against the largest value observed in the whole floor. */
export const normalize = (value: number, max: number): number => (max > 0 ? value / max : 0);

export interface EdgeCostInput {
  distanceMeters: number;
  traversalTimeSeconds: number;
  /** Combined risk in [0, 1]: max of the connection's static risk and the dynamic risk propagated from the danger origin. */
  combinedRisk: number;
}

/**
 * Computes the final edge weight used by every pathfinding algorithm.
 *
 * cost = w_distance * normalize(distance) + w_time * normalize(time) + w_risk * combinedRisk
 *
 * All three terms live in [0, 1] before weighting, so the composed cost is
 * a coherent, unit-free score regardless of which criteria/intensity
 * combination produced the weights — this is what lets Dijkstra and A* be
 * compared fairly and lets A*'s heuristic (see astar.ts) stay admissible.
 */
export const computeEdgeCost = (input: EdgeCostInput, weights: CriteriaWeights, stats: NormalizationStats): number => {
  const normalizedDistance = normalize(input.distanceMeters, stats.maxDistance);
  const normalizedTime = normalize(input.traversalTimeSeconds, stats.maxTime);
  return weights.distance * normalizedDistance + weights.time * normalizedTime + weights.risk * input.combinedRisk;
};

/**
 * Coefficient (cost units per meter) used to build an admissible heuristic
 * for A*: `weights.distance / maxDistance` is exactly the multiplier applied
 * to raw distance inside computeEdgeCost. Multiplying the straight-line
 * (Euclidean) distance to the goal by this coefficient gives a lower bound
 * on the distance component of the true remaining cost, while completely
 * ignoring the (non-negative) time and risk components — which is what
 * keeps the heuristic admissible even though the real cost also depends on
 * time and risk.
 */
export const distanceCostPerMeter = (weights: CriteriaWeights, stats: NormalizationStats): number =>
  stats.maxDistance > 0 ? weights.distance / stats.maxDistance : 0;
