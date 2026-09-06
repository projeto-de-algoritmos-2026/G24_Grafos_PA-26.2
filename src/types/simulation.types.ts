import type { Environment } from './building.types';
import type { AlgorithmStep, PathfindingAlgorithm } from '@/graph/models/pathfinding.types';
import type { RiskZone } from '@/graph/weights/riskPropagation';

export type SimulationIntensity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type SimulationStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

/** Which pathfinding algorithm(s) to run for the scenario. 'BOTH' runs Dijkstra and A* over the identical graph for comparison. */
export type AlgorithmChoice = 'DIJKSTRA' | 'ASTAR' | 'BOTH';

export type { OptimizationCriteria } from '@/graph/weights/costFunction';

export interface SimulationConfig {
  id: string;
  buildingId: string;
  floorId: string;
  /** Environment where the danger (fire/hazard) originated. Drives risk propagation. */
  originEnvironmentId: string;
  intensity: SimulationIntensity;
  blockedEnvironmentIds: string[];
  blockedConnectionIds: string[];
  algorithm: AlgorithmChoice;
  criteria: import('@/graph/weights/costFunction').OptimizationCriteria;
  createdAt: string;
}

/** Comparison between the accessible route actually used and the unrestricted (standard) route, for occupants requiring accessibility. */
export interface AccessibilityComparison {
  standardCost: number;
  standardDistanceMeters: number;
  standardPath: string[];
  isDifferentFromAccessible: boolean;
  accessibleRouteExists: boolean;
}

export interface Route {
  type: 'PRIMARY' | 'ALTERNATIVE';
  originEnvironmentId: string;
  path: string[];
  pathNames: string[];
  distanceMeters: number;
  timeSeconds: number;
  peopleCount: number;
  pcdPeopleCount: number;
  exitEnvironmentId: string;
  cost: number;
  algorithm: PathfindingAlgorithm;
  usedAccessibleProfile: boolean;
  accessibilityComparison?: AccessibilityComparison;
  /** For ALTERNATIVE routes: percentage (0-100) of edges shared with the primary route. */
  overlapWithPrimaryPercentage?: number;
}

/** A single algorithm's execution over the "focus" scenario (see RouteAnalysis), kept for comparison and animated playback. */
export interface AlgorithmRun {
  algorithm: PathfindingAlgorithm;
  found: boolean;
  path: string[];
  pathNames: string[];
  cost: number;
  distanceMeters: number;
  timeSeconds: number;
  exploredNodeCount: number;
  evaluatedEdgeCount: number;
  executionTimeMs: number;
  steps: AlgorithmStep[];
}

/**
 * Detailed, real (never simulated/hardcoded) execution analysis for one
 * representative origin - the occupied environment with the most people -
 * used to drive the algorithm comparison table and the step-by-step
 * playback on the simulation screen.
 */
export interface RouteAnalysis {
  focusOriginId: string;
  focusOriginName: string;
  criteria: import('@/graph/weights/costFunction').OptimizationCriteria;
  runs: AlgorithmRun[];
  /** Null when only one algorithm ran. True/false when both ran and could be compared. */
  sameOptimalCost: boolean | null;
  samePath: boolean | null;
}

export interface RiskZoneInfo {
  environmentId: string;
  zone: RiskZone;
  score: number;
}

export interface SimulationResult {
  id: string;
  config: SimulationConfig;
  status: SimulationStatus;
  primaryRoutes: Route[];
  alternativeRoutes: Route[];
  inaccessibleEnvironmentIds: string[];
  inaccessiblePcdEnvironmentIds: string[];
  totalPeople: number;
  evacuatedPeople: number;
  estimatedTimeSeconds: number;
  exitsUsedIds: string[];
  coveragePercentage: number;
  executedAt: string;
  analysis: RouteAnalysis | null;
  riskZones: RiskZoneInfo[];
}

export interface SimulationParams {
  environments: Environment[];
  connections: import('./connection.types').Connection[];
  originEnvironmentId: string;
  intensity: SimulationIntensity;
  blockedEnvironmentIds: string[];
  blockedConnectionIds: string[];
  algorithm: AlgorithmChoice;
  criteria: import('@/graph/weights/costFunction').OptimizationCriteria;
}
