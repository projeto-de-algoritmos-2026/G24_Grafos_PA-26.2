import { AlertTriangle } from 'lucide-react';
import type { AlgorithmRun, Building, Floor, SimulationResult } from '@/types';
import type { PathfindingAlgorithm } from '@/graph/models/pathfinding.types';
import type { RiskZone } from '@/graph/weights/riskPropagation';
import type { StepPlayback } from '@/hooks/useStepPlayback';
import { MetricsPanel } from './MetricsPanel';
import { RouteList } from './RouteList';
import { AlgorithmComparisonPanel } from './AlgorithmComparisonPanel';
import { AlgorithmPlaybackPanel } from './AlgorithmPlaybackPanel';
import { RiskLegend, RISK_ZONE_COLORS } from './RiskLegend';

export type ResultTab = 'ROTAS' | 'ALGORITMOS' | 'RISCO';

interface Props {
  result: SimulationResult;
  building: Building;
  floor: Floor;
  tab: ResultTab;
  onTab: (tab: ResultTab) => void;
  onPdf: () => void;
  onNew: () => void;
  playback: StepPlayback;
  playbackRun: AlgorithmRun | undefined;
  availableAlgorithms: PathfindingAlgorithm[];
  activeAlgorithm: PathfindingAlgorithm;
  onSelectAlgorithm: (algorithm: PathfindingAlgorithm) => void;
}

const tabs: { id: ResultTab; label: string }[] = [
  { id: 'ROTAS', label: 'Rotas' },
  { id: 'ALGORITMOS', label: 'Algoritmos' },
  { id: 'RISCO', label: 'Risco' },
];

const riskOrder: RiskZone[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const riskLabels: Record<RiskZone, string> = {
  CRITICAL: 'Crítico',
  HIGH: 'Alto',
  MEDIUM: 'Médio',
  LOW: 'Baixo',
  NONE: 'Sem risco',
};

export const SimulationResultPanel = ({
  result,
  building,
  floor,
  tab,
  onTab,
  onPdf,
  onNew,
  playback,
  playbackRun,
  availableAlgorithms,
  activeAlgorithm,
  onSelectAlgorithm,
}: Props) => {
  const status =
    result.coveragePercentage === 100 ? 'Evacuação Completa' : result.coveragePercentage > 0 ? 'Evacuação Parcial' : 'Evacuação Impossível';
  const statusColor =
    result.coveragePercentage === 100 ? 'text-success' : result.coveragePercentage > 0 ? 'text-warning' : 'text-danger';

  const environmentName = (id: string) => floor.environments.find((environment) => environment.id === id)?.name ?? id;
  const dangerName = environmentName(result.config.originEnvironmentId);

  const riskCounts = riskOrder.map((zone) => ({
    zone,
    count: result.riskZones.filter((info) => info.zone === zone).length,
  }));

  return (
    <aside className="space-y-4 rounded-lg border border-border bg-white p-4 shadow-sm">
      <div>
        <h2 className={`text-lg font-bold ${statusColor}`}>{status}</h2>
        <p className="text-sm text-slate-500">
          {building.name} · {floor.name}
        </p>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button className="rounded-md border border-border px-4 py-2 text-sm font-bold hover:bg-slate-50" onClick={onPdf}>
          Gerar PDF
        </button>
        <button className="rounded-md border border-border px-4 py-2 text-sm font-bold hover:bg-slate-50" onClick={onNew}>
          Nova Simulação
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
        {tabs.map((item) => (
          <button
            key={item.id}
            onClick={() => onTab(item.id)}
            className={`flex-1 rounded-md px-2 py-1.5 text-xs font-bold transition-colors ${
              tab === item.id ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* ── ROTAS ─────────────────────────────────────────── */}
      {tab === 'ROTAS' && (
        <>
          <div className="flex flex-wrap gap-2 rounded-md bg-slate-50 p-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-5 rounded bg-success" /> Rota principal</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-5 rounded bg-warning" /> Alternativa</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-5 rounded border-2 border-primary bg-white" /> Saída ativa</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-5 rounded bg-red-200" /> Bloqueio</span>
          </div>
          <MetricsPanel result={result} floor={floor} />
          <RouteList result={result} floor={floor} />
          {result.inaccessibleEnvironmentIds.length > 0 && (
            <section className="rounded-md border border-danger bg-red-50 p-3">
              <h3 className="flex items-center gap-2 text-sm font-bold text-danger">
                <AlertTriangle size={15} /> {result.inaccessibleEnvironmentIds.length} área(s) sem rota de saída
              </h3>
              <ul className="mt-2 space-y-1">
                {result.inaccessibleEnvironmentIds.map((id) => {
                  const environment = floor.environments.find((item) => item.id === id);
                  const people = environment ? environment.occupancy.regular + environment.occupancy.pcd : 0;
                  return (
                    <li key={id} className="text-xs text-danger">
                      {environment?.name ?? id}
                      {people > 0 ? ` — ${people} pessoa(s) em risco` : ''}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </>
      )}

      {/* ── ALGORITMOS ────────────────────────────────────── */}
      {tab === 'ALGORITMOS' && (
        <>
          {result.analysis ? (
            <>
              <AlgorithmComparisonPanel analysis={result.analysis} />
              <div className="border-t border-border pt-3">
                <AlgorithmPlaybackPanel
                  run={playbackRun}
                  playback={playback}
                  availableAlgorithms={availableAlgorithms}
                  selectedAlgorithm={activeAlgorithm}
                  onSelectAlgorithm={onSelectAlgorithm}
                  environmentName={environmentName}
                />
              </div>
            </>
          ) : (
            <p className="rounded-md bg-slate-50 p-3 text-xs text-slate-500">
              Sem análise algorítmica: nenhum ambiente ocupado pôde ser roteado neste cenário.
            </p>
          )}
        </>
      )}

      {/* ── RISCO ─────────────────────────────────────────── */}
      {tab === 'RISCO' && (
        <div className="space-y-3">
          <p className="rounded-md bg-red-50 p-2.5 text-xs text-slate-600">
            Perigo originado em <strong className="text-danger">{dangerName}</strong>. O risco propaga-se pela topologia física
            e diminui conforme a distância.
          </p>
          <RiskLegend />
          <div className="space-y-1.5">
            {riskCounts.map(({ zone, count }) => (
              <div key={zone} className="flex items-center justify-between rounded-md border border-border px-3 py-1.5 text-xs">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="inline-block h-3 w-3 rounded-full" style={{ background: RISK_ZONE_COLORS[zone] }} />
                  {riskLabels[zone]}
                </span>
                <strong className="text-slate-800">{count} ambiente(s)</strong>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-400">
            Use a prioridade “Mais segura” na configuração para ver o risco desviar a rota do menor caminho físico.
          </p>
        </div>
      )}
    </aside>
  );
};
