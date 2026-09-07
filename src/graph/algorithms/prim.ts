import { PriorityQueue } from '../structures/PriorityQueue';
import type { MstResult, MstStep, WeightedEdgeInput } from '../models/mst.types';

interface CandidateEdge extends WeightedEdgeInput {
  outsideId: string;
}

/**
 * Prim's algorithm for the Minimum Spanning Tree / Forest.
 *
 * Strategy: grow a single tree from a start node, always adding the
 * cheapest edge that connects a node already in the tree to one that is
 * not, using a priority queue (min-heap) of candidate edges. When the
 * frontier is exhausted but nodes remain unvisited (disconnected graph),
 * a new tree is started from an unvisited node so every component still
 * gets a minimum spanning tree — the same "forest" behaviour as Kruskal
 * for disconnected inputs.
 *
 * Complexity: O(E log E) using a binary heap (each edge can be pushed at
 * most once per endpoint), where E is the number of candidate edges.
 */
export const prim = (nodeIds: string[], edges: WeightedEdgeInput[]): MstResult => {
  const startTime = performance.now();
  const adjacency = new Map<string, WeightedEdgeInput[]>();
  nodeIds.forEach((id) => adjacency.set(id, []));
  edges.forEach((edge) => {
    adjacency.get(edge.fromId)?.push(edge);
    adjacency.get(edge.toId)?.push(edge);
  });

  const visited = new Set<string>();
  const accepted: WeightedEdgeInput[] = [];
  const steps: MstStep[] = [];
  let totalCost = 0;
  let componentCount = 0;

  const growFrom = (startId: string) => {
    componentCount += 1;
    visited.add(startId);
    const queue = new PriorityQueue<CandidateEdge>();

    const pushFrontier = (fromNodeId: string) => {
      (adjacency.get(fromNodeId) ?? []).forEach((edge) => {
        const outsideId = edge.fromId === fromNodeId ? edge.toId : edge.fromId;
        if (!visited.has(outsideId)) {
          queue.push({ ...edge, outsideId }, edge.weight);
        }
      });
    };

    pushFrontier(startId);

    while (!queue.isEmpty()) {
      const candidate = queue.popMin();
      if (!candidate) break;
      if (visited.has(candidate.outsideId)) {
        steps.push({
          order: steps.length,
          edgeId: candidate.id,
          fromId: candidate.fromId,
          toId: candidate.toId,
          weight: candidate.weight,
          accepted: false,
          reason: 'Ambas as pontas já estão na árvore (evita ciclo)',
        });
        continue;
      }

      visited.add(candidate.outsideId);
      accepted.push({ id: candidate.id, fromId: candidate.fromId, toId: candidate.toId, weight: candidate.weight });
      totalCost += candidate.weight;
      steps.push({
        order: steps.length,
        edgeId: candidate.id,
        fromId: candidate.fromId,
        toId: candidate.toId,
        weight: candidate.weight,
        accepted: true,
        reason: 'Menor aresta disponível conectando a árvore a um novo nó',
      });
      pushFrontier(candidate.outsideId);
    }
  };

  nodeIds.forEach((id) => {
    if (!visited.has(id)) growFrom(id);
  });

  const executionTimeMs = performance.now() - startTime;

  return {
    algorithm: 'PRIM',
    edges: accepted,
    totalCost,
    nodeCount: nodeIds.length,
    componentCount,
    isSpanningTree: componentCount === 1 && nodeIds.length > 0,
    executionTimeMs,
    steps,
  };
};
