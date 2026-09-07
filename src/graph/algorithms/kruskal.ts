import { UnionFind } from '../structures/UnionFind';
import type { MstResult, MstStep, WeightedEdgeInput } from '../models/mst.types';

/**
 * Kruskal's algorithm for the Minimum Spanning Tree / Forest.
 *
 * Strategy: sort all candidate edges by ascending weight, then greedily
 * accept each edge that connects two different components (checked and
 * merged via Union-Find with path compression + union by rank).
 *
 * Complexity: O(E log E) for the sort, plus O(E * a(V)) for the union-find
 * operations (a = inverse Ackermann, effectively constant) -> O(E log E)
 * overall, where E is the number of candidate edges and V the number of
 * nodes.
 *
 * If the input graph is disconnected, this naturally produces a minimum
 * spanning *forest*: one tree per connected component. `isSpanningTree`
 * reports whether a single tree covering every node was achieved.
 */
export const kruskal = (nodeIds: string[], edges: WeightedEdgeInput[]): MstResult => {
  const startTime = performance.now();
  const unionFind = new UnionFind(nodeIds);
  const sortedEdges = [...edges].sort((a, b) => a.weight - b.weight);
  const accepted: WeightedEdgeInput[] = [];
  const steps: MstStep[] = [];
  let totalCost = 0;

  sortedEdges.forEach((edge) => {
    const merged = unionFind.union(edge.fromId, edge.toId);
    steps.push({
      order: steps.length,
      edgeId: edge.id,
      fromId: edge.fromId,
      toId: edge.toId,
      weight: edge.weight,
      accepted: merged,
      reason: merged ? 'Conecta dois componentes distintos' : 'Formaria um ciclo (mesmo componente)',
    });
    if (merged) {
      accepted.push(edge);
      totalCost += edge.weight;
    }
  });

  const executionTimeMs = performance.now() - startTime;
  const componentCount = unionFind.countComponents();

  return {
    algorithm: 'KRUSKAL',
    edges: accepted,
    totalCost,
    nodeCount: nodeIds.length,
    componentCount,
    isSpanningTree: componentCount === 1 && nodeIds.length > 0,
    executionTimeMs,
    steps,
  };
};
