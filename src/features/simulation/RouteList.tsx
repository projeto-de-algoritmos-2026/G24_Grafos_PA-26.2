import { Accessibility, GitFork } from 'lucide-react';
import type { Floor, Route, SimulationResult } from '@/types';
import { formatSeconds } from '@/utils/format';
import { compareContingency } from './routeComparison';

const DeltaRow = ({ label, primary, alternative }: { label: string; primary: string; alternative: string }) => (
  <tr className="border-t border-amber-200/60">
    <td className="py-1 pr-2 text-slate-500">{label}</td>
    <td className="py-1 pr-2 text-right font-semibold text-slate-700">{primary}</td>
    <td className="py-1 text-right font-semibold text-amber-700">{alternative}</td>
  </tr>
);

const ContingencyDetail = ({ primary, alternative }: { primary: Route; alternative: Route }) => {
  const cmp = compareContingency(primary, alternative);
  return (
    <div className="mt-2 rounded-md border border-amber-200 bg-amber-50/60 p-2.5">
      <p className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
        <GitFork size={13} /> Rota de contingência
      </p>
      <p className="mt-1 text-[11px] text-slate-500">{alternative.pathNames.join(' → ')}</p>
      <table className="mt-1.5 w-full text-[11px]">
        <thead>
          <tr className="text-slate-400">
            <th className="text-left font-bold">Métrica</th>
            <th className="text-right font-bold text-slate-600">Principal</th>
            <th className="text-right font-bold text-amber-700">Alternativa</th>
          </tr>
        </thead>
        <tbody>
          <DeltaRow label="Custo" primary={cmp.primaryCost.toFixed(3)} alternative={cmp.alternativeCost.toFixed(3)} />
          <DeltaRow label="Distância" primary={`${cmp.primaryDistanceMeters}m`} alternative={`${cmp.alternativeDistanceMeters}m`} />
          <DeltaRow label="Tempo" primary={formatSeconds(cmp.primaryTimeSeconds)} alternative={formatSeconds(cmp.alternativeTimeSeconds)} />
        </tbody>
      </table>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-600">
        <span>Sobreposição: <strong>{cmp.overlapPercentage}%</strong></span>
        <span>+Custo: <strong>{cmp.costIncreasePercentage}%</strong></span>
        <span>+Distância: <strong>{cmp.distanceDifferenceMeters}m</strong></span>
      </div>
    </div>
  );
};

const AccessibilityDetail = ({ route, names }: { route: Route; names: (id: string) => string }) => {
  const cmp = route.accessibilityComparison;
  if (!cmp) return null;
  if (!cmp.accessibleRouteExists) {
    return (
      <p className="mt-2 rounded-md border border-danger bg-red-50 p-2 text-[11px] font-semibold text-danger">
        Nenhuma rota acessível disponível neste cenário.
      </p>
    );
  }
  const distDiff = route.distanceMeters - cmp.standardDistanceMeters;
  return (
    <div className="mt-2 rounded-md border border-teal-200 bg-teal-50/60 p-2.5 text-[11px]">
      <p className="flex items-center gap-1.5 font-bold text-teal-800">
        <Accessibility size={13} /> Acessibilidade (PCD)
      </p>
      <p className="mt-1 text-slate-600">
        Rota acessível: <strong>{route.distanceMeters}m</strong> · custo <strong>{route.cost.toFixed(3)}</strong>
      </p>
      {cmp.isDifferentFromAccessible ? (
        <>
          <p className="mt-0.5 text-slate-500">
            Rota padrão equivalente: {cmp.standardPath.map((id) => names(id)).join(' → ')}
          </p>
          <p className="mt-0.5 text-slate-600">
            Padrão: <strong>{cmp.standardDistanceMeters}m</strong> · diferença{' '}
            <strong>{distDiff >= 0 ? '+' : ''}{distDiff}m</strong> — caminhos diferentes.
          </p>
        </>
      ) : (
        <p className="mt-0.5 text-slate-500">A rota acessível coincide com a rota padrão.</p>
      )}
    </div>
  );
};

export const RouteList = ({ result, floor }: { result: SimulationResult; floor: Floor }) => {
  const names = (id: string) => floor.environments.find((environment) => environment.id === id)?.name ?? id;
  const alternativeByOrigin = new Map(result.alternativeRoutes.map((route) => [route.originEnvironmentId, route]));

  return (
    <div className="mt-2 max-h-[520px] space-y-4 overflow-auto">
      {result.primaryRoutes.length > 0 ? (
        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Rotas Principais</h3>
          <div className="space-y-3">
            {result.primaryRoutes.map((route) => {
              const alternative = alternativeByOrigin.get(route.originEnvironmentId);
              return (
                <article key={`p-${route.originEnvironmentId}`} className="rounded-md border-l-4 border-success bg-green-50 p-3">
                  <p className="text-sm font-semibold text-success">
                    {route.pathNames[0]} → {route.pathNames[route.pathNames.length - 1]}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{route.pathNames.join(' → ')}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-600">
                    {formatSeconds(route.timeSeconds)} · {route.distanceMeters}m · custo {route.cost.toFixed(3)} · {route.peopleCount} pessoa(s)
                    {route.pcdPeopleCount > 0 ? ` (${route.pcdPeopleCount} PCD)` : ''}
                  </p>
                  <AccessibilityDetail route={route} names={names} />
                  {alternative && <ContingencyDetail primary={route} alternative={alternative} />}
                </article>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="rounded-md bg-red-50 p-3 text-sm font-semibold text-danger">
          Nenhuma rota de evacuação foi encontrada para este cenário.
        </p>
      )}
    </div>
  );
};
