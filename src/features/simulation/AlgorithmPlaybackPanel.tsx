import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react';
import type { AlgorithmRun } from '@/types';
import type { PathfindingAlgorithm } from '@/graph/models/pathfinding.types';
import type { PlaybackSpeed, StepPlayback } from '@/hooks/useStepPlayback';

const algorithmLabel: Record<PathfindingAlgorithm, string> = { DIJKSTRA: 'Dijkstra', ASTAR: 'A*' };
const speeds: PlaybackSpeed[] = [0.5, 1, 2];

interface Props {
  run: AlgorithmRun | undefined;
  playback: StepPlayback;
  availableAlgorithms: PathfindingAlgorithm[];
  selectedAlgorithm: PathfindingAlgorithm;
  onSelectAlgorithm: (algorithm: PathfindingAlgorithm) => void;
  environmentName: (id: string) => string;
}

const IconButton = ({
  onClick,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className="grid h-9 w-9 place-items-center rounded-md border border-border bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"
  >
    {children}
  </button>
);

export const AlgorithmPlaybackPanel = ({
  run,
  playback,
  availableAlgorithms,
  selectedAlgorithm,
  onSelectAlgorithm,
  environmentName,
}: Props) => {
  if (!run || run.steps.length === 0) {
    return <p className="rounded-md bg-slate-50 p-3 text-xs text-slate-500">Sem passos para reproduzir neste cenário.</p>;
  }

  const step = playback.current;

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-bold text-slate-800">Execução passo a passo</h3>

      {availableAlgorithms.length > 1 && (
        <div className="flex gap-1.5">
          {availableAlgorithms.map((algorithm) => (
            <button
              key={algorithm}
              onClick={() => onSelectAlgorithm(algorithm)}
              className={`flex-1 rounded-md border px-2 py-1 text-xs font-bold ${
                selectedAlgorithm === algorithm ? 'border-primary bg-blue-50 text-primary' : 'border-border bg-white text-slate-600'
              }`}
            >
              {algorithmLabel[algorithm]}
            </button>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-1.5">
        <IconButton onClick={playback.restart} title="Reiniciar">
          <RotateCcw size={16} />
        </IconButton>
        <IconButton onClick={playback.prev} disabled={playback.index === 0} title="Passo anterior">
          <ChevronLeft size={16} />
        </IconButton>
        <button
          onClick={playback.toggle}
          className="flex h-9 flex-1 items-center justify-center gap-2 rounded-md bg-primary text-xs font-bold text-white"
        >
          {playback.isPlaying ? <Pause size={15} /> : <Play size={15} />}
          {playback.isPlaying ? 'Pausar' : playback.atEnd ? 'Reproduzir' : 'Executar'}
        </button>
        <IconButton onClick={playback.next} disabled={playback.atEnd} title="Próximo passo">
          <ChevronRight size={16} />
        </IconButton>
      </div>

      {/* Speed */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-slate-500">Velocidade</span>
        {speeds.map((speed) => (
          <button
            key={speed}
            onClick={() => playback.setSpeed(speed)}
            className={`rounded-md border px-2 py-1 text-xs font-bold ${
              playback.speed === speed ? 'border-primary bg-blue-50 text-primary' : 'border-border bg-white text-slate-600'
            }`}
          >
            {speed}x
          </button>
        ))}
      </div>

      {/* Progress */}
      <div>
        <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
          <span>Passo {playback.index + 1} de {playback.total}</span>
          <span>{Math.round(((playback.index + 1) / playback.total) * 100)}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-200">
          <div
            className="h-1.5 rounded-full bg-primary transition-all"
            style={{ width: `${((playback.index + 1) / playback.total) * 100}%` }}
          />
        </div>
      </div>

      {/* Current step detail */}
      {step && (
        <div className="space-y-1 rounded-md border border-border bg-slate-50 p-3 text-xs text-slate-600">
          <p className="flex items-center justify-between">
            <span>Nó atual</span>
            <strong className="text-slate-800">{environmentName(step.currentId)}</strong>
          </p>
          <p className="flex items-center justify-between">
            <span>Custo até aqui (g)</span>
            <strong className="text-slate-800">{step.costSoFar.toFixed(3)}</strong>
          </p>
          {selectedAlgorithm === 'ASTAR' && (
            <p className="flex items-center justify-between">
              <span>Estimativa total (f = g + h)</span>
              <strong className="text-slate-800">{step.estimatedTotalCost.toFixed(3)}</strong>
            </p>
          )}
          <p className="flex items-center justify-between">
            <span>Fronteira / visitados</span>
            <strong className="text-slate-800">{step.frontierIds.length} / {step.visitedIds.length}</strong>
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-full" style={{ background: '#2563EB' }} /> Atual</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-full" style={{ background: '#FBBF24' }} /> Fronteira</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-full" style={{ background: '#CBD5E1' }} /> Visitado</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-full" style={{ background: '#16A34A' }} /> Caminho final</span>
      </div>
    </section>
  );
};
