import type {
  AccessibilityComparison,
  AlgorithmRun,
  Connection,
  Environment,
  RiskZoneInfo,
  Route,
  RouteAnalysis,
  SimulationParams,
  SimulationResult,
} from '@/types';
import { createId } from '@/utils/id';
import { GraphBuilder } from './GraphBuilder';
import { findInaccessibleFromExits } from './algorithms/connectedComponents';
import { dijkstra } from './algorithms/dijkstra';
import { astar } from './algorithms/astar';
import type { Graph } from './Graph';
import type { PathfindingResult } from './models/pathfinding.types';

const sumPeople = (environment: Environment): number => environment.occupancy.regular + environment.occupancy.pcd;

const routeMetrics = (path: string[], connections: Connection[]): { distance: number; time: number } => {
  let distance = 0;
  let time = 0;
  for (let index = 0; index < path.length - 1; index += 1) {
    const from = path[index];
    const to = path[index + 1];
    const connection = connections.find(
      (item) =>
        (item.fromEnvironmentId === from && item.toEnvironmentId === to) ||
        (item.fromEnvironmentId === to && item.toEnvironmentId === from),
    );
    distance += connection?.distanceMeters ?? 0;
    time += connection?.traversalTimeSeconds ?? 0;
  }
  return { distance, time };
};

const connectionIdsForPath = (path: string[], connections: Connection[]): Set<string> => {
  const ids = new Set<string>();
  for (let index = 0; index < path.length - 1; index += 1) {
    const from = path[index];
    const to = path[index + 1];
    const connection = connections.find(
      (item) =>
        (item.fromEnvironmentId === from && item.toEnvironmentId === to) ||
        (item.fromEnvironmentId === to && item.toEnvironmentId === from),
    );
    if (connection) ids.add(connection.id);
  }
  return ids;
};

interface AlternativeCandidate {
  result: PathfindingResult;
}

