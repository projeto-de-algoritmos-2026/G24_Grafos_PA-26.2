import { Layers, Plus } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useBuildingsStore } from '@/store/buildings.store';
import { buildingTypeLabels } from '@/utils/format';

export const BuildingDetailPage = () => {
  const { buildingId } = useParams();
  const building = useBuildingsStore((state) => state.getBuildingById(buildingId ?? ''));
  const addFloor = useBuildingsStore((state) => state.addFloor);
  const deleteFloor = useBuildingsStore((state) => state.deleteFloor);

  if (!building) return <EmptyState icon={Layers} title="Edifício não encontrado" description="Volte para a lista e selecione outro cadastro." />;

  const createFloor = () => {
    const nextNumber = building.floors.length;
    addFloor(building.id, { number: nextNumber, name: nextNumber === 0 ? 'Terreo' : `Andar ${nextNumber}` });
  };

  return (
    <div>
      <PageHeader
        title={building.name}
        subtitle={building.description}
        actions={<button className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-bold text-white" onClick={createFloor}><Plus size={18} /> Adicionar Andar</button>}
      />
      <StatusBadge tone="blue">{buildingTypeLabels[building.type]}</StatusBadge>
      <div className="mt-5 grid grid-cols-2 gap-4">
        {building.floors.map((floor) => {
          const people = floor.environments.reduce((total, env) => total + env.occupancy.regular + env.occupancy.pcd, 0);
          return (
            <article key={floor.id} className="rounded-lg border border-border bg-white p-5">
              <h2 className="text-lg font-bold">Andar {floor.number} - {floor.name}</h2>
              <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <div><dt className="text-slate-500">Ambientes</dt><dd className="font-bold">{floor.environments.length}</dd></div>
                <div><dt className="text-slate-500">Conexões</dt><dd className="font-bold">{floor.connections.length}</dd></div>
                <div><dt className="text-slate-500">Pessoas</dt><dd className="font-bold">{people}</dd></div>
              </dl>
              <div className="mt-5 flex gap-2">
                <Link to={`/buildings/${building.id}/floors/${floor.id}`} className="rounded-md bg-primary px-4 py-2 text-sm font-bold text-white">Abrir Planta</Link>
                <button className="rounded-md border border-border px-4 py-2 text-sm font-bold" onClick={() => deleteFloor(floor.id)}>Excluir Andar</button>
              </div>
            </article>
          );
        })}
      </div>
      {building.floors.length === 0 ? <div className="mt-5"><EmptyState icon={Layers} title="Este edificio ainda nao tem andares" description="Adicione o primeiro andar para montar a planta." /></div> : null}
    </div>
  );
};
