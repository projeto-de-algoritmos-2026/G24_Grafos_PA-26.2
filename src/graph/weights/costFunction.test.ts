import { describe, expect, it } from 'vitest';
import {
  computeEdgeCost,
  distanceCostPerMeter,
  normalize,
  resolveCriteriaWeights,
  type CriteriaWeights,
} from './costFunction';

const sum = (weights: CriteriaWeights) => weights.distance + weights.time + weights.risk;

describe('normalize', () => {
  it('scales a value against the observed maximum', () => {
    expect(normalize(5, 10)).toBeCloseTo(0.5);
    expect(normalize(10, 10)).toBeCloseTo(1);
  });

  it('returns 0 when the maximum is 0 (no division by zero)', () => {
    expect(normalize(5, 0)).toBe(0);
  });
});

describe('resolveCriteriaWeights', () => {
  it('always produces normalized weights that sum to 1', () => {
    (['SHORTEST', 'FASTEST', 'SAFEST', 'BALANCED'] as const).forEach((criteria) => {
      (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).forEach((intensity) => {
        expect(sum(resolveCriteriaWeights(criteria, intensity))).toBeCloseTo(1);
      });
    });
  });

  it('emphasises distance for SHORTEST and risk for SAFEST', () => {
    const shortest = resolveCriteriaWeights('SHORTEST', 'MEDIUM');
    const safest = resolveCriteriaWeights('SAFEST', 'MEDIUM');
    expect(shortest.distance).toBeGreaterThan(safest.distance);
    expect(safest.risk).toBeGreaterThan(shortest.risk);
  });

  it('emphasises time for FASTEST', () => {
    const fastest = resolveCriteriaWeights('FASTEST', 'MEDIUM');
    expect(fastest.time).toBeGreaterThan(fastest.distance);
    expect(fastest.time).toBeGreaterThan(fastest.risk);
  });

  it('increases the influence of risk as the emergency intensity rises', () => {
    const low = resolveCriteriaWeights('BALANCED', 'LOW');
    const critical = resolveCriteriaWeights('BALANCED', 'CRITICAL');
    expect(critical.risk).toBeGreaterThan(low.risk);
  });
});

describe('computeEdgeCost', () => {
  const stats = { maxDistance: 20, maxTime: 40 };

  it('combines the normalized attributes with the given weights', () => {
    const weights: CriteriaWeights = { distance: 0.5, time: 0.3, risk: 0.2 };
    // distance 10/20 = 0.5, time 20/40 = 0.5, risk 0.5
    const cost = computeEdgeCost({ distanceMeters: 10, traversalTimeSeconds: 20, combinedRisk: 0.5 }, weights, stats);
    expect(cost).toBeCloseTo(0.5 * 0.5 + 0.3 * 0.5 + 0.2 * 0.5);
  });

  it('grows when risk grows, all else equal', () => {
    const weights: CriteriaWeights = { distance: 0.34, time: 0.33, risk: 0.33 };
    const low = computeEdgeCost({ distanceMeters: 10, traversalTimeSeconds: 20, combinedRisk: 0.1 }, weights, stats);
    const high = computeEdgeCost({ distanceMeters: 10, traversalTimeSeconds: 20, combinedRisk: 0.9 }, weights, stats);
    expect(high).toBeGreaterThan(low);
  });
});

describe('distanceCostPerMeter', () => {
  it('is exactly the distance weight divided by the max distance', () => {
    const weights: CriteriaWeights = { distance: 0.6, time: 0.2, risk: 0.2 };
    expect(distanceCostPerMeter(weights, { maxDistance: 30, maxTime: 40 })).toBeCloseTo(0.6 / 30);
  });

  it('is 0 when there is no distance scale', () => {
    const weights: CriteriaWeights = { distance: 0.6, time: 0.2, risk: 0.2 };
    expect(distanceCostPerMeter(weights, { maxDistance: 0, maxTime: 0 })).toBe(0);
  });
});