export class SimulationEngine {
  run(params: SimulationParams): SimulationResult {
    const blockedEnvironmentIds = new Set(params.blockedEnvironmentIds);
    const exits = params.environments
      .filter((env) => env.type === 'EMERGENCY_EXIT' && !blockedEnvironmentIds.has(env.id))
      .map((env) => env.id);
    const byId = new Map(params.environments.map((env) => [env.id, env]));
    const primaryRoutes: Route[] = [];
    const alternativeRoutes: Route[] = [];
    const inaccessibleEnvironmentIds = new Set<string>();
    const inaccessiblePcdEnvironmentIds = new Set<string>();

    const occupiedEnvironments = params.environments.filter(
      (env) => sumPeople(env) > 0 && !blockedEnvironmentIds.has(env.id),
    );

    // The mass-evacuation batch (every occupied room routed to its nearest exit)
    // always uses Dijkstra as the canonical, guaranteed-optimal algorithm for the
    // aggregate coverage/time metrics. The user's algorithm choice (Dijkstra/A*/Both)
    // instead drives the focused single-origin analysis below, which is what sections
    // 5-7 of the spec actually ask to be selectable and comparable.
    occupiedEnvironments.forEach((environment) => {
      const requireAccessible = environment.occupancy.pcd > 0;
      const built = GraphBuilder.build(params.environments, params.connections, {
        intensity: params.intensity,
        criteria: params.criteria,
        blockedEnvironmentIds: params.blockedEnvironmentIds,
        blockedConnectionIds: params.blockedConnectionIds,
        requireAccessible,
        dangerOriginId: params.originEnvironmentId,
      });

      const primaryResult = dijkstra(built.graph, environment.id, exits);
      if (!primaryResult.found) {
        inaccessibleEnvironmentIds.add(environment.id);
        if (requireAccessible) inaccessiblePcdEnvironmentIds.add(environment.id);
        return;
      }

      const metrics = routeMetrics(primaryResult.path, params.connections);

      let accessibilityComparison: AccessibilityComparison | undefined;
      if (requireAccessible) {
        const standardBuilt = GraphBuilder.build(params.environments, params.connections, {
          intensity: params.intensity,
          criteria: params.criteria,
          blockedEnvironmentIds: params.blockedEnvironmentIds,
          blockedConnectionIds: params.blockedConnectionIds,
          requireAccessible: false,
          dangerOriginId: params.originEnvironmentId,
        });
        const standardResult = dijkstra(standardBuilt.graph, environment.id, exits);
        accessibilityComparison = {
          standardCost: standardResult.found ? standardResult.cost : Number.POSITIVE_INFINITY,
          standardDistanceMeters: standardResult.found ? routeMetrics(standardResult.path, params.connections).distance : 0,
          standardPath: standardResult.path,
          isDifferentFromAccessible: standardResult.found && standardResult.path.join('>') !== primaryResult.path.join('>'),
          accessibleRouteExists: true,
        };
      }

      primaryRoutes.push({
        type: 'PRIMARY',
        originEnvironmentId: environment.id,
        path: primaryResult.path,
        pathNames: primaryResult.path.map((id) => byId.get(id)?.name ?? id),
        distanceMeters: metrics.distance,
        timeSeconds: metrics.time,
        peopleCount: sumPeople(environment),
        pcdPeopleCount: environment.occupancy.pcd,
        exitEnvironmentId: primaryResult.path[primaryResult.path.length - 1],
        cost: primaryResult.cost,
        algorithm: primaryResult.algorithm,
        usedAccessibleProfile: requireAccessible,
        accessibilityComparison,
      });

      // Contingency route (section 13): a variant of Yen's algorithm for the 2nd
      // shortest loopless path. Instead of blocking every edge of the primary path
      // at once (which can make an otherwise-good detour impossible), we remove one
      // primary edge at a time, recompute, and keep the cheapest resulting detour
      // that differs from the primary path. This models "part of the primary route
      // becomes unavailable" much more faithfully than removing the whole route.
      const primaryEdgeIds = [...connectionIdsForPath(primaryResult.path, params.connections)];
      let bestAlternative: AlternativeCandidate | null = null;
      primaryEdgeIds.forEach((edgeId) => {
        const candidateBuilt = GraphBuilder.build(params.environments, params.connections, {
          intensity: params.intensity,
          criteria: params.criteria,
          blockedEnvironmentIds: params.blockedEnvironmentIds,
          blockedConnectionIds: [...params.blockedConnectionIds, edgeId],
          requireAccessible,
          dangerOriginId: params.originEnvironmentId,
        });
        const candidateResult = dijkstra(candidateBuilt.graph, environment.id, exits);
        if (candidateResult.found && candidateResult.path.join('>') !== primaryResult.path.join('>')) {
          if (!bestAlternative || candidateResult.cost < bestAlternative.result.cost) {
            bestAlternative = { result: candidateResult };
          }
        }
      });

      if (bestAlternative) {
        const chosen: AlternativeCandidate = bestAlternative;
        const altMetrics = routeMetrics(chosen.result.path, params.connections);
        const altEdgeIds = connectionIdsForPath(chosen.result.path, params.connections);
        const overlap =
          primaryEdgeIds.length > 0 ? (primaryEdgeIds.filter((id) => altEdgeIds.has(id)).length / primaryEdgeIds.length) * 100 : 0;
        alternativeRoutes.push({
          type: 'ALTERNATIVE',
          originEnvironmentId: environment.id,
          path: chosen.result.path,
          pathNames: chosen.result.path.map((id) => byId.get(id)?.name ?? id),
          distanceMeters: altMetrics.distance,
          timeSeconds: altMetrics.time,
          peopleCount: sumPeople(environment),
          pcdPeopleCount: environment.occupancy.pcd,
          exitEnvironmentId: chosen.result.path[chosen.result.path.length - 1],
          cost: chosen.result.cost,
          algorithm: chosen.result.algorithm,
          usedAccessibleProfile: requireAccessible,
          overlapWithPrimaryPercentage: Math.round(overlap),
        });
      }
    });

    const coverageBuilt = GraphBuilder.build(params.environments, params.connections, {
      intensity: params.intensity,
      criteria: params.criteria,
      blockedEnvironmentIds: params.blockedEnvironmentIds,
      blockedConnectionIds: params.blockedConnectionIds,
      requireAccessible: false,
      dangerOriginId: params.originEnvironmentId,
    });
    findInaccessibleFromExits(coverageBuilt.graph, exits).forEach((id) => inaccessibleEnvironmentIds.add(id));
    params.blockedEnvironmentIds.forEach((id) => inaccessibleEnvironmentIds.add(id));

    // Focused algorithm analysis + comparison (sections 5, 6, 7): the occupied
    // environment with the most people is used as the single representative
    // origin for the algorithm selector, the comparison table and the
    // step-by-step playback, so those views describe one concrete, inspectable
    // execution instead of an aggregate the user cannot visually verify.
    let analysis: RouteAnalysis | null = null;
    const focusEnvironment = [...occupiedEnvironments].sort((a, b) => sumPeople(b) - sumPeople(a))[0];
    if (focusEnvironment && exits.length > 0) {
      const focusBuilt = GraphBuilder.build(params.environments, params.connections, {
        intensity: params.intensity,
        criteria: params.criteria,
        blockedEnvironmentIds: params.blockedEnvironmentIds,
        blockedConnectionIds: params.blockedConnectionIds,
        requireAccessible: focusEnvironment.occupancy.pcd > 0,
        dangerOriginId: params.originEnvironmentId,
      });

      const toAlgorithmRun = (result: PathfindingResult): AlgorithmRun => {
        const routeMetric = result.found ? routeMetrics(result.path, params.connections) : { distance: 0, time: 0 };
        return {
          algorithm: result.algorithm,
          found: result.found,
          path: result.path,
          pathNames: result.path.map((id) => byId.get(id)?.name ?? id),
          cost: result.cost,
          distanceMeters: routeMetric.distance,
          timeSeconds: routeMetric.time,
          exploredNodeCount: result.exploredNodeCount,
          evaluatedEdgeCount: result.evaluatedEdgeCount,
          executionTimeMs: result.executionTimeMs,
          steps: result.steps,
        };
      };

      const runs: AlgorithmRun[] = [];
      if (params.algorithm === 'DIJKSTRA' || params.algorithm === 'BOTH') {
        runs.push(toAlgorithmRun(dijkstra(focusBuilt.graph, focusEnvironment.id, exits)));
      }
      if (params.algorithm === 'ASTAR' || params.algorithm === 'BOTH') {
        runs.push(toAlgorithmRun(astar(focusBuilt.graph, focusEnvironment.id, exits, focusBuilt.heuristicCostPerUnit)));
      }

      let sameOptimalCost: boolean | null = null;
      let samePath: boolean | null = null;
      if (runs.length === 2) {
        const [a, b] = runs;
        sameOptimalCost = a.found === b.found ? (a.found ? Math.abs(a.cost - b.cost) < 1e-6 : true) : false;
        samePath = a.found && b.found ? a.path.join('>') === b.path.join('>') : false;
      }

      analysis = {
        focusOriginId: focusEnvironment.id,
        focusOriginName: focusEnvironment.name,
        criteria: params.criteria,
        runs,
        sameOptimalCost,
        samePath,
      };
    }

    const riskZones: RiskZoneInfo[] = params.environments.map((environment) => ({
      environmentId: environment.id,
      zone: coverageBuilt.risk.zone.get(environment.id) ?? 'NONE',
      score: coverageBuilt.risk.score.get(environment.id) ?? 0,
    }));

    const totalPeople = params.environments.reduce((total, env) => total + sumPeople(env), 0);
    const evacuatedPeople = primaryRoutes.reduce((total, route) => total + route.peopleCount, 0);
    const estimatedTimeSeconds = primaryRoutes.reduce((max, route) => Math.max(max, route.timeSeconds), 0);

    return {
      id: createId('sim'),
      config: {
        id: createId('config'),
        buildingId: '',
        floorId: '',
        originEnvironmentId: params.originEnvironmentId,
        intensity: params.intensity,
        blockedEnvironmentIds: params.blockedEnvironmentIds,
        blockedConnectionIds: params.blockedConnectionIds,
        algorithm: params.algorithm,
        criteria: params.criteria,
        createdAt: new Date().toISOString(),
      },
      status: 'COMPLETED',
      primaryRoutes,
      alternativeRoutes,
      inaccessibleEnvironmentIds: [...inaccessibleEnvironmentIds],
      inaccessiblePcdEnvironmentIds: [...inaccessiblePcdEnvironmentIds],
      totalPeople,
      evacuatedPeople,
      estimatedTimeSeconds,
      exitsUsedIds: [...new Set(primaryRoutes.map((route) => route.exitEnvironmentId))],
      coveragePercentage: totalPeople === 0 ? 100 : Math.round((evacuatedPeople / totalPeople) * 100),
      executedAt: new Date().toISOString(),
      analysis,
      riskZones,
    };
  }
}
