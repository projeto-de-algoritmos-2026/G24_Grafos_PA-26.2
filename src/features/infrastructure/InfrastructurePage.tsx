import { useEffect, useMemo, useState } from 'react';
import { Cable, Network, Play } from 'lucide-react';
import { InfrastructureCanvas } from '@/components/canvas/InfrastructureCanvas';
import { EmptyState } from '@/components/common/EmptyState';
import { InfrastructurePlanner, DEFAULT_INSTALLATION_RATE_PER_METER } from '@/graph';
import { useBuildingsStore } from '@/store/buildings.store';
import type {
  InfrastructureAlgorithmChoice,
  InfrastructureCandidateEdge,
  InfrastructureComparison,
  InfrastructurePlanResult,
} from '@/types/infrastructure.types';

const money = (value: number) => `R$ ${value.toLocaleString('pt-BR')}`;

const algorithmOptions: { value: InfrastructureAlgorithmChoice; label: string }[] = [
  { value: 'KRUSKAL', label: 'Kruskal' },
  { value: 'PRIM', label: 'Prim' },
  { value: 'BOTH', label: 'Comparar ambos' },
];

export const InfrastructurePage = () => {
  const buildings = useBuildingsStore((state) => state.buildings);
  const [buildingId, setBuildingId] = useState(buildings[0]?.id ?? '');
  const building = buildings.find((item) => item.id === buildingId) ?? buildings[0];
  const [floorId, setFloorId] = useState(building?.floors[0]?.id ?? '');
  const floor = building?.floors.find((item) => item.id === floorId) ?? building?.floors[0];

  const [ratePerMeter, setRatePerMeter] = useState(DEFAULT_INSTALLATION_RATE_PER_METER);
  const [candidates, setCandidates] = useState<InfrastructureCandidateEdge[]>([]);
  const [choice, setChoice] = useState<InfrastructureAlgorithmChoice>('BOTH');
  const [plan, setPlan] = useState<InfrastructurePlanResult | null>(null);
  const [comparison, setComparison] = useState<InfrastructureComparison | null>(null);
  const [viewTree, setViewTree] = useState<'KRUSKAL' | 'PRIM'>('KRUSKAL');
  const [showCosts, setShowCosts] = useState(false);
  const [showSteps, setShowSteps] = useState(false);

  // Regenerate candidate edges whenever the floor or the base rate changes.
  useEffect(() => {
    if (!floor) {
      setCandidates([]);
    } else {
      setCandidates(InfrastructurePlanner.generateCandidateEdges(floor.connections, ratePerMeter));
    }
    setPlan(null);
    setComparison(null);
  }, [floor, ratePerMeter]);

  const nameById = useMemo(
    () => new Map((floor?.environments ?? []).map((environment) => [environment.id, environment.name])),
    [floor],
  );
  const name = (id: string) => nameById.get(id) ?? id;

  if (!building || !floor) {
    return <EmptyState icon={Network} title="Nenhuma planta disponível" description="Cadastre um edifício com um andar para planejar a infraestrutura." />;
  }

  const run = () => {
    if (choice === 'BOTH') {
      setComparison(InfrastructurePlanner.compare(floor.environments, candidates));
      setPlan(null);
    } else {
      setPlan(InfrastructurePlanner.plan(floor.environments, candidates, choice));
      setComparison(null);
    }
  };

  const editCost = (id: string, value: number) => {
    setCandidates((current) => current.map((edge) => (edge.id === id ? { ...edge, installationCost: Math.max(0, value) } : edge)));
    setPlan(null);
    setComparison(null);
  };

  const viewedPlan = comparison ? (viewTree === 'KRUSKAL' ? comparison.kruskal : comparison.prim) : plan;
  const selectedEdgeIds = new Set(viewedPlan?.selectedEdgeIds ?? []);
  const hasPlan = Boolean(viewedPlan);

  return (
    <div>
      <div className="mb-4">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900">
          <Network size={24} className="text-primary" /> Planejar Infraestrutura
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Rede mínima de infraestrutura de emergência (alarmes, sensores, iluminação, comunicação) entre os ambientes, via árvore
          geradora mínima (MST).
        </p>
      </div>

      {/* Controls bar */}
      <div className="mb-3 flex flex-wrap items-end gap-3 rounded-lg border border-border bg-white p-3">
        <label className="text-xs font-semibold text-slate-600">
          Edifício
          <select
            value={buildingId}
            onChange={(event) => {
              const next = event.target.value;
              setBuildingId(next);
              const first = buildings.find((item) => item.id === next)?.floors[0]?.id ?? '';
              setFloorId(first);
            }}
            className="mt-1 block h-9 w-52 rounded-md border border-border px-2 text-sm"
          >
            {buildings.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Andar
          <select
            value={floorId}
            onChange={(event) => setFloorId(event.target.value)}
            className="mt-1 block h-9 w-44 rounded-md border border-border px-2 text-sm"
          >
            {building.floors.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Custo (R$/metro)
          <input
            type="number"
            min={1}
            value={ratePerMeter}
            onChange={(event) => setRatePerMeter(Math.max(1, Number(event.target.value) || 1))}
            className="mt-1 block h-9 w-28 rounded-md border border-border px-2 text-sm"
          />
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Algoritmo
          <select
            value={choice}
            onChange={(event) => setChoice(event.target.value as InfrastructureAlgorithmChoice)}
            className="mt-1 block h-9 w-44 rounded-md border border-border px-2 text-sm"
          >
            {algorithmOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <button
          onClick={run}
          className="flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-bold text-white hover:opacity-90"
        >
          <Play size={15} /> Executar
        </button>
      </div>

      <div className="flex gap-4">
        {/* Canvas */}
        <div className="min-w-0 flex-1 overflow-hidden rounded-lg border border-border bg-white">
          <InfrastructureCanvas
            environments={floor.environments}
            candidates={candidates}
            selectedEdgeIds={selectedEdgeIds}
            hasPlan={hasPlan}
          />
        </div>

        {/* Results / editor */}
        <aside className="w-96 space-y-3">
          {/* Legend */}
          <div className="flex flex-wrap gap-3 rounded-lg border border-border bg-white p-3 text-xs font-semibold text-slate-600">
            <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-5 rounded bg-green-600" /> Escolhida (MST)</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-5 rounded" style={{ background: '#93C5FD' }} /> Candidata</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-5 rounded bg-slate-300" /> Rejeitada</span>
          </div>

          {/* View toggle for BOTH */}
          {comparison && (
            <div className="flex gap-1.5">
              {(['KRUSKAL', 'PRIM'] as const).map((tree) => (
                <button
                  key={tree}
                  onClick={() => setViewTree(tree)}
                  className={`flex-1 rounded-md border px-2 py-1 text-xs font-bold ${
                    viewTree === tree ? 'border-primary bg-blue-50 text-primary' : 'border-border bg-white text-slate-600'
                  }`}
                >
                  Ver {tree === 'KRUSKAL' ? 'Kruskal' : 'Prim'}
                </button>
              ))}
            </div>
          )}

          {/* Summary */}
          {viewedPlan ? (
            <div className="space-y-2 rounded-lg border border-border bg-white p-3 text-sm">
              <h3 className="font-bold text-slate-800">Resultado — {viewedPlan.algorithm === 'KRUSKAL' ? 'Kruskal' : 'Prim'}</h3>
              <div className="space-y-1 text-xs text-slate-600">
                <p className="flex justify-between"><span>Conexões candidatas</span><strong>{viewedPlan.candidateEdgeCount}</strong></p>
                <p className="flex justify-between"><span>Custo se todas instaladas</span><strong>{money(viewedPlan.candidateNetworkCost)}</strong></p>
                <p className="flex justify-between"><span>Conexões escolhidas</span><strong>{viewedPlan.selectedEdgeCount}</strong></p>
                <p className="flex justify-between"><span>Custo mínimo</span><strong className="text-success">{money(viewedPlan.minimumCost)}</strong></p>
                <p className="flex justify-between"><span>Economia</span><strong className="text-success">{money(viewedPlan.savings)}</strong></p>
                <p className="flex justify-between">
                  <span>Todos conectados</span>
                  <strong className={viewedPlan.isFullyConnected ? 'text-success' : 'text-danger'}>
                    {viewedPlan.isFullyConnected ? 'Sim' : `Não (${viewedPlan.componentCount} componentes)`}
                  </strong>
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-white p-4 text-center text-xs text-slate-500">
              Escolha um algoritmo e clique em <strong>Executar</strong> para calcular a rede mínima.
            </div>
          )}

          {/* Comparison table (BOTH) */}
          {comparison && (
            <div className="space-y-2 rounded-lg border border-border bg-white p-3">
              <h3 className="text-sm font-bold text-slate-800">Kruskal × Prim</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500">
                    <th className="py-1 pl-1 text-left font-bold">Métrica</th>
                    <th className="py-1 text-right font-bold text-slate-700">Kruskal</th>
                    <th className="py-1 pr-1 text-right font-bold text-slate-700">Prim</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border"><td className="py-1 pl-1 text-slate-500">Custo total</td><td className="py-1 text-right font-semibold">{money(comparison.kruskal.minimumCost)}</td><td className="py-1 pr-1 text-right font-semibold">{money(comparison.prim.minimumCost)}</td></tr>
                  <tr className="border-t border-border"><td className="py-1 pl-1 text-slate-500">Arestas escolhidas</td><td className="py-1 text-right font-semibold">{comparison.kruskal.selectedEdgeCount}</td><td className="py-1 pr-1 text-right font-semibold">{comparison.prim.selectedEdgeCount}</td></tr>
                  <tr className="border-t border-border"><td className="py-1 pl-1 text-slate-500">Tempo (ms)</td><td className="py-1 text-right font-semibold">{comparison.kruskal.executionTimeMs.toFixed(3)}</td><td className="py-1 pr-1 text-right font-semibold">{comparison.prim.executionTimeMs.toFixed(3)}</td></tr>
                  <tr className="border-t border-border"><td className="py-1 pl-1 text-slate-500">Árvore completa</td><td className="py-1 text-right font-semibold">{comparison.kruskal.isFullyConnected ? 'Sim' : 'Não'}</td><td className="py-1 pr-1 text-right font-semibold">{comparison.prim.isFullyConnected ? 'Sim' : 'Não'}</td></tr>
                  <tr className="border-t border-border"><td className="py-1 pl-1 text-slate-500">Componentes</td><td className="py-1 text-right font-semibold">{comparison.kruskal.componentCount}</td><td className="py-1 pr-1 text-right font-semibold">{comparison.prim.componentCount}</td></tr>
                </tbody>
              </table>
              <div className="space-y-1 rounded-md bg-slate-50 p-2 text-[11px] text-slate-600">
                <p className="flex justify-between"><span>Mesmo custo</span><strong className={comparison.sameCost ? 'text-success' : 'text-danger'}>{comparison.sameCost ? 'Sim' : 'Não'}</strong></p>
                <p className="flex justify-between"><span>Mesmas arestas</span><strong className={comparison.sameEdges ? 'text-success' : 'text-warning'}>{comparison.sameEdges ? 'Sim' : 'Não'}</strong></p>
                <p className="text-slate-500">MSTs diferentes podem existir com o mesmo custo ótimo quando há empates de peso.</p>
              </div>
            </div>
          )}

          {/* Steps */}
          {viewedPlan && viewedPlan.steps.length > 0 && (
            <div className="rounded-lg border border-border bg-white p-3">
              <button onClick={() => setShowSteps((value) => !value)} className="flex w-full items-center justify-between text-sm font-bold text-slate-800">
                <span className="flex items-center gap-1.5"><Cable size={14} /> Passos do {viewedPlan.algorithm === 'KRUSKAL' ? 'Kruskal' : 'Prim'}</span>
                <span className="text-xs text-primary">{showSteps ? 'ocultar' : 'ver'}</span>
              </button>
              {showSteps && (
                <ol className="mt-2 max-h-64 space-y-1 overflow-auto text-[11px]">
                  {viewedPlan.steps.map((step) => (
                    <li key={step.order} className={`rounded px-2 py-1 ${step.accepted ? 'bg-green-50 text-green-800' : 'bg-slate-50 text-slate-500'}`}>
                      <strong>{name(step.fromId)} – {name(step.toId)}</strong> (R$ {step.weight}) — {step.accepted ? 'aceita' : 'rejeitada'}
                      <span className="block text-[10px] opacity-80">{step.reason}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}

          {/* Cost editor */}
          <div className="rounded-lg border border-border bg-white p-3">
            <button onClick={() => setShowCosts((value) => !value)} className="flex w-full items-center justify-between text-sm font-bold text-slate-800">
              <span>Custos de instalação ({candidates.length})</span>
              <span className="text-xs text-primary">{showCosts ? 'ocultar' : 'editar'}</span>
            </button>
            {showCosts && (
              <div className="mt-2 max-h-64 space-y-1.5 overflow-auto">
                {candidates.map((edge) => (
                  <div key={edge.id} className="flex items-center gap-2 text-xs">
                    <span className="min-w-0 flex-1 truncate text-slate-600">{name(edge.fromEnvironmentId)} – {name(edge.toEnvironmentId)}</span>
                    <span className="text-slate-400">R$</span>
                    <input
                      type="number"
                      min={0}
                      value={edge.installationCost}
                      onChange={(event) => editCost(edge.id, Number(event.target.value) || 0)}
                      className="h-7 w-20 rounded border border-border px-1.5 text-right"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
