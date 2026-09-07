import { describe, expect, it } from 'vitest';
import { SimulationEngine } from './SimulationEngine';
import { demoBuilding } from '@/utils/demoScenarios';
import type { AlgorithmChoice, Floor, OptimizationCriteria, Route, SimulationIntensity, SimulationParams } from '@/types';

const floor = (id: string): Floor => {
  const found = demoBuilding.floors.find((item) => item.id === id);
  if (!found) throw new Error(`demo floor not found: ${id}`);
  return found;
};

interface Overrides {
  origin: string;
  criteria?: OptimizationCriteria;
  algorithm?: AlgorithmChoice;
  intensity?: SimulationIntensity;
  blockedConnectionIds?: string[];
}

// Mirrors useSimulation: the danger origin is also added to the blocked set.
const paramsFor = (f: Floor, o: Overrides): SimulationParams => ({
  environments: f.environments,
  connections: f.connections,
  originEnvironmentId: o.origin,
  blockedEnvironmentIds: [o.origin],
  blockedConnectionIds: o.blockedConnectionIds ?? [],
  intensity: o.intensity ?? 'MEDIUM',
  algorithm: o.algorithm ?? 'DIJKSTRA',
  criteria: o.criteria ?? 'BALANCED',
});

const routeFor = (routes: Route[], originId: string) => routes.find((route) => route.originEnvironmentId === originId);

describe('SimulationEngine — scenario A (Dijkstra shortest path)', () => {
  it('routes the occupied room out through the fast upper corridor', () => {
    const engine = new SimulationEngine();
    // Danger placed in the storage room so the crowded origin still evacuates.
    const result = engine.run(paramsFor(floor('demo_floor_a_dijkstra'), { origin: 'a_deposito', criteria: 'SHORTEST' }));
    const route = routeFor(result.primaryRoutes, 'a_origem');
    expect(route).toBeDefined();
    expect(route?.path).toEqual(['a_origem', 'a_hall', 'a_corredor', 'a_saida']);
  });
});

describe('SimulationEngine — scenario B (A* vs Dijkstra)', () => {
  it('BOTH runs Dijkstra and A*, reaching the same optimal cost with A* exploring no more nodes', () => {
    const engine = new SimulationEngine();
    const result = engine.run(paramsFor(floor('demo_floor_b_astar'), { origin: 'b_r0c0', algorithm: 'BOTH', criteria: 'SHORTEST' }));
    expect(result.analysis).not.toBeNull();
    const runs = result.analysis?.runs ?? [];
    const dij = runs.find((run) => run.algorithm === 'DIJKSTRA');
    const ast = runs.find((run) => run.algorithm === 'ASTAR');
    expect(dij?.found && ast?.found).toBe(true);
    expect(result.analysis?.sameOptimalCost).toBe(true);
    expect(ast!.cost).toBeCloseTo(dij!.cost);
    // A* is guided toward the exit and must not explore more nodes than Dijkstra.
    expect(ast!.exploredNodeCount).toBeLessThanOrEqual(dij!.exploredNodeCount);
  });
});

describe('SimulationEngine — scenario C (risk changes the route)', () => {
  it('takes the short corridor when optimizing for distance', () => {
    const engine = new SimulationEngine();
    const result = engine.run(paramsFor(floor('demo_floor_c_risk'), { origin: 'c_foco', criteria: 'SHORTEST' }));
    const route = routeFor(result.primaryRoutes, 'c_origem');
    expect(route?.path).toContain('c_corredor_curto');
    expect(route?.path).not.toContain('c_detour1');
  });

  it('avoids the fire and takes the longer detour when optimizing for safety', () => {
    const engine = new SimulationEngine();
    const result = engine.run(paramsFor(floor('demo_floor_c_risk'), { origin: 'c_foco', criteria: 'SAFEST' }));
    const route = routeFor(result.primaryRoutes, 'c_origem');
    expect(route?.path).toContain('c_detour1');
    expect(route?.path).not.toContain('c_corredor_curto');
  });

  it('produces classified risk zones with the danger origin marked CRITICAL', () => {
    const engine = new SimulationEngine();
    const result = engine.run(paramsFor(floor('demo_floor_c_risk'), { origin: 'c_foco', criteria: 'SAFEST' }));
    const focoZone = result.riskZones.find((zone) => zone.environmentId === 'c_foco');
    expect(focoZone?.zone).toBe('CRITICAL');
  });
});

describe('SimulationEngine — scenario D (blocking reroutes)', () => {
  it('recomputes a different path when a connection on the primary route is blocked', () => {
    const engine = new SimulationEngine();
    const base = engine.run(paramsFor(floor('demo_floor_a_dijkstra'), { origin: 'a_deposito', criteria: 'SHORTEST' }));
    const basePath = routeFor(base.primaryRoutes, 'a_origem')?.path ?? [];
    expect(basePath).toContain('a_hall');

    // Block the origin's fast door (a_origem → a_hall); the route must change.
    const blocked = engine.run(
      paramsFor(floor('demo_floor_a_dijkstra'), { origin: 'a_deposito', criteria: 'SHORTEST', blockedConnectionIds: ['a_c1'] }),
    );
    const blockedPath = routeFor(blocked.primaryRoutes, 'a_origem')?.path ?? [];
    expect(blockedPath).not.toContain('a_hall');
    expect(blockedPath.join('>')).not.toBe(basePath.join('>'));
  });
});

describe('SimulationEngine — scenario E (accessibility)', () => {
  it('routes PCD occupants through the accessible ramp while the standard route uses the stairs', () => {
    const engine = new SimulationEngine();
    const result = engine.run(paramsFor(floor('demo_floor_e_accessibility'), { origin: 'e_foco', criteria: 'SHORTEST', intensity: 'LOW' }));
    const route = routeFor(result.primaryRoutes, 'e_origem');
    expect(route?.usedAccessibleProfile).toBe(true);
    // Accessible route avoids the (non-accessible) staircase.
    expect(route?.path).not.toContain('e_escada');
    expect(route?.path).toContain('e_rampa1');
    // The comparison exposes the shorter standard route that goes via the stairs.
    expect(route?.accessibilityComparison?.accessibleRouteExists).toBe(true);
    expect(route?.accessibilityComparison?.standardPath).toContain('e_escada');
    expect(route?.accessibilityComparison?.isDifferentFromAccessible).toBe(true);
  });
});

describe('SimulationEngine — contingency route', () => {
  it('offers an alternative route that differs from the primary', () => {
    const engine = new SimulationEngine();
    const result = engine.run(paramsFor(floor('demo_floor_c_risk'), { origin: 'c_foco', criteria: 'SHORTEST' }));
    const primary = routeFor(result.primaryRoutes, 'c_origem');
    const alternative = routeFor(result.alternativeRoutes, 'c_origem');
    expect(primary).toBeDefined();
    expect(alternative).toBeDefined();
    expect(alternative?.path.join('>')).not.toBe(primary?.path.join('>'));
    expect(alternative?.overlapWithPrimaryPercentage).toBeGreaterThanOrEqual(0);
  });
});
