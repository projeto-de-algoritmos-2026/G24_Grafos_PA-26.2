import type { Graph } from '../Graph';
import { dfs } from './dfs';

export const findInaccessibleFromExits = (graph: Graph, exitIds: string[]): string[] => {
  const reachable = new Set<string>();
  exitIds.forEach((exitId) => {
    dfs(graph, exitId, reachable);
  });
  return graph
    .getEnvironments()
    .filter((environment) => !reachable.has(environment.id))
    .map((environment) => environment.id);
};
