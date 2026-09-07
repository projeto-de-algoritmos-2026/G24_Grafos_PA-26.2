import type { Floor, SimulationResult } from '@/types';
import { formatSeconds } from '@/utils/format';

interface MetricsPanelProps {
  result: SimulationResult;
  floor: Floor;
}

export const MetricsPanel = ({ result, floor }: MetricsPanelProps) => {
  const inaccessiblePeople = result.inaccessibleEnvironmentIds.reduce((total, id) => {
    const env = floor.environments.find((e) => e.id === id);
    return total + (env ? env.occupancy.regular + env.occupancy.pcd : 0);
  }, 0);

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-md border border-green-200 bg-green-50 p-3">
        <p className="text-xs text-slate-500">Pessoas evacuadas</p>
        <strong className="text-success">
          {result.evacuatedPeople} / {result.totalPeople}
        </strong>
      </div>
      <div
        className={`rounded-md border p-3 ${
          inaccessiblePeople > 0 ? 'border-red-200 bg-red-50' : 'border-border bg-slate-50'
        }`}
      >
        <p className="text-xs text-slate-500">Em risco</p>
        <strong className={inaccessiblePeople > 0 ? 'text-danger' : ''}>
          {inaccessiblePeople} pessoa(s)
        </strong>
      </div>
      <div className="rounded-md border border-border bg-slate-50 p-3">
        <p className="text-xs text-slate-500">Tempo estimado</p>
        <strong>{formatSeconds(result.estimatedTimeSeconds)}</strong>
      </div>
      <div className="rounded-md border border-border bg-slate-50 p-3">
        <p className="text-xs text-slate-500">Rotas calculadas</p>
        <strong>
          {result.primaryRoutes.length} principal
          {result.alternativeRoutes.length > 0
            ? ` + ${result.alternativeRoutes.length} alt.`
            : ''}
        </strong>
      </div>
      <div className="col-span-2 rounded-md border border-border bg-slate-50 p-3">
        <p className="text-xs text-slate-500">Cobertura de evacuação</p>
        <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
          <div
            className={`h-2 rounded-full transition-all ${
              result.coveragePercentage === 100
                ? 'bg-success'
                : result.coveragePercentage > 0
                  ? 'bg-warning'
                  : 'bg-danger'
            }`}
            style={{ width: `${result.coveragePercentage}%` }}
          />
        </div>
        <p className="mt-1 text-sm font-bold">{result.coveragePercentage}%</p>
      </div>
    </div>
  );
};
