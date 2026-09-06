import { create } from 'zustand';
import type { SimulationResult } from '@/types';

interface SimulationStore {
  activeSimulation: SimulationResult | null;
  setActiveSimulation: (result: SimulationResult | null) => void;
  clearSimulation: () => void;
}

export const useSimulationStore = create<SimulationStore>()((set) => ({
  activeSimulation: null,
  setActiveSimulation: (result) => set({ activeSimulation: result }),
  clearSimulation: () => set({ activeSimulation: null }),
}));
