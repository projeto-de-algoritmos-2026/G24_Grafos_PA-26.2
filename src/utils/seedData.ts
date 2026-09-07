import type { Building } from '@/types';
import { demoBuilding } from './demoScenarios';

const now = new Date().toISOString();

export const seedBuildings: Building[] = [
  demoBuilding,
  {
    id: 'building_hospital_santa_clara',
    name: 'Hospital Santa Clara',
    type: 'HOSPITAL',
    description: 'Unidade hospitalar com áreas de atendimento, internação e cirurgia.',
    createdAt: now,
    updatedAt: now,
    floors: [
      {
        id: 'floor_hsc_terreo',
        number: 0,
        name: 'Terreo',
        environments: [
          { id: 'env_recepcao', name: 'Recepcao', type: 'ROOM', capacity: 70, isAccessible: true, occupancy: { regular: 45, pcd: 5 }, position: { x: 120, y: 210 } },
          { id: 'env_corredor_principal', name: 'Corredor Principal', type: 'CORRIDOR', capacity: 100, isAccessible: true, occupancy: { regular: 0, pcd: 0 }, position: { x: 330, y: 210 } },
          { id: 'env_sala_espera', name: 'Sala de Espera', type: 'ROOM', capacity: 45, isAccessible: true, occupancy: { regular: 27, pcd: 3 }, position: { x: 330, y: 80 } },
          { id: 'env_farmacia', name: 'Farmacia', type: 'ROOM', capacity: 18, isAccessible: true, occupancy: { regular: 10, pcd: 0 }, position: { x: 540, y: 85 } },
          { id: 'env_escada_1_t', name: 'Escada 1', type: 'STAIRCASE', capacity: 40, isAccessible: false, occupancy: { regular: 0, pcd: 0 }, position: { x: 540, y: 330 } },
          { id: 'env_saida_principal', name: 'Saída Principal', type: 'EMERGENCY_EXIT', capacity: 200, isAccessible: true, occupancy: { regular: 0, pcd: 0 }, position: { x: 80, y: 400 } },
          { id: 'env_saida_lateral', name: 'Saída Lateral', type: 'EMERGENCY_EXIT', capacity: 140, isAccessible: true, occupancy: { regular: 0, pcd: 0 }, position: { x: 740, y: 205 } },
        ],
        connections: [
          { id: 'conn_rec_cor', fromEnvironmentId: 'env_recepcao', toEnvironmentId: 'env_corredor_principal', distanceMeters: 18, traversalTimeSeconds: 24, riskLevel: 2, isAccessible: true, type: 'CORRIDOR' },
          { id: 'conn_cor_sala', fromEnvironmentId: 'env_corredor_principal', toEnvironmentId: 'env_sala_espera', distanceMeters: 12, traversalTimeSeconds: 18, riskLevel: 1, isAccessible: true, type: 'DOOR' },
          { id: 'conn_cor_farm', fromEnvironmentId: 'env_corredor_principal', toEnvironmentId: 'env_farmacia', distanceMeters: 22, traversalTimeSeconds: 30, riskLevel: 2, isAccessible: true, type: 'DOOR' },
          { id: 'conn_cor_esc', fromEnvironmentId: 'env_corredor_principal', toEnvironmentId: 'env_escada_1_t', distanceMeters: 20, traversalTimeSeconds: 35, riskLevel: 3, isAccessible: false, type: 'STAIRCASE' },
          { id: 'conn_rec_saida', fromEnvironmentId: 'env_recepcao', toEnvironmentId: 'env_saida_principal', distanceMeters: 15, traversalTimeSeconds: 18, riskLevel: 1, isAccessible: true, type: 'DOOR' },
          { id: 'conn_cor_lateral', fromEnvironmentId: 'env_corredor_principal', toEnvironmentId: 'env_saida_lateral', distanceMeters: 32, traversalTimeSeconds: 42, riskLevel: 2, isAccessible: true, type: 'CORRIDOR' },
        ],
      },
      {
        id: 'floor_hsc_1',
        number: 1,
        name: 'Andar 1',
        environments: [
          { id: 'env_corredor_norte', name: 'Corredor Norte', type: 'CORRIDOR', capacity: 90, isAccessible: true, occupancy: { regular: 0, pcd: 0 }, position: { x: 310, y: 210 } },
          { id: 'env_uti', name: 'UTI', type: 'ROOM', capacity: 25, isAccessible: true, occupancy: { regular: 16, pcd: 4 }, position: { x: 110, y: 110 } },
          { id: 'env_cirurgia', name: 'Sala de Cirurgia', type: 'ROOM', capacity: 16, isAccessible: true, occupancy: { regular: 8, pcd: 0 }, position: { x: 520, y: 90 } },
          { id: 'env_enfermaria', name: 'Enfermaria', type: 'ROOM', capacity: 30, isAccessible: true, occupancy: { regular: 13, pcd: 2 }, position: { x: 520, y: 320 } },
          { id: 'env_escada_1_a1', name: 'Escada 1', type: 'STAIRCASE', capacity: 45, isAccessible: false, occupancy: { regular: 0, pcd: 0 }, position: { x: 115, y: 330 } },
          { id: 'env_saida_norte', name: 'Saída Norte', type: 'EMERGENCY_EXIT', capacity: 120, isAccessible: true, occupancy: { regular: 0, pcd: 0 }, position: { x: 745, y: 205 } },
        ],
        connections: [
          { id: 'conn_norte_uti', fromEnvironmentId: 'env_corredor_norte', toEnvironmentId: 'env_uti', distanceMeters: 21, traversalTimeSeconds: 34, riskLevel: 2, isAccessible: true, type: 'DOOR' },
          { id: 'conn_norte_cirurgia', fromEnvironmentId: 'env_corredor_norte', toEnvironmentId: 'env_cirurgia', distanceMeters: 25, traversalTimeSeconds: 38, riskLevel: 2, isAccessible: true, type: 'DOOR' },
          { id: 'conn_norte_enfermaria', fromEnvironmentId: 'env_corredor_norte', toEnvironmentId: 'env_enfermaria', distanceMeters: 24, traversalTimeSeconds: 35, riskLevel: 2, isAccessible: true, type: 'DOOR' },
          { id: 'conn_norte_escada', fromEnvironmentId: 'env_corredor_norte', toEnvironmentId: 'env_escada_1_a1', distanceMeters: 18, traversalTimeSeconds: 40, riskLevel: 3, isAccessible: false, type: 'STAIRCASE' },
          { id: 'conn_norte_saida', fromEnvironmentId: 'env_corredor_norte', toEnvironmentId: 'env_saida_norte', distanceMeters: 34, traversalTimeSeconds: 45, riskLevel: 2, isAccessible: true, type: 'CORRIDOR' },
        ],
      },
    ],
  },
  {
    id: 'building_escola_boa_vista',
    name: 'Escola Municipal Boa Vista',
    type: 'SCHOOL',
    description: 'Escola de um pavimento com salas conectadas por corredor central.',
    createdAt: now,
    updatedAt: now,
    floors: [
      {
        id: 'floor_embv_terreo',
        number: 0,
        name: 'Terreo',
        environments: [
          { id: 'env_sala_a', name: 'Sala A', type: 'ROOM', capacity: 35, isAccessible: true, occupancy: { regular: 31, pcd: 1 }, position: { x: 120, y: 105 } },
          { id: 'env_sala_b', name: 'Sala B', type: 'ROOM', capacity: 35, isAccessible: true, occupancy: { regular: 30, pcd: 0 }, position: { x: 120, y: 320 } },
          { id: 'env_corredor_escola', name: 'Corredor Central', type: 'CORRIDOR', capacity: 120, isAccessible: true, occupancy: { regular: 0, pcd: 0 }, position: { x: 350, y: 210 } },
          { id: 'env_banheiro_escola', name: 'Banheiros', type: 'BATHROOM', capacity: 12, isAccessible: true, occupancy: { regular: 4, pcd: 0 }, position: { x: 555, y: 95 } },
          { id: 'env_patio', name: 'Patio Seguro', type: 'MEETING_POINT', capacity: 180, isAccessible: true, occupancy: { regular: 0, pcd: 0 }, position: { x: 720, y: 330 } },
          { id: 'env_saida_escola', name: 'Saída Principal', type: 'EMERGENCY_EXIT', capacity: 180, isAccessible: true, occupancy: { regular: 0, pcd: 0 }, position: { x: 735, y: 210 } },
        ],
        connections: [
          { id: 'conn_salaa_cor', fromEnvironmentId: 'env_sala_a', toEnvironmentId: 'env_corredor_escola', distanceMeters: 18, traversalTimeSeconds: 25, riskLevel: 1, isAccessible: true, type: 'DOOR' },
          { id: 'conn_salab_cor', fromEnvironmentId: 'env_sala_b', toEnvironmentId: 'env_corredor_escola', distanceMeters: 18, traversalTimeSeconds: 25, riskLevel: 1, isAccessible: true, type: 'DOOR' },
          { id: 'conn_banh_cor', fromEnvironmentId: 'env_banheiro_escola', toEnvironmentId: 'env_corredor_escola', distanceMeters: 14, traversalTimeSeconds: 18, riskLevel: 1, isAccessible: true, type: 'DOOR' },
          { id: 'conn_cor_saida_escola', fromEnvironmentId: 'env_corredor_escola', toEnvironmentId: 'env_saida_escola', distanceMeters: 28, traversalTimeSeconds: 34, riskLevel: 1, isAccessible: true, type: 'CORRIDOR' },
          { id: 'conn_saida_patio', fromEnvironmentId: 'env_saida_escola', toEnvironmentId: 'env_patio', distanceMeters: 12, traversalTimeSeconds: 16, riskLevel: 0, isAccessible: true, type: 'CORRIDOR' },
        ],
      },
    ],
  },
];
