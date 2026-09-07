import { describe, expect, it } from 'vitest';
import { combineEdgeRisk, propagateRisk } from './riskPropagation';
import { conn, env } from '@/test/graphHelpers';

// Linear chain O - A - B - C - D so hop distance from O is easy to reason about.
const chain = () => ({
  environments: [env('O'), env('A'), env('B'), env('C'), env('D')],
  connections: [
    conn('e1', 'O', 'A'),
    conn('e2', 'A', 'B'),
    conn('e3', 'B', 'C'),
    conn('e4', 'C', 'D'),
  ],
});

describe('propagateRisk', () => {
  it('marks the danger origin as CRITICAL with the maximum score', () => {
    const { environments, connections } = chain();
    const risk = propagateRisk(environments, connections, 'O');
    expect(risk.zone.get('O')).toBe('CRITICAL');
    expect(risk.score.get('O')).toBe(1);
  });

  it('decreases the risk score monotonically with hop distance', () => {
    const { environments, connections } = chain();
    const risk = propagateRisk(environments, connections, 'O');
    const scoreO = risk.score.get('O') ?? 0;
    const scoreA = risk.score.get('A') ?? 0;
    const scoreB = risk.score.get('B') ?? 0;
    expect(scoreO).toBeGreaterThan(scoreA);
    expect(scoreA).toBeGreaterThanOrEqual(scoreB);
  });

  it('leaves a node disconnected from the origin with no risk', () => {
    const environments = [env('O'), env('A'), env('ISOLATED')];
    const connections = [conn('e1', 'O', 'A')];
    const risk = propagateRisk(environments, connections, 'O');
    expect(risk.score.get('ISOLATED')).toBe(0);
    expect(risk.zone.get('ISOLATED')).toBe('NONE');
  });

  it('assigns zero risk everywhere when there is no danger origin', () => {
    const { environments, connections } = chain();
    const risk = propagateRisk(environments, connections, null);
    environments.forEach((environment) => {
      expect(risk.score.get(environment.id)).toBe(0);
      expect(risk.zone.get(environment.id)).toBe('NONE');
    });
  });
});

describe('combineEdgeRisk', () => {
  it('takes the maximum of static and propagated risk', () => {
    const { environments, connections } = chain();
    const risk = propagateRisk(environments, connections, 'O');
    // Static risk 10/10 = 1 dominates the propagated risk.
    expect(combineEdgeRisk(10, risk, 'C', 'D')).toBeCloseTo(1);
    // With no static risk, the propagated (dynamic) risk near the origin wins.
    const dynamic = combineEdgeRisk(0, risk, 'O', 'A');
    expect(dynamic).toBeGreaterThan(0);
  });
});
