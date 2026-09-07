import type { Environment } from '@/types';
import type { InfrastructureCandidateEdge } from '@/types/infrastructure.types';

interface Props {
  environments: Environment[];
  candidates: InfrastructureCandidateEdge[];
  /** Ids of the candidate edges chosen by the MST — drawn as solid highlighted links. */
  selectedEdgeIds: Set<string>;
  /** Whether a plan has run yet (before running, all candidates are drawn neutrally). */
  hasPlan: boolean;
}

const center = (environment: Environment) => ({ x: environment.position.x + 75, y: environment.position.y + 39 });

export const InfrastructureCanvas = ({ environments, candidates, selectedEdgeIds, hasPlan }: Props) => {
  const byId = new Map(environments.map((environment) => [environment.id, environment]));

  return (
    <svg className="h-full min-h-[560px] w-full bg-white" viewBox="0 0 980 680">
      <defs>
        <pattern id="infra-dot-grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#E2E8F0" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="980" height="680" fill="url(#infra-dot-grid)" />

      {/* Candidate edges */}
      {candidates.map((edge) => {
        const from = byId.get(edge.fromEnvironmentId);
        const to = byId.get(edge.toEnvironmentId);
        if (!from || !to) return null;
        const start = center(from);
        const end = center(to);
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        const selected = selectedEdgeIds.has(edge.id);
        const rejected = hasPlan && !selected;
        const stroke = selected ? '#16A34A' : rejected ? '#CBD5E1' : '#93C5FD';

        return (
          <g key={edge.id} opacity={rejected ? 0.6 : 1}>
            <line
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke={stroke}
              strokeWidth={selected ? 6 : 3}
              strokeLinecap="round"
              strokeDasharray={rejected ? '6 6' : undefined}
            />
            <rect x={midX - 26} y={midY - 11} width="52" height="22" rx="6" fill="white" stroke={selected ? '#16A34A' : '#E2E8F0'} />
            <text x={midX} y={midY + 4} textAnchor="middle" className={selected ? 'fill-green-700 text-xs font-bold' : 'fill-slate-500 text-xs font-semibold'}>
              R$ {edge.installationCost}
            </text>
          </g>
        );
      })}

      {/* Nodes */}
      {environments.map((environment) => (
        <g key={environment.id} transform={`translate(${environment.position.x} ${environment.position.y})`}>
          <rect width="150" height="78" rx="8" fill="#EFF6FF" stroke="#2563EB" strokeWidth={2} />
          <text x="75" y="44" textAnchor="middle" className="fill-slate-900 text-sm font-semibold">
            {environment.name.length > 18 ? `${environment.name.slice(0, 17)}...` : environment.name}
          </text>
        </g>
      ))}
    </svg>
  );
};
