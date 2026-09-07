import type { BuildingType, EnvironmentType, SimulationIntensity } from '@/types';

export const buildingTypeLabels: Record<BuildingType, string> = {
  COMMERCIAL: 'Comercial',
  HOSPITAL: 'Hospitalar',
  SCHOOL: 'Escolar',
  RESIDENTIAL: 'Residencial',
  INDUSTRIAL: 'Industrial',
};

export const environmentTypeLabels: Record<EnvironmentType, string> = {
  ROOM: 'Sala',
  CORRIDOR: 'Corredor',
  STAIRCASE: 'Escada',
  ELEVATOR: 'Elevador',
  BATHROOM: 'Banheiro',
  EMERGENCY_EXIT: 'Saida de Emergencia',
  MEETING_POINT: 'Ponto de Encontro',
};

export const intensityLabels: Record<SimulationIntensity, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Critica',
};

export const formatSeconds = (seconds: number): string => {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  return `${minutes}min ${rest}s`;
};

export const formatDateTime = (value: string): string =>
  new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
