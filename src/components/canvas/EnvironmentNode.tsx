import { Bath, DoorOpen, Flame, Hospital, Landmark, Layers, LocateFixed, Users } from 'lucide-react';
import type { Environment, EnvironmentType } from '@/types';
import type { RiskZone } from '@/graph/weights/riskPropagation';
import { RISK_ZONE_COLORS } from '@/features/simulation/RiskLegend';

/** Visual state of a node during algorithm step playback. */
export type PlaybackNodeState = 'CURRENT' | 'FRONTIER' | 'VISITED' | 'PATH' | 'IDLE';

interface EnvironmentNodeProps {
  environment: Environment;
  selected?: boolean;
  blocked?: boolean;
  primary?: boolean;
  alternative?: boolean;
  inaccessible?: boolean;
  activeExit?: boolean;
  isConnectionStart?: boolean;
  riskZone?: RiskZone;
  isDangerOrigin?: boolean;
  playbackState?: PlaybackNodeState;
  onPointerDown?: (event: React.PointerEvent<SVGGElement>) => void;
  onClick?: () => void;
}

const colors: Record<EnvironmentType, { fill: string; stroke: string }> = {
  ROOM: { fill: '#DBEAFE', stroke: '#2563EB' },
  CORRIDOR: { fill: '#F1F5F9', stroke: '#94A3B8' },
  STAIRCASE: { fill: '#EDE9FE', stroke: '#7C3AED' },
  ELEVATOR: { fill: '#FEF3C7', stroke: '#D97706' },
  BATHROOM: { fill: '#F0FDFA', stroke: '#0D9488' },
  EMERGENCY_EXIT: { fill: '#DCFCE7', stroke: '#16A34A' },
  MEETING_POINT: { fill: '#E0F2FE', stroke: '#0284C7' },
};

const iconByType: Record<EnvironmentType, React.ElementType> = {
  ROOM: Users,
  CORRIDOR: LocateFixed,
  STAIRCASE: Layers,
  ELEVATOR: Landmark,
  BATHROOM: Bath,
  EMERGENCY_EXIT: DoorOpen,
  MEETING_POINT: Hospital,
};

const playbackColors: Record<PlaybackNodeState, { fill: string; stroke: string } | null> = {
  CURRENT: { fill: '#DBEAFE', stroke: '#2563EB' },
  FRONTIER: { fill: '#FEF9C3', stroke: '#F59E0B' },
  VISITED: { fill: '#F1F5F9', stroke: '#CBD5E1' },
  PATH: { fill: '#DCFCE7', stroke: '#16A34A' },
  IDLE: null,
};

export const EnvironmentNode = ({
  environment,
  selected,
  blocked,
  primary,
  alternative,
  inaccessible,
  activeExit,
  isConnectionStart,
  riskZone = 'NONE',
  isDangerOrigin,
  playbackState,
  onPointerDown,
  onClick,
}: EnvironmentNodeProps) => {
  const base = colors[environment.type];
  const playback = playbackState ? playbackColors[playbackState] : null;
  const inPlayback = Boolean(playbackState);

  const fill = playback
    ? playback.fill
    : blocked
      ? '#FEE2E2'
      : primary
        ? '#DCFCE7'
        : alternative
          ? '#FEF3C7'
          : inaccessible
            ? '#F1F5F9'
            : base.fill;
  const stroke = playback
    ? playback.stroke
    : blocked
      ? '#DC2626'
      : primary
        ? '#16A34A'
        : alternative
          ? '#D97706'
          : inaccessible
            ? '#CBD5E1'
            : base.stroke;

  const Icon = iconByType[environment.type];
  const people = environment.occupancy.regular + environment.occupancy.pcd;
  const showRiskDot = !inPlayback && riskZone !== 'NONE';
  const nodeOpacity = inPlayback && playbackState === 'IDLE' ? 0.4 : inaccessible ? 0.65 : 1;

  return (
    <g
      transform={`translate(${environment.position.x} ${environment.position.y})`}
      onPointerDown={onPointerDown}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.();
      }}
      opacity={nodeOpacity}
      className={[activeExit ? 'exit-active' : '', isConnectionStart ? 'connection-start' : ''].filter(Boolean).join(' ') || undefined}
      style={{ cursor: 'pointer' }}
      data-testid={`environment-${environment.type}`}
    >
      {/* Risk ring around the danger origin */}
      {isDangerOrigin && !inPlayback && (
        <rect x="-6" y="-6" width="162" height="90" rx="12" fill="none" stroke="#b91c1c" strokeWidth={3} strokeDasharray="7 4" />
      )}
      <rect
        width="150"
        height="78"
        rx="8"
        fill={fill}
        stroke={selected ? '#0F172A' : stroke}
        strokeWidth={selected || playbackState === 'CURRENT' ? 3 : 2}
        strokeDasharray={isConnectionStart ? '6 3' : undefined}
        filter={selected || playbackState === 'CURRENT' ? 'drop-shadow(0 8px 12px rgba(15, 23, 42, 0.18))' : undefined}
      />
      <foreignObject x="12" y="10" width="20" height="20">
        <Icon size={18} color={stroke} />
      </foreignObject>
      <text x="75" y="35" textAnchor="middle" className="fill-slate-950 text-sm font-semibold">
        {environment.name.length > 18 ? `${environment.name.slice(0, 17)}...` : environment.name}
      </text>
      <text x="75" y="56" textAnchor="middle" className="fill-slate-600 text-xs font-medium">
        {people} pessoas | cap. {environment.capacity}
      </text>

      {/* Risk indicator (overlay, so route colors stay visible) */}
      {showRiskDot && (
        <g transform="translate(138 12)">
          <circle r="9" fill={RISK_ZONE_COLORS[riskZone]} stroke="white" strokeWidth={2} />
          {isDangerOrigin && (
            <foreignObject x="-6" y="-6" width="12" height="12">
              <Flame size={12} color="white" />
            </foreignObject>
          )}
        </g>
      )}
    </g>
  );
};
