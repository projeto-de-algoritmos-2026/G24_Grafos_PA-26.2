import type { Connection, Environment } from '@/types';

export interface WeightedNeighbor {
  environmentId: string;
  connection: Connection;
  weight: number;
}

export interface ResolvedEdge {
  connection: Connection;
  weight: number;
}

/**
 * Weighted, undirected graph over the building's environments and
 * connections. This class is intentionally unaware of *how* weights are
 * computed (distance/time/risk/criteria/intensity) - that responsibility
 * lives in `GraphBuilder` and `weights/costFunction.ts` so the algorithms
 * (Dijkstra, A*, Kruskal, Prim) only ever depend on this small, stable
 * structural API.
 */
export class Graph {
  private readonly environments = new Map<string, Environment>();
  private readonly adjacency = new Map<string, WeightedNeighbor[]>();
  private edgeCount = 0;

  constructor(environments: Environment[], edges: ResolvedEdge[]) {
    environments.forEach((environment) => {
      this.environments.set(environment.id, environment);
      this.adjacency.set(environment.id, []);
    });

    edges.forEach(({ connection, weight }) => {
      if (!this.adjacency.has(connection.fromEnvironmentId) || !this.adjacency.has(connection.toEnvironmentId)) return;
      this.adjacency.get(connection.fromEnvironmentId)?.push({ environmentId: connection.toEnvironmentId, connection, weight });
      this.adjacency.get(connection.toEnvironmentId)?.push({ environmentId: connection.fromEnvironmentId, connection, weight });
      this.edgeCount += 1;
    });
  }

  getEnvironment(id: string): Environment | undefined {
    return this.environments.get(id);
  }

  getEnvironments(): Environment[] {
    return [...this.environments.values()];
  }

  getEnvironmentIds(): string[] {
    return [...this.environments.keys()];
  }

  neighbors(environmentId: string): WeightedNeighbor[] {
    return this.adjacency.get(environmentId) ?? [];
  }

  getEdgeCount(): number {
    return this.edgeCount;
  }
}
