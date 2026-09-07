import type { Connection, ConnectionType, Environment, EnvironmentType } from '@/types';
import { Graph, type ResolvedEdge } from '@/graph/Graph';

/** Minimal Environment factory for tests. */
export const env = (
  id: string,
  overrides: Partial<Environment> = {},
): Environment => ({
  id,
  name: overrides.name ?? id,
  type: (overrides.type ?? 'ROOM') as EnvironmentType,
  capacity: overrides.capacity ?? 50,
  isAccessible: overrides.isAccessible ?? true,
  occupancy: overrides.occupancy ?? { regular: 0, pcd: 0 },
  position: overrides.position ?? { x: 0, y: 0 },
  isBlocked: overrides.isBlocked,
});

/** Minimal Connection factory for tests. */
export const conn = (
  id: string,
  fromEnvironmentId: string,
  toEnvironmentId: string,
  overrides: Partial<Connection> = {},
): Connection => ({
  id,
  fromEnvironmentId,
  toEnvironmentId,
  distanceMeters: overrides.distanceMeters ?? 10,
  traversalTimeSeconds: overrides.traversalTimeSeconds ?? 12,
  riskLevel: overrides.riskLevel ?? 0,
  isAccessible: overrides.isAccessible ?? true,
  type: (overrides.type ?? 'CORRIDOR') as ConnectionType,
  isBlocked: overrides.isBlocked,
});

/**
 * Builds a Graph directly from explicit edge weights, bypassing GraphBuilder
 * so pure-algorithm tests can assert exact costs.
 */
export const makeGraph = (
  environments: Environment[],
  weightedEdges: Array<{ connection: Connection; weight: number }>,
): Graph => new Graph(environments, weightedEdges as ResolvedEdge[]);
