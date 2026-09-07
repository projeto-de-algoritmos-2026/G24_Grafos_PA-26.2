export type MstAlgorithm = 'KRUSKAL' | 'PRIM';

export interface WeightedEdgeInput {
  id: string;
  fromId: string;
  toId: string;
  weight: number;
}

/** A single decision made while building the MST, used to explain/animate the run. */
export interface MstStep {
  order: number;
  edgeId: string;
  fromId: string;
  toId: string;
  weight: number;
  accepted: boolean;
  reason: string;
}

export interface MstResult {
  algorithm: MstAlgorithm;
  /** Edges chosen for the minimum spanning tree (or forest, if the graph is disconnected). */
  edges: WeightedEdgeInput[];
  totalCost: number;
  nodeCount: number;
  /** Number of connected components spanned. 1 means every node is connected by the resulting forest. */
  componentCount: number;
  /** True only when componentCount === 1, i.e. a single spanning tree covers every node. */
  isSpanningTree: boolean;
  executionTimeMs: number;
  steps: MstStep[];
}
