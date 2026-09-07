import { describe, expect, it } from 'vitest';
import { kruskal } from './kruskal';
import type { WeightedEdgeInput } from '../models/mst.types';

const edge = (id: string, fromId: string, toId: string, weight: number): WeightedEdgeInput => ({ id, fromId, toId, weight });

describe('kruskal', () => {
  it('builds a minimum spanning tree with V-1 edges', () => {
    const nodes = ['A', 'B', 'C', 'D'];
    const edges = [
      edge('ab', 'A', 'B', 1),
      edge('bc', 'B', 'C', 2),
      edge('cd', 'C', 'D', 3),
      edge('ad', 'A', 'D', 10), // redundant expensive edge, must be rejected
      edge('ac', 'A', 'C', 9), // redundant expensive edge, must be rejected
    ];
    const result = kruskal(nodes, edges);
    expect(result.isSpanningTree).toBe(true);
    expect(result.componentCount).toBe(1);
    expect(result.edges).toHaveLength(3);
    expect(result.totalCost).toBe(6);
    expect(result.edges.map((e) => e.id).sort()).toEqual(['ab', 'bc', 'cd']);
  });

  it('rejects edges that would form a cycle and records the reason', () => {
    const result = kruskal(['A', 'B', 'C'], [edge('ab', 'A', 'B', 1), edge('bc', 'B', 'C', 1), edge('ca', 'C', 'A', 1)]);
    expect(result.edges).toHaveLength(2);
    const rejected = result.steps.filter((step) => !step.accepted);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason.toLowerCase()).toContain('ciclo');
  });

  it('produces a spanning forest (not a single tree) for a disconnected graph', () => {
    const result = kruskal(['A', 'B', 'C', 'D'], [edge('ab', 'A', 'B', 1), edge('cd', 'C', 'D', 1)]);
    expect(result.isSpanningTree).toBe(false);
    expect(result.componentCount).toBe(2);
    expect(result.totalCost).toBe(2);
  });
});
