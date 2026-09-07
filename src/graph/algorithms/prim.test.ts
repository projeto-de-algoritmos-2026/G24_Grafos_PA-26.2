import { describe, expect, it } from 'vitest';
import { prim } from './prim';
import { kruskal } from './kruskal';
import type { WeightedEdgeInput } from '../models/mst.types';

const edge = (id: string, fromId: string, toId: string, weight: number): WeightedEdgeInput => ({ id, fromId, toId, weight });

const connectedEdges = () => [
  edge('ab', 'A', 'B', 1),
  edge('bc', 'B', 'C', 2),
  edge('cd', 'C', 'D', 3),
  edge('ad', 'A', 'D', 10),
  edge('ac', 'A', 'C', 9),
];

describe('prim', () => {
  it('builds a minimum spanning tree with the minimum total cost', () => {
    const result = prim(['A', 'B', 'C', 'D'], connectedEdges());
    expect(result.isSpanningTree).toBe(true);
    expect(result.componentCount).toBe(1);
    expect(result.edges).toHaveLength(3);
    expect(result.totalCost).toBe(6);
  });

  it('produces a spanning forest for a disconnected graph', () => {
    const result = prim(['A', 'B', 'C', 'D'], [edge('ab', 'A', 'B', 1), edge('cd', 'C', 'D', 4)]);
    expect(result.isSpanningTree).toBe(false);
    expect(result.componentCount).toBe(2);
    expect(result.totalCost).toBe(5);
  });

  it('reaches the same total cost as Kruskal on a connected graph', () => {
    const nodes = ['A', 'B', 'C', 'D'];
    const primResult = prim(nodes, connectedEdges());
    const kruskalResult = kruskal(nodes, connectedEdges());
    expect(primResult.totalCost).toBe(kruskalResult.totalCost);
    expect(primResult.isSpanningTree).toBe(kruskalResult.isSpanningTree);
  });
});
