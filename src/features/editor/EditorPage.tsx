import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CanvasToolbar } from '@/components/canvas/CanvasToolbar';
import { FloorCanvas } from '@/components/canvas/FloorCanvas';
import type { PlaybackNodeState } from '@/components/canvas/EnvironmentNode';
import { EmptyState } from '@/components/common/EmptyState';
import { useCanvas } from '@/hooks/useCanvas';
import { useSimulation } from '@/hooks/useSimulation';
import { useStepPlayback } from '@/hooks/useStepPlayback';
import { useBuildingsStore } from '@/store/buildings.store';
import type { AlgorithmChoice, Connection, OptimizationCriteria, SimulationIntensity } from '@/types';
import type { PathfindingAlgorithm } from '@/graph/models/pathfinding.types';
import type { RiskZone } from '@/graph/weights/riskPropagation';
import { Layers, StopCircle } from 'lucide-react';
import { generateSimulationPdf } from '../reports/ReportGenerator';
import { SimulationResultPanel, type ResultTab } from '../simulation/SimulationResultPanel';
import { SimulationSetupPanel } from '../simulation/SimulationSetupPanel';
import { AddConnectionModal, type AddConnectionFormData } from './AddConnectionModal';
import { AddEnvironmentModal, type AddEnvironmentFormData } from './AddEnvironmentModal';
import { ConnectionEditPanel } from './ConnectionEditPanel';
import { EnvironmentEditPanel } from './EnvironmentEditPanel';

interface PendingConnection {
  fromId: string;
  toId: string;
}

/** Connection ids that lie along an ordered node path — used to highlight the final route during playback. */
const pathEdgeIds = (path: string[], connections: Connection[]): Set<string> => {
  const ids = new Set<string>();
  for (let index = 0; index < path.length - 1; index += 1) {
    const from = path[index];
    const to = path[index + 1];
    const connection = connections.find(
      (item) =>
        (item.fromEnvironmentId === from && item.toEnvironmentId === to) ||
        (item.fromEnvironmentId === to && item.toEnvironmentId === from),
    );
    if (connection) ids.add(connection.id);
  }
  return ids;
};

const instructionForMode = (
  mode: string,
  connectionStart: string | null,
  simMode: boolean,
  originId: string | null,
  hasResult: boolean,
): string | null => {
  if (hasResult) return null;
  if (simMode && !originId) return 'Clique no ambiente onde o perigo iniciou';
  if (simMode && originId) return 'Clique em ambientes ou conexões para bloquear (opcional)';
  if (mode === 'ADD_ENV') return 'Clique em qualquer lugar do canvas para adicionar um ambiente';
  if (mode === 'ADD_CONNECTION')
    return connectionStart ? 'Agora clique no ambiente de destino' : 'Clique no ambiente de origem da conexão';
  if (mode === 'DELETE') return 'Clique em um ambiente ou conexão para excluir';
  return null;
};

