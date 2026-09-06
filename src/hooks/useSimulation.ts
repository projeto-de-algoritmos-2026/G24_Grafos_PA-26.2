import { useState } from 'react';
import { SimulationEngine } from '@/graph';
import { useBuildingsStore } from '@/store/buildings.store';
import type { AlgorithmChoice, OptimizationCriteria, SimulationIntensity, SimulationResult } from '@/types';

interface RunOptions {
  buildingId: string;
  floorId: string;
  originEnvironmentId: string;
  intensity: SimulationIntensity;
  blockedEnvironmentIds: string[];
  blockedConnectionIds: string[];
  /** Which pathfinding algorithm(s) to run for the focused analysis/comparison. Defaults to 'DIJKSTRA'. */
  algorithm?: AlgorithmChoice;
  /** Which evacuation objective drives the cost function. Defaults to 'BALANCED'. */
  criteria?: OptimizationCriteria;
}

export const useSimulation = () => {
  const getFloorById = useBuildingsStore((state) => state.getFloorById);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSimulation = async (options: RunOptions): Promise<SimulationResult | null> => {
    setIsRunning(true);
    setError(null);

    await new Promise((resolve) => setTimeout(resolve, 50));

    const floor = getFloorById(options.floorId);
    if (!floor) {
      setError('Andar não encontrado.');
      setIsRunning(false);
      return null;
    }
    if (!floor.environments.some((env) => env.type === 'EMERGENCY_EXIT')) {
      setError('Adicione pelo menos uma saída de emergência antes de executar.');
      setIsRunning(false);
      return null;
    }

    const engine = new SimulationEngine();
    const nextResult = engine.run({
      environments: floor.environments,
      connections: floor.connections,
      originEnvironmentId: options.originEnvironmentId,
      blockedEnvironmentIds: [options.originEnvironmentId, ...options.blockedEnvironmentIds],
      blockedConnectionIds: options.blockedConnectionIds,
      intensity: options.intensity,
      algorithm: options.algorithm ?? 'DIJKSTRA',
      criteria: options.criteria ?? 'BALANCED',
    });

    const enriched: SimulationResult = {
      ...nextResult,
      config: {
        ...nextResult.config,
        buildingId: options.buildingId,
        floorId: options.floorId,
      },
    };

    setResult(enriched);
    setIsRunning(false);
    return enriched;
  };

  const resetSimulation = () => {
    setResult(null);
    setError(null);
  };

  return { result, isRunning, error, runSimulation, resetSimulation };
};
