import type { Graph } from '../Graph';

export const dfs = (graph: Graph, originId: string, visited = new Set<string>()): Set<string> => {
  if (visited.has(originId)) return visited;
  visited.add(originId);
  graph.neighbors(originId).forEach((neighbor) => dfs(graph, neighbor.environmentId, visited));
  return visited;
};
