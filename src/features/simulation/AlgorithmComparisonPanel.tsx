import type { AlgorithmRun, RouteAnalysis } from '@/types';
import { formatSeconds } from '@/utils/format';

const algorithmLabel: Record<string, string> = { DIJKSTRA: 'Dijkstra', ASTAR: 'A*' };

const fmtCost = (value: number) => (Number.isFinite(value) ? value.toFixed(3) : '—');
const fmtMs = (value: number) => `${value.toFixed(3)} ms`;
const pctDiff = (a: number, b: number) => (a === 0 ? 0 : Math.round(((a - b) / a) * 100));

const Row = ({ label, a, b, single }: { label: string; a: string; b?: string; single: boolean }) => (
  <tr className="border-t border-border">
    <td className="py-1.5 pr-2 text-slate-500">{label}</td>
    <td className="py-1.5 pr-2 text-right font-semibold text-slate-800">{a}</td>
    {!single && <td className="py-1.5 text-right font-semibold text-slate-800">{b}</td>}
  </tr>
);

const runCells = (run: AlgorithmRun | undefined, render: (run: AlgorithmRun) => string) =>
  run && run.found ? render(run) : run ? 'sem rota' : '—';

export const AlgorithmComparisonPanel = ({ analysis }: { analysis: RouteAnalysis }) => {
  const dijkstra = analysis.runs.find((run) => run.algorithm === 'DIJKSTRA');
  const astar = analysis.runs.find((run) => run.algorithm === 'ASTAR');
  const isComparison = Boolean(dijkstra && astar);
  const single = !isComparison;
  const soleRun = analysis.runs[0];

  const colA = isComparison ? dijkstra : soleRun;
  const colB = isComparison ? astar : undefined;

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-bold text-slate-800">
          {isComparison ? 'Comparação dos Algoritmos' : `Métricas — ${algorithmLabel[soleRun?.algorithm ?? ''] ?? ''}`}
        </h3>
        <p className="text-xs text-slate-500">
          Origem analisada: <strong>{analysis.focusOriginName}</strong>
          <span className="text-slate-400"> · execução real</span>
        </p>
      </div>

      <div className="overflow-hidden rounded-md border border-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50">
              <th className="py-1.5 pl-2 text-left font-bold text-slate-500">Métrica</th>
              <th className="py-1.5 pr-2 text-right font-bold text-slate-700">
                {isComparison ? 'Dijkstra' : algorithmLabel[soleRun?.algorithm ?? ''] ?? ''}
              </th>
              {isComparison && <th className="py-1.5 pr-2 text-right font-bold text-slate-700">A*</th>}
            </tr>
          </thead>
          <tbody>
            <Row single={single} label="Encontrou rota" a={colA?.found ? 'Sim' : 'Não'} b={colB?.found ? 'Sim' : 'Não'} />
            <Row single={single} label="Custo final" a={runCells(colA, (r) => fmtCost(r.cost))} b={runCells(colB, (r) => fmtCost(r.cost))} />
            <Row single={single} label="Distância" a={runCells(colA, (r) => `${r.distanceMeters}m`)} b={runCells(colB, (r) => `${r.distanceMeters}m`)} />
            <Row single={single} label="Tempo da rota" a={runCells(colA, (r) => formatSeconds(r.timeSeconds))} b={runCells(colB, (r) => formatSeconds(r.timeSeconds))} />
            <Row single={single} label="Nós explorados" a={runCells(colA, (r) => String(r.exploredNodeCount))} b={runCells(colB, (r) => String(r.exploredNodeCount))} />
            <Row single={single} label="Arestas analisadas" a={runCells(colA, (r) => String(r.evaluatedEdgeCount))} b={runCells(colB, (r) => String(r.evaluatedEdgeCount))} />
            <Row single={single} label="Tempo de execução" a={runCells(colA, (r) => fmtMs(r.executionTimeMs))} b={runCells(colB, (r) => fmtMs(r.executionTimeMs))} />
          </tbody>
        </table>
      </div>

      {isComparison && dijkstra && astar && (
        <div className="space-y-1.5 rounded-md border border-border bg-slate-50 p-3 text-xs text-slate-600">
          <p className="flex items-center justify-between">
            <span>Mesmo custo ótimo</span>
            <strong className={analysis.sameOptimalCost ? 'text-success' : 'text-danger'}>
              {analysis.sameOptimalCost ? 'Sim' : 'Não'}
            </strong>
          </p>
          <p className="flex items-center justify-between">
            <span>Mesmo caminho</span>
            <strong className={analysis.samePath ? 'text-success' : 'text-warning'}>
              {analysis.samePath ? 'Sim' : 'Não (empate de custo)'}
            </strong>
          </p>
          <p className="flex items-center justify-between">
            <span>A* explorou menos nós</span>
            <strong className="text-slate-800">{pctDiff(dijkstra.exploredNodeCount, astar.exploredNodeCount)}%</strong>
          </p>
          <p className="flex items-center justify-between">
            <span>A* analisou menos arestas</span>
            <strong className="text-slate-800">{pctDiff(dijkstra.evaluatedEdgeCount, astar.evaluatedEdgeCount)}%</strong>
          </p>
        </div>
      )}
    </section>
  );
};
