import { useRef, useState } from 'react';
import type { Connection, Environment, Route } from '@/types';
import type { RiskZone } from '@/graph/weights/riskPropagation';
import { ConnectionLine } from './ConnectionLine';
import { EnvironmentNode, type PlaybackNodeState } from './EnvironmentNode';

interface FloorCanvasProps {
  environments: Environment[];
  connections: Connection[];
  selectedId: string | null;
  scale: number;
  offsetX: number;
  offsetY: number;
  blockedEnvironmentIds?: string[];
  blockedConnectionIds?: string[];
  primaryRoutes?: Route[];
  alternativeRoutes?: Route[];
  inaccessibleEnvironmentIds?: string[];
  activeExitIds?: string[];
  connectionStartId?: string | null;
  riskZoneByEnv?: Map<string, RiskZone>;
  dangerOriginId?: string | null;
  playbackActive?: boolean;
  playbackNodeState?: Map<string, PlaybackNodeState>;
  playbackPathEdgeIds?: Set<string>;
  onSelect: (id: string | null) => void;
  onMoveEnvironment: (id: string, position: { x: number; y: number }) => void;
  onEnvironmentClick?: (id: string) => void;
  onConnectionClick?: (id: string) => void;
  onCanvasClick?: (position: { x: number; y: number }) => void;
  onWheelZoom?: (delta: number) => void;
  onPan?: (deltaX: number, deltaY: number) => void;
}

export const FloorCanvas = ({
  environments,
  connections,
  selectedId,
  scale,
  offsetX,
  offsetY,
  blockedEnvironmentIds = [],
  blockedConnectionIds = [],
  primaryRoutes = [],
  alternativeRoutes = [],
  inaccessibleEnvironmentIds = [],
  activeExitIds = [],
  connectionStartId,
  riskZoneByEnv,
  dangerOriginId,
  playbackActive = false,
  playbackNodeState,
  playbackPathEdgeIds,
  onSelect,
  onMoveEnvironment,
  onEnvironmentClick,
  onConnectionClick,
  onCanvasClick,
  onWheelZoom,
  onPan,
}: FloorCanvasProps) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const lastPointer = useRef<{ x: number; y: number } | null>(null);
  const didPan = useRef(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  const svgPoint = (event: React.PointerEvent<SVGSVGElement> | React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / scale - offsetX,
      y: (event.clientY - rect.top) / scale - offsetY,
    };
  };

  return (
    <svg
      ref={svgRef}
      className="h-full min-h-[620px] w-full bg-white"
      viewBox={`${-offsetX} ${-offsetY} ${980 / scale} ${680 / scale}`}
      onClick={(event) => {
        if (didPan.current) {
          didPan.current = false;
          return;
        }
        onSelect(null);
        onCanvasClick?.(svgPoint(event));
      }}
      onWheel={(event) => {
        event.preventDefault();
        onWheelZoom?.(event.deltaY > 0 ? -0.1 : 0.1);
      }}
      onPointerMove={(event) => {
        if (isPanning && !draggingId && lastPointer.current) {
          const deltaX = event.clientX - lastPointer.current.x;
          const deltaY = event.clientY - lastPointer.current.y;
          if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) didPan.current = true;
          onPan?.(deltaX / scale, deltaY / scale);
          lastPointer.current = { x: event.clientX, y: event.clientY };
          return;
        }
        if (!draggingId) return;
        const point = svgPoint(event);
        onMoveEnvironment(draggingId, { x: point.x - 75, y: point.y - 39 });
      }}
      onPointerUp={() => {
        setDraggingId(null);
        setIsPanning(false);
        lastPointer.current = null;
      }}
      onPointerLeave={() => {
        setDraggingId(null);
        setIsPanning(false);
        lastPointer.current = null;
      }}
    >
      <defs>
        <pattern id="dot-grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#E2E8F0" />
        </pattern>
      </defs>
      <rect
        x="-2000"
        y="-2000"
        width="4000"
        height="4000"
        fill="url(#dot-grid)"
        onPointerDown={(event) => {
          setIsPanning(true);
          lastPointer.current = { x: event.clientX, y: event.clientY };
        }}
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
      />
      {connections.map((connection) => (
        <ConnectionLine
          key={connection.id}
          connection={connection}
          environments={environments}
          selected={selectedId === connection.id}
          blocked={blockedConnectionIds.includes(connection.id)}
          primaryRoutes={primaryRoutes}
          alternativeRoutes={alternativeRoutes}
          inPlayback={playbackActive}
          onFinalPath={playbackPathEdgeIds?.has(connection.id)}
          onClick={() => {
            onSelect(connection.id);
            onConnectionClick?.(connection.id);
          }}
        />
      ))}
      {environments.map((environment) => (
        <EnvironmentNode
          key={environment.id}
          environment={environment}
          selected={selectedId === environment.id}
          blocked={blockedEnvironmentIds.includes(environment.id)}
          primary={primaryRoutes.some((route) => route.path.includes(environment.id))}
          alternative={alternativeRoutes.some((route) => route.path.includes(environment.id))}
          inaccessible={inaccessibleEnvironmentIds.includes(environment.id)}
          activeExit={activeExitIds.includes(environment.id)}
          isConnectionStart={connectionStartId === environment.id}
          riskZone={riskZoneByEnv?.get(environment.id)}
          isDangerOrigin={dangerOriginId === environment.id}
          playbackState={playbackActive ? playbackNodeState?.get(environment.id) ?? 'IDLE' : undefined}
          onPointerDown={(event) => {
            event.stopPropagation();
            setDraggingId(environment.id);
            onSelect(environment.id);
          }}
          onClick={() => {
            onSelect(environment.id);
            onEnvironmentClick?.(environment.id);
          }}
        />
      ))}
    </svg>
  );
};
