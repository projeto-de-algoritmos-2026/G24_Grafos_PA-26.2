import { useMemo, useState } from 'react';

export type CanvasMode = 'SELECT' | 'ADD_ENV' | 'ADD_CONNECTION' | 'DELETE' | 'SIMULATION';

export interface CanvasState {
  scale: number;
  offsetX: number;
  offsetY: number;
  selectedId: string | null;
  hoveredId: string | null;
  mode: CanvasMode;
  connectionStart: string | null;
}

export const useCanvas = () => {
  const [state, setState] = useState<CanvasState>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    selectedId: null,
    hoveredId: null,
    mode: 'SELECT',
    connectionStart: null,
  });

  const actions = useMemo(
    () => ({
      setMode: (mode: CanvasMode) => setState((current) => ({ ...current, mode, connectionStart: null })),
      select: (selectedId: string | null) => setState((current) => ({ ...current, selectedId })),
      hover: (hoveredId: string | null) => setState((current) => ({ ...current, hoveredId })),
      zoom: (delta: number) => setState((current) => ({ ...current, scale: Math.min(2, Math.max(0.5, current.scale + delta)) })),
      pan: (deltaX: number, deltaY: number) => setState((current) => ({ ...current, offsetX: current.offsetX + deltaX, offsetY: current.offsetY + deltaY })),
      center: () => setState((current) => ({ ...current, scale: 1, offsetX: 0, offsetY: 0 })),
      setConnectionStart: (connectionStart: string | null) => setState((current) => ({ ...current, connectionStart })),
    }),
    [],
  );

  return { state, actions };
};
