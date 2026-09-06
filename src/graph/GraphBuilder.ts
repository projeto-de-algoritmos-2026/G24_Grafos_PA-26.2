import type { Connection, Environment, SimulationIntensity } from '@/types';
import { Graph, type ResolvedEdge } from './Graph';
import {
  computeEdgeCost,
  distanceCostPerMeter,
  resolveCriteriaWeights,
  type CriteriaWeights,
  type OptimizationCriteria,
} from './weights/costFunction';
import { combineEdgeRisk, propagateRisk, type RiskPropagationResult } from './weights/riskPropagation';

export interface BuildOptions {
  intensity: SimulationIntensity;
  criteria: OptimizationCriteria;
  blockedEnvironmentIds: string[];
  blockedConnectionIds: string[];
  requireAccessible: boolean;
  /** The environment where the danger originated, if any. Drives risk propagation (section 8). */
  dangerOriginId?: string | null;
}

export interface BuiltGraph {
  graph: Graph;
  weights: CriteriaWeights;
  /**
   * Coefficient A* multiplies the straight-line distance between node
   * *positions* by, to estimate the remaining cost (see astar.ts). Node
   * positions are in canvas pixels while edge distances are in meters, so
   * this folds together the cost-per-meter AND a conservative pixels→meters
   * scale, keeping the heuristic admissible/consistent regardless of the
   * layout's pixel scale.
   */
  heuristicCostPerUnit: number;
  risk: RiskPropagationResult;
}

const ELEVATOR_PENALTY = 999;
const ACCESSIBILITY_PENALTY = 500;

export class GraphBuilder {
  /**
   * Builds a `Graph` reflecting the current scenario: blocked
   * vertices/edges are entirely removed (not mutated in the original
   * building data - see section 11), elevators are disabled automatically
   * under HIGH/CRITICAL intensity, and accessibility-incompatible
   * connections are excluded when `requireAccessible` is set.
   *
   * Normalization statistics (max distance/time) are computed from the
   * *full, unfiltered* connection list so that removing edges for a given
   * scenario never shifts the cost scale - this keeps A*'s heuristic valid
   * and keeps Dijkstra/A* comparisons meaningful across "primary" and
   * "contingency" graph variants of the same floor.
   */
  static build(environments: Environment[], connections: Connection[], options: BuildOptions): BuiltGraph {
    const weights = resolveCriteriaWeights(options.criteria, options.intensity);
    const stats = {
      maxDistance: Math.max(0, ...connections.map((connection) => connection.distanceMeters)),
      maxTime: Math.max(0, ...connections.map((connection) => connection.traversalTimeSeconds)),
    };

    const risk = propagateRisk(environments, connections, options.dangerOriginId ?? null);

    // Positions are in pixels but distances in meters. Derive a *conservative*
    // pixels→meters scale (the smallest meters-per-pixel ratio across edges) so
    // that the straight-line estimate never exceeds the real distance of any
    // segment — this is what keeps the A* heuristic admissible and consistent.
    const positionById = new Map(environments.map((environment) => [environment.id, environment.position]));
    let metersPerPixel = Number.POSITIVE_INFINITY;
    connections.forEach((connection) => {
      const from = positionById.get(connection.fromEnvironmentId);
      const to = positionById.get(connection.toEnvironmentId);
      if (!from || !to) return;
      const pixelDistance = Math.hypot(from.x - to.x, from.y - to.y);
      if (pixelDistance > 0) metersPerPixel = Math.min(metersPerPixel, connection.distanceMeters / pixelDistance);
    });
    if (!Number.isFinite(metersPerPixel)) metersPerPixel = 0;

    const blockedEnvironmentIds = new Set(options.blockedEnvironmentIds);
    const blockedConnectionIds = new Set(options.blockedConnectionIds);
    const activeEnvironments = environments.filter((environment) => !blockedEnvironmentIds.has(environment.id));
    const activeEnvironmentIds = new Set(activeEnvironments.map((environment) => environment.id));

    const edges: ResolvedEdge[] = connections
      .filter((connection) => {
        const elevatorBlocked = connection.type === 'ELEVATOR' && (options.intensity === 'HIGH' || options.intensity === 'CRITICAL');
        return (
          !blockedConnectionIds.has(connection.id) &&
          !elevatorBlocked &&
          activeEnvironmentIds.has(connection.fromEnvironmentId) &&
          activeEnvironmentIds.has(connection.toEnvironmentId) &&
          (!options.requireAccessible || connection.isAccessible)
        );
      })
      .map((connection) => {
        const combinedRisk = combineEdgeRisk(connection.riskLevel, risk, connection.fromEnvironmentId, connection.toEnvironmentId);
        const baseWeight = computeEdgeCost(
          {
            distanceMeters: connection.distanceMeters,
            traversalTimeSeconds: connection.traversalTimeSeconds,
            combinedRisk,
          },
          weights,
          stats,
        );
        // Defensive penalties in case a caller builds a graph without pre-filtering
        // (kept as large constants so these edges are practically never chosen without
        // fully removing the possibility, matching the "increase cost" strategy from section 11).
        const elevatorPenalty = connection.type === 'ELEVATOR' && (options.intensity === 'HIGH' || options.intensity === 'CRITICAL') ? ELEVATOR_PENALTY : 0;
        const accessibilityPenalty = options.requireAccessible && !connection.isAccessible ? ACCESSIBILITY_PENALTY : 0;
        return { connection, weight: baseWeight + elevatorPenalty + accessibilityPenalty };
      });

    return {
      graph: new Graph(activeEnvironments, edges),
      weights,
      heuristicCostPerUnit: distanceCostPerMeter(weights, stats) * metersPerPixel,
      risk,
    };
  }
}
