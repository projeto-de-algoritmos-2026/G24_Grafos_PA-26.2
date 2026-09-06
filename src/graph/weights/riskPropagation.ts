import type { Connection, Environment } from '@/types';

export type RiskZone = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';

export interface RiskPropagationResult {
  /** BFS hop distance (number of connections) from the danger origin to each environment. */
  hopDistance: Map<string, number>;
  /** Normalized risk score in [0, 1], 1 = at the danger origin, 0 = unaffected. */
  score: Map<string, number>;
  /** Discrete classification used for the UI legend and for the cost model's thresholds. */
  zone: Map<string, RiskZone>;
}

const RISK_RADIUS_MIN_HOPS = 3;

/**
 * Propagates a danger's influence outward from its origin using a plain
 * BFS over the *physical* topology (every registered connection, ignoring
 * temporary blocks): hazards such as smoke or fire spread through the
 * building's real layout, not through the subset of doors an evacuee is
 * currently allowed to use.
 *
 * We deliberately do not model real fire physics (spread rate, fuel,
 * ventilation, etc.) — section 8 only asks for a *coherent* proximity-based
 * model that can visibly drive route choice. Risk decays linearly with hop
 * distance and reaches 0 past `RISK_RADIUS` hops, where the radius adapts
 * to the size of the building (bigger floors get a bigger blast radius)
 * but is never smaller than 3 hops so tiny floors still show a gradient.
 */
export const propagateRisk = (
  environments: Environment[],
  connections: Connection[],
  originId: string | null,
): RiskPropagationResult => {
  const hopDistance = new Map<string, number>();
  const score = new Map<string, number>();
  const zone = new Map<string, RiskZone>();

  environments.forEach((environment) => {
    score.set(environment.id, 0);
    zone.set(environment.id, 'NONE');
  });

  if (!originId || !environments.some((environment) => environment.id === originId)) {
    return { hopDistance, score, zone };
  }

  const adjacency = new Map<string, string[]>();
  environments.forEach((environment) => adjacency.set(environment.id, []));
  connections.forEach((connection) => {
    adjacency.get(connection.fromEnvironmentId)?.push(connection.toEnvironmentId);
    adjacency.get(connection.toEnvironmentId)?.push(connection.fromEnvironmentId);
  });

  hopDistance.set(originId, 0);
  const queue: string[] = [originId];
  let head = 0;
  while (head < queue.length) {
    const current = queue[head];
    head += 1;
    const currentHop = hopDistance.get(current) ?? 0;
    (adjacency.get(current) ?? []).forEach((neighborId) => {
      if (!hopDistance.has(neighborId)) {
        hopDistance.set(neighborId, currentHop + 1);
        queue.push(neighborId);
      }
    });
  }

  const farthestHop = Math.max(0, ...[...hopDistance.values()]);
  const riskRadius = Math.max(RISK_RADIUS_MIN_HOPS, Math.ceil(farthestHop * 0.6));

  hopDistance.forEach((hop, environmentId) => {
    const rawScore = Math.max(0, 1 - hop / riskRadius);
    score.set(environmentId, rawScore);
    zone.set(
      environmentId,
      hop === 0 ? 'CRITICAL' : rawScore >= 0.66 ? 'HIGH' : rawScore >= 0.33 ? 'MEDIUM' : rawScore > 0 ? 'LOW' : 'NONE',
    );
  });

  return { hopDistance, score, zone };
};

/**
 * Combines a connection's own static risk rating (0-10, set by whoever
 * modeled the building) with the dynamic risk propagated from the danger
 * origin, using the endpoints' average propagated score. `max` is used
 * (rather than sum) so a single extreme factor is enough to make a segment
 * clearly dangerous, without risk scores exceeding 1.
 */
export const combineEdgeRisk = (
  staticRiskLevel: number,
  propagated: RiskPropagationResult,
  fromId: string,
  toId: string,
): number => {
  const staticRisk = Math.min(1, Math.max(0, staticRiskLevel / 10));
  const fromRisk = propagated.score.get(fromId) ?? 0;
  const toRisk = propagated.score.get(toId) ?? 0;
  const dynamicRisk = (fromRisk + toRisk) / 2;
  return Math.max(staticRisk, dynamicRisk);
};
