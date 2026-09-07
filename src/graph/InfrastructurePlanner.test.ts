import { describe, expect, it } from 'vitest';
import { InfrastructurePlanner } from './InfrastructurePlanner';
import { demoBuilding } from '@/utils/demoScenarios';

const mstFloor = () => {
  const found = demoBuilding.floors.find((floor) => floor.id === 'demo_floor_f_mst');
  if (!found) throw new Error('demo MST floor not found');
  return found;
};

describe('InfrastructurePlanner', () => {
  it('derives one candidate edge per physical connection', () => {
    const floor = mstFloor();
    const candidates = InfrastructurePlanner.generateCandidateEdges(floor.connections);
    expect(candidates).toHaveLength(floor.connections.length);
    expect(candidates.every((edge) => edge.installationCost > 0)).toBe(true);
  });

  it('plans a fully-connected minimum spanning tree that prunes redundant links', () => {
    const floor = mstFloor();
    const candidates = InfrastructurePlanner.generateCandidateEdges(floor.connections);
    const plan = InfrastructurePlanner.plan(floor.environments, candidates, 'KRUSKAL');
    expect(plan.isFullyConnected).toBe(true);
    expect(plan.componentCount).toBe(1);
    // A spanning tree over N nodes keeps exactly N-1 edges.
    expect(plan.selectedEdgeCount).toBe(floor.environments.length - 1);
    expect(plan.selectedEdgeCount).toBeLessThan(plan.candidateEdgeCount);
    expect(plan.savings).toBe(plan.candidateNetworkCost - plan.minimumCost);
    expect(plan.savings).toBeGreaterThan(0);
    expect(plan.steps.length).toBe(candidates.length);
  });

  it('reaches the same minimum cost with Kruskal and Prim (compare mode)', () => {
    const floor = mstFloor();
    const candidates = InfrastructurePlanner.generateCandidateEdges(floor.connections);
    const comparison = InfrastructurePlanner.compare(floor.environments, candidates);
    expect(comparison.kruskal.minimumCost).toBe(comparison.prim.minimumCost);
    expect(comparison.sameCost).toBe(true);
    expect(comparison.kruskal.selectedEdgeCount).toBe(comparison.prim.selectedEdgeCount);
  });

  it('reports a disconnected candidate network as a spanning forest', () => {
    const environments = mstFloor().environments;
    // Only wire two of the six nodes together.
    const candidates = InfrastructurePlanner.generateCandidateEdges([
      { id: 'iso', fromEnvironmentId: environments[0].id, toEnvironmentId: environments[1].id, distanceMeters: 10, traversalTimeSeconds: 12, riskLevel: 0, isAccessible: true, type: 'CORRIDOR' },
    ]);
    const plan = InfrastructurePlanner.plan(environments, candidates, 'PRIM');
    expect(plan.isFullyConnected).toBe(false);
    expect(plan.componentCount).toBeGreaterThan(1);
  });
});
