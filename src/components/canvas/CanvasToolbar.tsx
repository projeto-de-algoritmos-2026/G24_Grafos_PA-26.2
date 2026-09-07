import { CheckCircle2, GitBranch, Maximize, MousePointer2, PlusSquare, ShieldCheck, Trash2, ZoomIn, ZoomOut } from 'lucide-react';
import type { CanvasMode } from '@/hooks/useCanvas';

interface CanvasToolbarProps {
  mode: CanvasMode;
  onModeChange: (mode: CanvasMode) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onCenter: () => void;
  onStartSimulation: () => void;
  connectionStart: string | null;
  simActive?: boolean;
}

const tools = [
  { mode: 'SELECT' as const, label: 'Selecionar', icon: MousePointer2 },
  { mode: 'ADD_ENV' as const, label: 'Ambiente', icon: PlusSquare },
  { mode: 'ADD_CONNECTION' as const, label: 'Conexão', icon: GitBranch },
  { mode: 'DELETE' as const, label: 'Excluir', icon: Trash2 },
];

export const CanvasToolbar = ({ mode, onModeChange, onZoomIn, onZoomOut, onCenter, onStartSimulation, connectionStart, simActive }: CanvasToolbarProps) => (
  <aside className="w-60 border-r border-border bg-white p-4">
    <div className="space-y-2">
      {tools.map(({ mode: toolMode, label, icon: Icon }) => (
        <button
          key={toolMode}
          className={`flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm font-semibold ${
            mode === toolMode ? 'bg-blue-50 text-primary' : 'text-slate-600 hover:bg-slate-50'
          } disabled:opacity-40`}
          onClick={() => onModeChange(toolMode)}
          title={label}
          disabled={simActive}
        >
          <Icon size={18} /> {label}
        </button>
      ))}
    </div>
    {mode === 'ADD_CONNECTION' ? (
      <p className="mt-3 flex items-center gap-2 rounded-md bg-blue-50 p-3 text-xs font-semibold text-primary">
        {connectionStart ? <CheckCircle2 size={16} className="text-success" /> : <GitBranch size={16} />}
        {connectionStart ? 'Agora clique no destino' : 'Clique no ambiente de origem'}
      </p>
    ) : null}
    <div className="my-4 border-t border-border" />
    <div className="grid grid-cols-3 gap-2">
      <button className="grid h-10 place-items-center rounded-md border border-border" onClick={onZoomOut} title="Reduzir zoom"><ZoomOut size={18} /></button>
      <button className="grid h-10 place-items-center rounded-md border border-border" onClick={onCenter} title="Centralizar"><Maximize size={18} /></button>
      <button className="grid h-10 place-items-center rounded-md border border-border" onClick={onZoomIn} title="Ampliar zoom"><ZoomIn size={18} /></button>
    </div>
    {!simActive && (
      <>
        <div className="my-4 border-t border-border" />
        <button
          className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-success text-sm font-bold text-white hover:opacity-90 transition-opacity"
          onClick={onStartSimulation}
        >
          <ShieldCheck size={18} /> Iniciar Simulação
        </button>
      </>
    )}
  </aside>
);
