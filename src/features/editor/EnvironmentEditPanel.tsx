import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { StatusBadge } from '@/components/common/StatusBadge';
import type { Environment } from '@/types';

const schema = z
  .object({
    name: z.string().min(2, 'Informe um nome com pelo menos 2 caracteres.'),
    capacity: z.coerce.number().min(1, 'A capacidade deve ser maior que zero.'),
    regular: z.coerce.number().min(0, 'Informe zero ou mais pessoas.'),
    pcd: z.coerce.number().min(0, 'Informe zero ou mais pessoas PCD.'),
    isAccessible: z.boolean(),
  })
  .refine((data) => data.regular + data.pcd <= data.capacity, {
    message: 'O total de pessoas não pode exceder a capacidade.',
    path: ['regular'],
  });

type FormData = z.infer<typeof schema>;

interface EnvironmentEditPanelProps {
  environment: Environment;
  onSave: (id: string, data: Partial<Environment>) => void;
  onDelete: (id: string) => void;
}

const typeLabels: Record<Environment['type'], string> = {
  ROOM: 'Sala',
  CORRIDOR: 'Corredor',
  STAIRCASE: 'Escada',
  ELEVATOR: 'Elevador',
  BATHROOM: 'Banheiro',
  EMERGENCY_EXIT: 'Saída de Emergência',
  MEETING_POINT: 'Ponto de Encontro',
};

export const EnvironmentEditPanel = ({ environment, onSave, onDelete }: EnvironmentEditPanelProps) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: environment.name,
      capacity: environment.capacity,
      regular: environment.occupancy.regular,
      pcd: environment.occupancy.pcd,
      isAccessible: environment.isAccessible,
    },
  });

  const submit = handleSubmit((values) => {
    onSave(environment.id, {
      name: values.name,
      capacity: values.capacity,
      isAccessible: values.isAccessible,
      occupancy: { regular: values.regular, pcd: values.pcd },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  });

  return (
    <section>
      <h2 className="text-lg font-bold">Propriedades</h2>
      <form className="mt-4 space-y-3" onSubmit={submit}>
        <StatusBadge tone="blue">{typeLabels[environment.type]}</StatusBadge>
        <label className="block text-sm font-semibold">
          Nome
          <input className="mt-1 h-10 w-full rounded-md border border-border px-3" {...register('name')} />
          {errors.name && <span className="mt-1 block text-xs text-danger">{errors.name.message}</span>}
        </label>
        <label className="block text-sm font-semibold">
          Capacidade
          <input type="number" min="1" className="mt-1 h-10 w-full rounded-md border border-border px-3" {...register('capacity')} />
          {errors.capacity && <span className="mt-1 block text-xs text-danger">{errors.capacity.message}</span>}
        </label>
        <label className="block text-sm font-semibold">
          Pessoas (regular)
          <input type="number" min="0" className="mt-1 h-10 w-full rounded-md border border-border px-3" {...register('regular')} />
          {errors.regular && <span className="mt-1 block text-xs text-danger">{errors.regular.message}</span>}
        </label>
        <label className="block text-sm font-semibold">
          Pessoas PCD
          <input type="number" min="0" className="mt-1 h-10 w-full rounded-md border border-border px-3" {...register('pcd')} />
          {errors.pcd && <span className="mt-1 block text-xs text-danger">{errors.pcd.message}</span>}
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" className="h-4 w-4" {...register('isAccessible')} />
          Acessível para PCD
        </label>
        <div className="flex gap-2 pt-2">
          <button
            className={`flex-1 rounded-md px-4 py-2 text-sm font-bold text-white transition-colors ${
              saved ? 'bg-success' : 'bg-primary'
            }`}
          >
            {saved ? '✓ Salvo' : 'Salvar'}
          </button>
          {environment.type !== 'EMERGENCY_EXIT' && (
            <button
              type="button"
              className="rounded-md border border-danger px-4 py-2 text-sm font-bold text-danger"
              onClick={() => setConfirmOpen(true)}
            >
              Excluir
            </button>
          )}
        </div>
      </form>
      {confirmOpen && (
        <ConfirmDialog
          title="Excluir ambiente"
          message="Esta ação também remove as conexões ligadas a este ambiente."
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => {
            onDelete(environment.id);
            setConfirmOpen(false);
          }}
        />
      )}
    </section>
  );
};
