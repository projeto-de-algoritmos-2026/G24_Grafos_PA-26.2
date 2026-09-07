import { Building2, Plus } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { useBuildingsStore } from '@/store/buildings.store';
import { BuildingCard } from './BuildingCard';
import { BuildingFormModal } from './BuildingFormModal';

export const BuildingsPage = () => {
  const buildings = useBuildingsStore((state) => state.buildings);
  const addBuilding = useBuildingsStore((state) => state.addBuilding);
  const deleteBuilding = useBuildingsStore((state) => state.deleteBuilding);
  const [open, setOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Edifícios"
        subtitle="Gerencie plantas e andares usados nas simulacoes."
        actions={<button className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-base font-bold text-white" onClick={() => setOpen(true)}><Plus size={18} /> Novo Edifício</button>}
      />
      {buildings.length === 0 ? (
        <EmptyState icon={Building2} title="Comece cadastrando seu primeiro edificio" description="Depois voce podera configurar andares, ambientes e rotas de evacuacao." />
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {buildings.map((building) => <BuildingCard key={building.id} building={building} onDelete={() => deleteBuilding(building.id)} />)}
        </div>
      )}
      {open ? <BuildingFormModal onClose={() => setOpen(false)} onSubmit={(values) => { addBuilding(values); setOpen(false); }} /> : null}
    </div>
  );
};
