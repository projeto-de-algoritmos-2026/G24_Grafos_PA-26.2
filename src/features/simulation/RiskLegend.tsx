import type { RiskZone } from '@/graph/weights/riskPropagation';

export const RISK_ZONE_COLORS: Record<RiskZone, string> = {
  CRITICAL: '#b91c1c',
  HIGH: '#ef4444',
  MEDIUM: '#f97316',
  LOW: '#f59e0b',
  NONE: '#e2e8f0',
};

const RISK_ZONE_LABELS: Record<RiskZone, string> = {
  CRITICAL: 'Crítico (origem)',
  HIGH: 'Alto',
  MEDIUM: 'Médio',
  LOW: 'Baixo',
  NONE: 'Sem risco',
};

const order: RiskZone[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE'];

export const RiskLegend = () => (
  <div className="flex flex-wrap gap-2 rounded-md bg-slate-50 p-3 text-[11px] font-semibold text-slate-600">
    {order.map((zone) => (
      <span key={zone} className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded-full" style={{ background: RISK_ZONE_COLORS[zone] }} />
        {RISK_ZONE_LABELS[zone]}
      </span>
    ))}
  </div>
);
