import type { Graph } from '../Graph';
import { PriorityQueue } from '../structures/PriorityQueue';
import type { AlgorithmStep, PathfindingResult } from '../models/pathfinding.types';

interface QueueItem {
  id: string;
  cost: number;
}

/**
 * Dijkstra's shortest path algorithm using a binary-heap priority queue.
 *
 * Complexity: O((V + E) log V) with a binary heap, where V is the number of
 * environments and E the number of connections in the (already filtered)
 * graph - a direct improvement over the previous `array.sort()+shift()`
 * implementation, which cost O(E log E) per iteration in the worst case
 * (up to O(E^2 log E) overall).
 *
 * Stops as soon as any of the requested exits is popped from the queue,
 * which is safe because Dijkstra finalizes nodes in non-decreasing order of
 * distance.
 */
export const dijkstra = (graph: Graph, originId: string, exitIds: string[]): PathfindingResult => {
  const startTime = performance.now();
  const exits = new Set(exitIds);
  const distances = new Map<string, number>();
  const previous = new Map<string, string>();
  const visited = new Set<string>();
  const visitedOrder: string[] = [];
  const steps: AlgorithmStep[] = [];
  let evaluatedEdgeCount = 0;

  graph.getEnvironmentIds().forEach((id) => distances.set(id, Number.POSITIVE_INFINITY));
  distances.set(originId, 0);

  const queue = new PriorityQueue<QueueItem>();
  queue.push({ id: originId, cost: 0 }, 0);

  const frontierIds = new Set<string>([originId]);
  let foundExitId: string | null = null;

  while (!queue.isEmpty()) {
    const current = queue.popMin();
    if (!current || visited.has(current.id)) continue;

    visited.add(current.id);
    visitedOrder.push(current.id);
    frontierIds.delete(current.id);

    steps.push({
      order: steps.length,
      currentId: current.id,
      frontierIds: [...frontierIds],
      visitedIds: [...visited],
      costSoFar: current.cost,
      estimatedTotalCost: current.cost,
    });

    if (exits.has(current.id)) {
      foundExitId = current.id;
      break;
    }

    graph.neighbors(current.id).forEach((neighbor) => {
      evaluatedEdgeCount += 1;
      if (visited.has(neighbor.environmentId)) return;
      const nextCost = current.cost + neighbor.weight;
      if (nextCost < (distances.get(neighbor.environmentId) ?? Number.POSITIVE_INFINITY)) {
        distances.set(neighbor.environmentId, nextCost);
        previous.set(neighbor.environmentId, current.id);
        queue.push({ id: neighbor.environmentId, cost: nextCost }, nextCost);
        frontierIds.add(neighbor.environmentId);
      }
    });
  }

  const executionTimeMs = performance.now() - startTime;

  if (!foundExitId) {
    return {
      algorithm: 'DIJKSTRA',
      originId,
      found: false,
      path: [],
      cost: Number.POSITIVE_INFINITY,
      visitedOrder,
      exploredNodeCount: visitedOrder.length,
      evaluatedEdgeCount,
      executionTimeMs,
      steps,
    };
  }

  const path: string[] = [foundExitId];
  let cursor = foundExitId;
  while (previous.has(cursor)) {
    const parent = previous.get(cursor);
    if (!parent) break;
    path.unshift(parent);
    cursor = parent;
  }

  return {
    algorithm: 'DIJKSTRA',
    originId,
    found: true,
    path,
    cost: distances.get(foundExitId) ?? 0,
    visitedOrder,
    exploredNodeCount: visitedOrder.length,
    evaluatedEdgeCount,
    executionTimeMs,
    steps,
  };
};
