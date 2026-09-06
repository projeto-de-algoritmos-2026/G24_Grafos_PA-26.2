export type PathfindingAlgorithm = 'DIJKSTRA' | 'ASTAR';

/** Visual state of a node at a given point in an algorithm's execution, used for step-by-step playback. */
export type VisitState = 'UNVISITED' | 'FRONTIER' | 'VISITED' | 'CURRENT';

/**
 * A single step recorded while the algorithm runs. The frontend replays
 * these in order instead of re-running (or duplicating) the algorithm just
 * to animate it.
 */
export interface AlgorithmStep {
  /** 0-based order in which this step happened. */
  order: number;
  /** Node being expanded (dequeued from the priority queue) at this step. */
  currentId: string;
  /** Nodes currently sitting in the open set / frontier after this step. */
  frontierIds: string[];
  /** Nodes already finalized (closed set) after this step, including currentId. */
  visitedIds: string[];
  /** Known best cost (g-score) to currentId at this step. */
  costSoFar: number;
  /** For A* only: g(n) + h(n) for currentId. Equal to costSoFar for Dijkstra. */
  estimatedTotalCost: number;
}

export interface PathfindingResult {
  algorithm: PathfindingAlgorithm;
  originId: string;
  /** True when a path to any of the requested targets was found. */
  found: boolean;
  /** Node ids from origin to destination, inclusive. Empty when not found. */
  path: string[];
  /** Total accumulated edge weight along `path`. Infinity when not found. */
  cost: number;
  /** Order in which nodes were finalized (closed/popped from the queue). */
  visitedOrder: string[];
  /** Number of distinct nodes removed from the priority queue (expanded). */
  exploredNodeCount: number;
  /** Number of edges relaxed/evaluated during the run. */
  evaluatedEdgeCount: number;
  /** Wall-clock execution time of the algorithm, in milliseconds. */
  executionTimeMs: number;
  /** Ordered steps for animated playback in the frontend. */
  steps: AlgorithmStep[];
}
