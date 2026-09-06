import type { Graph } from '../Graph';
import { PriorityQueue } from '../structures/PriorityQueue';
import type { AlgorithmStep, PathfindingResult } from '../models/pathfinding.types';

interface QueueItem {
  id: string;
  gScore: number;
  fScore: number;
}

const euclideanDistance = (a: { x: number; y: number }, b: { x: number; y: number }): number =>
  Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

/**
 * A* search guided by a straight-line-distance heuristic.
 *
 * h(n) = min_over_exit( euclidean(position(n), position(exit)) ) * heuristicCostPerUnit
 *
 * `heuristicCostPerUnit` folds together the cost-per-meter the cost function
 * applies to raw distance AND a conservative pixels→meters scale (node
 * positions are in canvas pixels, edge distances in meters — see
 * GraphBuilder), so h(n) estimates *only* the distance component of the
 * remaining cost and always ignores the (non-negative) time and risk
 * components. Because the scale is chosen conservatively, the straight-line
 * estimate to the goal never exceeds any real path through the building's
 * corridors (triangle inequality), so h(n) never overestimates the true
 * remaining cost g*(n) - the heuristic is therefore admissible (and
 * consistent), and A* is guaranteed to return an optimal path exactly like
 * Dijkstra, while typically exploring fewer nodes because it is guided
 * toward the exits.
 *
 * Complexity: O((V + E) log V), same asymptotic bound as Dijkstra; the
 * heuristic only changes *which* nodes get explored first, not the
 * worst-case bound.
 */
export const astar = (
  graph: Graph,
  originId: string,
  exitIds: string[],
  heuristicCostPerUnit: number,
): PathfindingResult => {
  const startTime = performance.now();
  const exits = new Set(exitIds);
  const exitPositions = exitIds
    .map((id) => graph.getEnvironment(id)?.position)
    .filter((position): position is { x: number; y: number } => Boolean(position));

  const heuristic = (nodeId: string): number => {
    if (exitPositions.length === 0 || heuristicCostPerUnit === 0) return 0;
    const nodePosition = graph.getEnvironment(nodeId)?.position;
    if (!nodePosition) return 0;
    const nearestExitDistance = Math.min(...exitPositions.map((exitPosition) => euclideanDistance(nodePosition, exitPosition)));
    return nearestExitDistance * heuristicCostPerUnit;
  };

  const gScore = new Map<string, number>();
  const previous = new Map<string, string>();
  const visited = new Set<string>();
  const visitedOrder: string[] = [];
  const steps: AlgorithmStep[] = [];
  let evaluatedEdgeCount = 0;

  graph.getEnvironmentIds().forEach((id) => gScore.set(id, Number.POSITIVE_INFINITY));
  gScore.set(originId, 0);

  const queue = new PriorityQueue<QueueItem>();
  const originF = heuristic(originId);
  queue.push({ id: originId, gScore: 0, fScore: originF }, originF);

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
      costSoFar: current.gScore,
      estimatedTotalCost: current.fScore,
    });

    if (exits.has(current.id)) {
      foundExitId = current.id;
      break;
    }

    graph.neighbors(current.id).forEach((neighbor) => {
      evaluatedEdgeCount += 1;
      if (visited.has(neighbor.environmentId)) return;
      const tentativeG = current.gScore + neighbor.weight;
      if (tentativeG < (gScore.get(neighbor.environmentId) ?? Number.POSITIVE_INFINITY)) {
        gScore.set(neighbor.environmentId, tentativeG);
        previous.set(neighbor.environmentId, current.id);
        const f = tentativeG + heuristic(neighbor.environmentId);
        queue.push({ id: neighbor.environmentId, gScore: tentativeG, fScore: f }, f);
        frontierIds.add(neighbor.environmentId);
      }
    });
  }

  const executionTimeMs = performance.now() - startTime;

  if (!foundExitId) {
    return {
      algorithm: 'ASTAR',
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
    algorithm: 'ASTAR',
    originId,
    found: true,
    path,
    cost: gScore.get(foundExitId) ?? 0,
    visitedOrder,
    exploredNodeCount: visitedOrder.length,
    evaluatedEdgeCount,
    executionTimeMs,
    steps,
  };
};
