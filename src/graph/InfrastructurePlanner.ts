import type { Connection, Environment } from '@/types';
import type {
  InfrastructureAlgorithm,
  InfrastructureCandidateEdge,
  InfrastructureComparison,
  InfrastructurePlanResult,
} from '@/types/infrastructure.types';
import { kruskal } from './algorithms/kruskal';
import { prim } from './algorithms/prim';
import type { WeightedEdgeInput } from './models/mst.types';

/** Default installation rate (R$/meter) used to price a candidate cable run. Purely a default; the UI lets the user edit each edge's cost before running the algorithm. */
export const DEFAULT_INSTALLATION_RATE_PER_METER = 45;

export class InfrastructurePlanner {
  /**
   * Generates the candidate cabling network for a floor. Candidates reuse
   * the evacuation connection topology (doors/corridors/staircases) because
   * physically running conduit follows the same paths people walk through -
   * this avoids inventing disconnected/unrealistic wiring data while still
   * giving Kruskal/Prim a real, non-trivial graph to optimize.
   */
  static generateCandidateEdges(
    connections: Connection[],
    ratePerMeter: number = DEFAULT_INSTALLATION_RATE_PER_METER,
  ): InfrastructureCandidateEdge[] {
    return connections.map((connection) => ({
      id: `infra_${connection.id}`,
      fromEnvironmentId: connection.fromEnvironmentId,
      toEnvironmentId: connection.toEnvironmentId,
      distanceMeters: connection.distanceMeters,
      installationCost: Math.round(connection.distanceMeters * ratePerMeter),
    }));
  }

  /** Runs the requested MST algorithm over the given candidate edges (with possibly user-edited costs) and summarizes the plan. */
  static plan(environments: Environment[], candidates: InfrastructureCandidateEdge[], algorithm: InfrastructureAlgorithm): InfrastructurePlanResult {
    const nodeIds = environments.map((environment) => environment.id);
    const weightedEdges: WeightedEdgeInput[] = candidates.map((edge) => ({
      id: edge.id,
      fromId: edge.fromEnvironmentId,
      toId: edge.toEnvironmentId,
      weight: edge.installationCost,
    }));

    const result = algorithm === 'KRUSKAL' ? kruskal(nodeIds, weightedEdges) : prim(nodeIds, weightedEdges);
    const candidateNetworkCost = candidates.reduce((total, edge) => total + edge.installationCost, 0);

    return {
      algorithm,
      candidateEdgeCount: candidates.length,
      candidateNetworkCost,
      selectedEdgeIds: result.edges.map((edge) => edge.id),
      selectedEdgeCount: result.edges.length,
      minimumCost: result.totalCost,
      savings: candidateNetworkCost - result.totalCost,
      isFullyConnected: result.isSpanningTree,
      componentCount: result.componentCount,
      executionTimeMs: result.executionTimeMs,
      steps: result.steps,
    };
  }

  /**
   * Runs both Kruskal and Prim over the *identical* node/edge/weight set
   * (section 14) and reports whether they reached the same cost and picked
   * the same edges. The two runs are fully independent — they are never
   * forced to agree — so a case with tie-breaking edges can legitimately
   * show `sameCost: true` with `sameEdges: false`.
   */
  static compare(environments: Environment[], candidates: InfrastructureCandidateEdge[]): InfrastructureComparison {
    const kruskalPlan = this.plan(environments, candidates, 'KRUSKAL');
    const primPlan = this.plan(environments, candidates, 'PRIM');
    const sameEdges =
      kruskalPlan.selectedEdgeIds.length === primPlan.selectedEdgeIds.length &&
      [...kruskalPlan.selectedEdgeIds].sort().join('|') === [...primPlan.selectedEdgeIds].sort().join('|');

    return {
      kruskal: kruskalPlan,
      prim: primPlan,
      sameCost: kruskalPlan.minimumCost === primPlan.minimumCost,
      sameEdges,
    };
  }
}
