import type { Route } from '@/types';

export interface ContingencyComparison {
  primaryCost: number;
  alternativeCost: number;
  primaryDistanceMeters: number;
  alternativeDistanceMeters: number;
  primaryTimeSeconds: number;
  alternativeTimeSeconds: number;
  overlapPercentage: number;
  /** Extra cost of the detour relative to the primary route, as a percentage. */
  costIncreasePercentage: number;
  /** Extra walking distance of the detour, in meters. */
  distanceDifferenceMeters: number;
}

/**
 * Pairs a primary route with its contingency alternative (they share the
 * same origin) and derives the presentation deltas required by section 9.
 * All numbers come from the two real routes — nothing is fabricated here.
 */
export const compareContingency = (primary: Route, alternative: Route): ContingencyComparison => ({
  primaryCost: primary.cost,
  alternativeCost: alternative.cost,
  primaryDistanceMeters: primary.distanceMeters,
  alternativeDistanceMeters: alternative.distanceMeters,
  primaryTimeSeconds: primary.timeSeconds,
  alternativeTimeSeconds: alternative.timeSeconds,
  overlapPercentage: alternative.overlapWithPrimaryPercentage ?? 0,
  costIncreasePercentage: primary.cost > 0 ? Math.round(((alternative.cost - primary.cost) / primary.cost) * 100) : 0,
  distanceDifferenceMeters: alternative.distanceMeters - primary.distanceMeters,
});
