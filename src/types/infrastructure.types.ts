import type { MstStep } from '@/graph/models/mst.types';

export type InfrastructureAlgorithm = 'KRUSKAL' | 'PRIM';

/** Which MST algorithm(s) the infrastructure screen should run. 'BOTH' runs Kruskal and Prim over the identical candidate network for comparison. */
export type InfrastructureAlgorithmChoice = 'KRUSKAL' | 'PRIM' | 'BOTH';

/**
 * A possible cable run connecting two environments to install emergency
 * infrastructure (sensors, alarms, emergency lighting, communication).
 * Candidate edges reuse the building's existing corridor/door topology,
 * since cabling realistically follows the same physical paths people do -
 * the cost is derived from the real distance times an editable
 * installation rate (R$/meter).
 */
export interface InfrastructureCandidateEdge {
  id: string;
  fromEnvironmentId: string;
  toEnvironmentId: string;
  distanceMeters: number;
  installationCost: number;
}

export interface InfrastructurePlanResult {
  algorithm: InfrastructureAlgorithm;
  candidateEdgeCount: number;
  candidateNetworkCost: number;
  selectedEdgeIds: string[];
  selectedEdgeCount: number;
  minimumCost: number;
  savings: number;
  isFullyConnected: boolean;
  componentCount: number;
  executionTimeMs: number;
  /** Chronological decisions (edge accepted/rejected) taken while building the tree — used for the step list (section 15). */
  steps: MstStep[];
}

/**
 * Result of running Kruskal and Prim over the identical candidate network,
 * for the "compare both" mode (section 14). All comparison flags come from
 * the two real executions — MSTs with the same optimal cost may still pick
 * different edges when several edges tie in weight.
 */
export interface InfrastructureComparison {
  kruskal: InfrastructurePlanResult;
  prim: InfrastructurePlanResult;
  /** True when both algorithms reached the same total installation cost. */
  sameCost: boolean;
  /** True when both algorithms selected exactly the same set of edges. */
  sameEdges: boolean;
}
