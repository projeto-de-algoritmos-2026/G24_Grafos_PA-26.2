import { describe, expect, it } from 'vitest';
import { dijkstra } from './dijkstra';
import { conn, env, makeGraph } from '@/test/graphHelpers';

describe('dijkstra', () => {
  it('finds the least-cost path, not merely the fewest hops', () => {
    // Direct A->D is expensive (10); the detour A->B->C->D costs 3.
    const graph = makeGraph(
      [env('A'), env('B'), env('C'), env('D', { type: 'EMERGENCY_EXIT' })],
      [
        { connection: conn('e1', 'A', 'D'), weight: 10 },
        { connection: conn('e2', 'A', 'B'), weight: 1 },
        { connection: conn('e3', 'B', 'C'), weight: 1 },
        { connection: conn('e4', 'C', 'D'), weight: 1 },
      ],
    );
    const result = dijkstra(graph, 'A', ['D']);
    expect(result.found).toBe(true);
    expect(result.path).toEqual(['A', 'B', 'C', 'D']);
    expect(result.cost).toBeCloseTo(3);
  });

  it('returns a zero-cost single-node path when origin is already an exit', () => {
    const graph = makeGraph([env('A', { type: 'EMERGENCY_EXIT' })], []);
    const result = dijkstra(graph, 'A', ['A']);
    expect(result.found).toBe(true);
    expect(result.path).toEqual(['A']);
    expect(result.cost).toBe(0);
  });

  it('chooses the nearest of multiple exits', () => {
    const graph = makeGraph(
      [env('A'), env('X', { type: 'EMERGENCY_EXIT' }), env('Y', { type: 'EMERGENCY_EXIT' })],
      [
        { connection: conn('e1', 'A', 'X'), weight: 8 },
        { connection: conn('e2', 'A', 'Y'), weight: 3 },
      ],
    );
    const result = dijkstra(graph, 'A', ['X', 'Y']);
    expect(result.found).toBe(true);
    expect(result.path[result.path.length - 1]).toBe('Y');
    expect(result.cost).toBeCloseTo(3);
  });

  it('reports not found on a disconnected graph', () => {
    const graph = makeGraph(
      [env('A'), env('B'), env('EXIT', { type: 'EMERGENCY_EXIT' })],
      [{ connection: conn('e1', 'A', 'B'), weight: 1 }],
    );
    const result = dijkstra(graph, 'A', ['EXIT']);
    expect(result.found).toBe(false);
    expect(result.path).toEqual([]);
    expect(result.cost).toBe(Number.POSITIVE_INFINITY);
  });

  it('records execution telemetry (explored nodes, evaluated edges, steps)', () => {
    const graph = makeGraph(
      [env('A'), env('B'), env('C', { type: 'EMERGENCY_EXIT' })],
      [
        { connection: conn('e1', 'A', 'B'), weight: 1 },
        { connection: conn('e2', 'B', 'C'), weight: 1 },
      ],
    );
    const result = dijkstra(graph, 'A', ['C']);
    expect(result.exploredNodeCount).toBeGreaterThan(0);
    expect(result.evaluatedEdgeCount).toBeGreaterThan(0);
    expect(result.steps.length).toBe(result.exploredNodeCount);
    expect(result.steps[0].currentId).toBe('A');
  });
});
