import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Building, Connection, Environment, Floor } from '@/types';
import { createId } from '@/utils/id';
import { seedBuildings } from '@/utils/seedData';

interface BuildingsStore {
  buildings: Building[];
  addBuilding: (data: Omit<Building, 'id' | 'floors' | 'createdAt' | 'updatedAt'>) => string;
  updateBuilding: (id: string, data: Partial<Building>) => void;
  deleteBuilding: (id: string) => void;
  addFloor: (buildingId: string, floor: Omit<Floor, 'id' | 'environments' | 'connections'>) => string;
  deleteFloor: (floorId: string) => void;
  addEnvironment: (floorId: string, env: Omit<Environment, 'id'>) => string;
  updateEnvironment: (envId: string, data: Partial<Environment>) => void;
  deleteEnvironment: (envId: string) => void;
  addConnection: (floorId: string, conn: Omit<Connection, 'id'>) => string;
  updateConnection: (connId: string, data: Partial<Connection>) => void;
  deleteConnection: (connId: string) => void;
  getBuildingById: (id: string) => Building | undefined;
  getFloorById: (id: string) => Floor | undefined;
}

const touchBuilding = (building: Building): Building => ({ ...building, updatedAt: new Date().toISOString() });

export const useBuildingsStore = create<BuildingsStore>()(
  persist(
    (set, get) => ({
      buildings: seedBuildings,
      addBuilding: (data) => {
        const id = createId('building');
        const now = new Date().toISOString();
        set((state) => ({
          buildings: [...state.buildings, { ...data, id, floors: [], createdAt: now, updatedAt: now }],
        }));
        return id;
      },
      updateBuilding: (id, data) =>
        set((state) => ({
          buildings: state.buildings.map((building) => (building.id === id ? touchBuilding({ ...building, ...data }) : building)),
        })),
      deleteBuilding: (id) => set((state) => ({ buildings: state.buildings.filter((building) => building.id !== id) })),
      addFloor: (buildingId, floor) => {
        const id = createId('floor');
        set((state) => ({
          buildings: state.buildings.map((building) =>
            building.id === buildingId
              ? touchBuilding({ ...building, floors: [...building.floors, { ...floor, id, environments: [], connections: [] }] })
              : building,
          ),
        }));
        return id;
      },
      deleteFloor: (floorId) =>
        set((state) => ({
          buildings: state.buildings.map((building) =>
            building.floors.some((floor) => floor.id === floorId)
              ? touchBuilding({ ...building, floors: building.floors.filter((floor) => floor.id !== floorId) })
              : building,
          ),
        })),
      addEnvironment: (floorId, env) => {
        const id = createId('env');
        set((state) => ({
          buildings: state.buildings.map((building) =>
            touchBuilding({
              ...building,
              floors: building.floors.map((floor) =>
                floor.id === floorId ? { ...floor, environments: [...floor.environments, { ...env, id }] } : floor,
              ),
            }),
          ),
        }));
        return id;
      },
      updateEnvironment: (envId, data) =>
        set((state) => ({
          buildings: state.buildings.map((building) =>
            touchBuilding({
              ...building,
              floors: building.floors.map((floor) => ({
                ...floor,
                environments: floor.environments.map((env) => (env.id === envId ? { ...env, ...data } : env)),
              })),
            }),
          ),
        })),
      deleteEnvironment: (envId) =>
        set((state) => ({
          buildings: state.buildings.map((building) =>
            touchBuilding({
              ...building,
              floors: building.floors.map((floor) => ({
                ...floor,
                environments: floor.environments.filter((env) => env.id !== envId),
                connections: floor.connections.filter((conn) => conn.fromEnvironmentId !== envId && conn.toEnvironmentId !== envId),
              })),
            }),
          ),
        })),
      addConnection: (floorId, conn) => {
        const id = createId('conn');
        set((state) => ({
          buildings: state.buildings.map((building) =>
            touchBuilding({
              ...building,
              floors: building.floors.map((floor) =>
                floor.id === floorId ? { ...floor, connections: [...floor.connections, { ...conn, id }] } : floor,
              ),
            }),
          ),
        }));
        return id;
      },
      updateConnection: (connId, data) =>
        set((state) => ({
          buildings: state.buildings.map((building) =>
            touchBuilding({
              ...building,
              floors: building.floors.map((floor) => ({
                ...floor,
                connections: floor.connections.map((conn) => (conn.id === connId ? { ...conn, ...data } : conn)),
              })),
            }),
          ),
        })),
      deleteConnection: (connId) =>
        set((state) => ({
          buildings: state.buildings.map((building) =>
            touchBuilding({
              ...building,
              floors: building.floors.map((floor) => ({ ...floor, connections: floor.connections.filter((conn) => conn.id !== connId) })),
            }),
          ),
        })),
      getBuildingById: (id) => get().buildings.find((building) => building.id === id),
      getFloorById: (id) => get().buildings.flatMap((building) => building.floors).find((floor) => floor.id === id),
    }),
    { name: 'exitpath-buildings' },
  ),
);
