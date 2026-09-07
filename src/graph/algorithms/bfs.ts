import type { Graph } from '../Graph';

export const bfs = (graph: Graph, originId: string, targetId: string): boolean => {
  const queue = [originId];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;
    if (current === targetId) return true;
    visited.add(current);
    graph.neighbors(current).forEach((neighbor) => {
      if (!visited.has(neighbor.environmentId)) queue.push(neighbor.environmentId);
    });
  }

  return false;
};