export const EditorPage = () => {
  const { buildingId, floorId } = useParams();
  const building = useBuildingsStore((state) => state.getBuildingById(buildingId ?? ''));
  const floor = useBuildingsStore((state) => state.getFloorById(floorId ?? ''));
  const addEnvironment = useBuildingsStore((state) => state.addEnvironment);
  const addConnection = useBuildingsStore((state) => state.addConnection);
  const updateEnvironment = useBuildingsStore((state) => state.updateEnvironment);
  const updateConnection = useBuildingsStore((state) => state.updateConnection);
  const deleteEnvironment = useBuildingsStore((state) => state.deleteEnvironment);
  const deleteConnection = useBuildingsStore((state) => state.deleteConnection);

  const { state, actions } = useCanvas();
  const { result, isRunning, error, runSimulation, resetSimulation } = useSimulation();
  const canvasWrapRef = useRef<HTMLDivElement | null>(null);

  const [simMode, setSimMode] = useState(false);
  const [originId, setOriginId] = useState<string | null>(null);
  const [intensity, setIntensity] = useState<SimulationIntensity>('MEDIUM');
  const [algorithm, setAlgorithm] = useState<AlgorithmChoice>('BOTH');
  const [criteria, setCriteria] = useState<OptimizationCriteria>('BALANCED');
  const [blockedEnvironmentIds, setBlockedEnvironmentIds] = useState<string[]>([]);
  const [blockedConnectionIds, setBlockedConnectionIds] = useState<string[]>([]);
  const [pendingPosition, setPendingPosition] = useState<{ x: number; y: number } | null>(null);
  const [pendingConnection, setPendingConnection] = useState<PendingConnection | null>(null);
  const [resultTab, setResultTab] = useState<ResultTab>('ROTAS');
  const [playbackAlgorithm, setPlaybackAlgorithm] = useState<PathfindingAlgorithm>('DIJKSTRA');

  // ── Algorithm step playback (hooks must run before any early return) ──────────
  const analysis = result?.analysis ?? null;
  const availableAlgorithms = (analysis?.runs.map((run) => run.algorithm) ?? []) as PathfindingAlgorithm[];
  const activeAlgorithm = availableAlgorithms.includes(playbackAlgorithm)
    ? playbackAlgorithm
    : availableAlgorithms[0] ?? 'DIJKSTRA';
  const playbackRun = analysis?.runs.find((run) => run.algorithm === activeAlgorithm);
  const playback = useStepPlayback(playbackRun?.steps ?? []);

  if (!building || !floor) {
    return (
      <EmptyState
        icon={Layers}
        title="Planta não encontrada"
        description="Volte para o painel e abra um andar válido."
      />
    );
  }

  const selectedEnvironment = floor.environments.find((env) => env.id === state.selectedId);
  const selectedConnection = floor.connections.find((conn) => conn.id === state.selectedId);
  const instruction = instructionForMode(state.mode, state.connectionStart, simMode, originId, Boolean(result));

  const pendingFrom = floor.environments.find((env) => env.id === pendingConnection?.fromId);
  const pendingTo = floor.environments.find((env) => env.id === pendingConnection?.toId);

  const canvasBlockedEnvIds = [
    ...blockedEnvironmentIds,
    ...(originId ? [originId] : []),
  ];

  const handleCanvasClick = (position: { x: number; y: number }) => {
    if (state.mode !== 'ADD_ENV' || simMode) return;
    setPendingPosition({ x: Math.max(0, position.x - 75), y: Math.max(0, position.y - 39) });
  };

  const confirmEnvironment = (data: AddEnvironmentFormData) => {
    if (!pendingPosition) return;
    addEnvironment(floor.id, {
      name: data.name,
      type: data.type,
      capacity: data.capacity,
      isAccessible: data.isAccessible,
      occupancy: { regular: data.regular, pcd: data.pcd },
      position: pendingPosition,
    });
    setPendingPosition(null);
    actions.setMode('SELECT');
  };

  const confirmConnection = (data: AddConnectionFormData) => {
    if (!pendingConnection) return;
    addConnection(floor.id, {
      fromEnvironmentId: pendingConnection.fromId,
      toEnvironmentId: pendingConnection.toId,
      distanceMeters: data.distanceMeters,
      traversalTimeSeconds: data.traversalTimeSeconds,
      riskLevel: data.riskLevel,
      isAccessible: data.isAccessible,
      type: data.type,
    });
    setPendingConnection(null);
    actions.setConnectionStart(null);
    actions.setMode('SELECT');
  };

  const handleEnvironmentClick = (id: string) => {
    const environment = floor.environments.find((item) => item.id === id);
    if (!environment) return;

    if (simMode) {
      if (!originId) {
        setOriginId(id);
        return;
      }
      if (environment.type === 'EMERGENCY_EXIT') return;
      setBlockedEnvironmentIds((current) =>
        current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
      );
      return;
    }

    if (state.mode === 'DELETE') {
      if (environment.type !== 'EMERGENCY_EXIT') deleteEnvironment(id);
      return;
    }

    if (state.mode === 'ADD_CONNECTION') {
      if (!state.connectionStart) {
        actions.setConnectionStart(id);
      } else if (state.connectionStart !== id) {
        setPendingConnection({ fromId: state.connectionStart, toId: id });
      }
    }
  };

  const handleConnectionClick = (id: string) => {
    if (simMode) {
      setBlockedConnectionIds((current) =>
        current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
      );
      return;
    }
    if (state.mode === 'DELETE') deleteConnection(id);
  };

  const handleEndSimulation = () => {
    resetSimulation();
    setSimMode(false);
    setOriginId(null);
    setBlockedEnvironmentIds([]);
    setBlockedConnectionIds([]);
    setResultTab('ROTAS');
    actions.setMode('SELECT');
  };

  const run = async () => {
    if (!originId) return;
    setResultTab('ROTAS');
    await runSimulation({
      buildingId: building.id,
      floorId: floor.id,
      originEnvironmentId: originId,
      intensity,
      blockedEnvironmentIds,
      blockedConnectionIds,
      algorithm,
      criteria,
    });
  };

  const generatePdf = () => {
    if (!result || !canvasWrapRef.current) return;
    void generateSimulationPdf(canvasWrapRef.current, result, building, floor);
  };

  const isSimulationActive = simMode || Boolean(result);

  // ── Canvas overlays: risk zones (always with a result) + step playback ───────
  const riskZoneByEnv = result
    ? new Map<string, RiskZone>(result.riskZones.map((zone) => [zone.environmentId, zone.zone]))
    : undefined;
  const playbackActive = Boolean(result && resultTab === 'ALGORITMOS' && playbackRun && playbackRun.steps.length > 0);

  let playbackNodeState: Map<string, PlaybackNodeState> | undefined;
  let playbackPathEdges: Set<string> | undefined;
  if (playbackActive && playbackRun) {
    const step = playback.current;
    const states = new Map<string, PlaybackNodeState>();
    if (step) {
      step.visitedIds.forEach((id) => states.set(id, 'VISITED'));
      step.frontierIds.forEach((id) => states.set(id, 'FRONTIER'));
      states.set(step.currentId, 'CURRENT');
    }
    if (playback.atEnd && playbackRun.found) {
      playbackRun.path.forEach((id) => states.set(id, 'PATH'));
      playbackPathEdges = pathEdgeIds(playbackRun.path, floor.connections);
    }
    playbackNodeState = states;
  }

  return (
    <>
      {/* Breadcrumb */}
      <nav className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link to="/" className="hover:text-primary">Painel</Link>
          <span>/</span>
          <span className="font-semibold text-slate-800">{building.name}</span>
          <span>/</span>
          <span className="font-semibold text-slate-800">{floor.name}</span>
        </div>

        {isSimulationActive && (
          <button
            onClick={handleEndSimulation}
            className="inline-flex items-center gap-2 rounded-md border border-danger bg-red-50 px-4 py-2 text-sm font-bold text-danger hover:bg-red-100 transition-colors"
          >
            <StopCircle size={16} /> Encerrar Simulação
          </button>
        )}
      </nav>

      <div className="flex h-[calc(100vh-124px)] overflow-hidden rounded-lg border border-border bg-white">
        {/* Left toolbar */}
        <CanvasToolbar
          mode={state.mode}
          connectionStart={state.connectionStart}
          onModeChange={actions.setMode}
          onZoomIn={() => actions.zoom(0.1)}
          onZoomOut={() => actions.zoom(-0.1)}
          onCenter={actions.center}
          onStartSimulation={() => {
            setSimMode(true);
            actions.setMode('SIMULATION');
          }}
          simActive={isSimulationActive}
        />

        {/* Canvas area */}
        <div className="relative min-w-0 flex-1" ref={canvasWrapRef}>
          <FloorCanvas
            environments={floor.environments}
            connections={floor.connections}
            selectedId={state.selectedId}
            scale={state.scale}
            offsetX={state.offsetX}
            offsetY={state.offsetY}
            connectionStartId={state.connectionStart}
            blockedEnvironmentIds={canvasBlockedEnvIds}
            blockedConnectionIds={blockedConnectionIds}
            primaryRoutes={result?.primaryRoutes}
            alternativeRoutes={result?.alternativeRoutes}
            inaccessibleEnvironmentIds={result?.inaccessibleEnvironmentIds}
            activeExitIds={result?.exitsUsedIds}
            riskZoneByEnv={riskZoneByEnv}
            dangerOriginId={result ? result.config.originEnvironmentId : undefined}
            playbackActive={playbackActive}
            playbackNodeState={playbackNodeState}
            playbackPathEdgeIds={playbackPathEdges}
            onSelect={actions.select}
            onMoveEnvironment={(id, position) => updateEnvironment(id, { position })}
            onEnvironmentClick={handleEnvironmentClick}
            onConnectionClick={handleConnectionClick}
            onCanvasClick={handleCanvasClick}
            onWheelZoom={actions.zoom}
            onPan={actions.pan}
          />

          {instruction && (
            <p className="pointer-events-none absolute bottom-4 left-4 z-10 rounded-md bg-slate-950/80 px-3 py-2 text-sm font-semibold text-white">
              {instruction}
            </p>
          )}

          {error && (
            <p className="absolute left-4 top-4 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-danger">
              {error}
            </p>
          )}
        </div>

        {/* Right panel */}
        <aside className="w-80 overflow-auto border-l border-border bg-white p-4">
          {result ? (
            <SimulationResultPanel
              result={result}
              building={building}
              floor={floor}
              tab={resultTab}
              onTab={setResultTab}
              onPdf={generatePdf}
              onNew={handleEndSimulation}
              playback={playback}
              playbackRun={playbackRun}
              availableAlgorithms={availableAlgorithms}
              activeAlgorithm={activeAlgorithm}
              onSelectAlgorithm={setPlaybackAlgorithm}
            />
          ) : simMode ? (
            <SimulationSetupPanel
              originName={floor.environments.find((env) => env.id === originId)?.name}
              intensity={intensity}
              algorithm={algorithm}
              criteria={criteria}
              blockedCount={blockedEnvironmentIds.length + blockedConnectionIds.length}
              canRun={Boolean(originId)}
              isRunning={isRunning}
              onIntensityChange={setIntensity}
              onAlgorithmChange={setAlgorithm}
              onCriteriaChange={setCriteria}
              onRun={run}
              onClearBlocks={() => {
                setBlockedEnvironmentIds([]);
                setBlockedConnectionIds([]);
              }}
              onCancel={handleEndSimulation}
            />
          ) : selectedEnvironment ? (
            <EnvironmentEditPanel
              key={selectedEnvironment.id}
              environment={selectedEnvironment}
              onSave={updateEnvironment}
              onDelete={deleteEnvironment}
            />
          ) : selectedConnection ? (
            <ConnectionEditPanel
              key={selectedConnection.id}
              connection={selectedConnection}
              environments={floor.environments}
              onSave={updateConnection}
              onDelete={deleteConnection}
            />
          ) : (
            <div className="mt-4 space-y-2 text-sm text-slate-500">
              <p className="font-semibold text-slate-700">Dica de uso</p>
              <p>Selecione um elemento para editar suas propriedades.</p>
              <p>Use a toolbar para adicionar ambientes e conexões.</p>
              <p>Clique em "Iniciar Simulação" para calcular rotas de evacuação.</p>
            </div>
          )}
        </aside>
      </div>

      {pendingPosition && (
        <AddEnvironmentModal
          onCancel={() => setPendingPosition(null)}
          onConfirm={confirmEnvironment}
        />
      )}
      {pendingConnection && pendingFrom && pendingTo && (
        <AddConnectionModal
          fromName={pendingFrom.name}
          toName={pendingTo.name}
          onCancel={() => {
            setPendingConnection(null);
            actions.setConnectionStart(null);
          }}
          onConfirm={confirmConnection}
        />
      )}
    </>
  );
};
