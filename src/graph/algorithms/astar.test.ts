import { describe, expect, it } from 'vitest';
import { astar } from './astar';
import { dijkstra } from './dijkstra';
import { conn, env, makeGraph } from '@/test/graphHelpers';

// Nodes laid out on a straight line so edge weights equal the Euclidean
// distance between positions; with distanceCostPerMeter = 1 the heuristic is
// exactly admissible.
const lineGraph = () =>
  makeGraph(
    [
      env('A', { position: { x: 0, y: 0 } }),
      env('B', { position: { x: 10, y: 0 } }),
      env('C', { position: { x: 20, y: 0 } }),
      env('D', { type: 'EMERGENCY_EXIT', position: { x: 30, y: 0 } }),
    ],
    [
      { connection: conn('e1', 'A', 'B'), weight: 10 },
      { connection: conn('e2', 'B', 'C'), weight: 10 },
      { connection: conn('e3', 'C', 'D'), weight: 10 },
      { connection: conn('e4', 'A', 'D'), weight: 40 }, // longer direct shortcut
    ],
  );

describe('astar', () => {
  it('finds the least-cost path', () => {
    const result = astar(lineGraph(), 'A', ['D'], 1);
    expect(result.found).toBe(true);
    expect(result.path).toEqual(['A', 'B', 'C', 'D']);
    expect(result.cost).toBeCloseTo(30);
  });

  it('returns the same optimal cost as Dijkstra when the heuristic is admissible', () => {
    const astarResult = astar(lineGraph(), 'A', ['D'], 1);
    const dijkstraResult = dijkstra(lineGraph(), 'A', ['D']);
    expect(astarResult.found && dijkstraResult.found).toBe(true);
    expect(astarResult.cost).toBeCloseTo(dijkstraResult.cost);
    expect(astarResult.path).toEqual(dijkstraResult.path);
  });

  it('degenerates to Dijkstra-equivalent behaviour when the heuristic is zero', () => {
    // distanceCostPerMeter = 0 makes h(n) = 0 for every node.
    const astarResult = astar(lineGraph(), 'A', ['D'], 0);
    const dijkstraResult = dijkstra(lineGraph(), 'A', ['D']);
    expect(astarResult.cost).toBeCloseTo(dijkstraResult.cost);
    expect(astarResult.visitedOrder).toEqual(dijkstraResult.visitedOrder);
  });

  it('chooses the nearest of multiple exits', () => {
    const graph = makeGraph(
      [
        env('A', { position: { x: 0, y: 0 } }),
        env('X', { type: 'EMERGENCY_EXIT', position: { x: 80, y: 0 } }),
        env('Y', { type: 'EMERGENCY_EXIT', position: { x: 30, y: 0 } }),
      ],
      [
        { connection: conn('e1', 'A', 'X'), weight: 80 },
        { connection: conn('e2', 'A', 'Y'), weight: 30 },
      ],
    );
    const result = astar(graph, 'A', ['X', 'Y'], 1);
    expect(result.path[result.path.length - 1]).toBe('Y');
    expect(result.cost).toBeCloseTo(30);
  });

  it('reports not found on a disconnected graph', () => {
    const graph = makeGraph(
      [env('A', { position: { x: 0, y: 0 } }), env('EXIT', { type: 'EMERGENCY_EXIT', position: { x: 5, y: 0 } })],
      [],
    );
    const result = astar(graph, 'A', ['EXIT'], 1);
    expect(result.found).toBe(false);
    expect(result.cost).toBe(Number.POSITIVE_INFINITY);
  });
});
