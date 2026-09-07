import { Link } from 'react-router-dom';
import type { Building } from '@/types';
import { buildingTypeLabels } from '@/utils/format';
import { StatusBadge } from '@/components/common/StatusBadge';

interface BuildingCardProps {
  building: Building;
  onDelete: () => void;
}

export const BuildingCard = ({ building, onDelete }: BuildingCardProps) => {
  const environments = building.floors.flatMap((floor) => floor.environments);
  const people = environments.reduce((total, env) => total + env.occupancy.regular + env.occupancy.pcd, 0);
  return (
    <article className="rounded-lg border border-border bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{building.name}</h2>
          <p className="mt-1 text-base text-slate-500">{building.description || 'Sem descricao'}</p>
        </div>
        <StatusBadge tone="blue">{buildingTypeLabels[building.type]}</StatusBadge>
      </div>
      <dl className="mt-5 grid grid-cols-3 gap-3 text-base">
        <div><dt className="text-slate-500">Andares</dt><dd className="font-bold text-lg">{building.floors.length}</dd></div>
        <div><dt className="text-slate-500">Ambientes</dt><dd className="font-bold text-lg">{environments.length}</dd></div>
        <div><dt className="text-slate-500">Pessoas</dt><dd className="font-bold text-lg">{people}</dd></div>
      </dl>
      <div className="mt-5 flex gap-2">
        <Link to={`/buildings/${building.id}`} className="rounded-md bg-primary px-4 py-2 text-base font-bold text-white">Abrir</Link>
        <button onClick={onDelete} className="rounded-md border border-border px-4 py-2 text-base font-bold text-slate-700">Excluir</button>
      </div>
    </article>
  );
};
