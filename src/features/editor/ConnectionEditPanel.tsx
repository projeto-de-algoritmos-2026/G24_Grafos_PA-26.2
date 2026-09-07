import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import type { Connection, Environment } from '@/types';

const schema = z.object({
  type: z.enum(['DOOR', 'CORRIDOR', 'STAIRCASE', 'ELEVATOR']),
  distanceMeters: z.coerce.number().min(1, 'Distância mínima de 1 metro.').max(500, 'Distância máxima de 500 metros.'),
  traversalTimeSeconds: z.coerce.number().min(1, 'Tempo mínimo de 1 segundo.').max(300, 'Tempo máximo de 300 segundos.'),
  riskLevel: z.coerce.number().min(0).max(10),
  isAccessible: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface ConnectionEditPanelProps {
  connection: Connection;
  environments: Environment[];
  onSave: (id: string, data: Partial<Connection>) => void;
  onDelete: (id: string) => void;
}

export const ConnectionEditPanel = ({ connection, environments, onSave, onDelete }: ConnectionEditPanelProps) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const from = environments.find((env) => env.id === connection.fromEnvironmentId);
  const to = environments.find((env) => env.id === connection.toEnvironmentId);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: connection.type,
      distanceMeters: connection.distanceMeters,
      traversalTimeSeconds: connection.traversalTimeSeconds,
      riskLevel: connection.riskLevel,
      isAccessible: connection.isAccessible,
    },
  });

  const risk = watch('riskLevel');

  const submit = handleSubmit((values) => {
    onSave(connection.id, values);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  });

  return (
    <section>
      <h2 className="text-lg font-bold">Propriedades</h2>
      <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm font-semibold text-slate-700">
        {from?.name ?? 'Origem'} → {to?.name ?? 'Destino'}
      </p>
      <form className="mt-4 space-y-3" onSubmit={submit}>
        <label className="block text-sm font-semibold">
          Tipo
          <select className="mt-1 h-10 w-full rounded-md border border-border px-3" {...register('type')}>
            <option value="DOOR">Porta</option>
            <option value="CORRIDOR">Corredor</option>
            <option value="STAIRCASE">Escada</option>
            <option value="ELEVATOR">Elevador</option>
          </select>
        </label>
        <label className="block text-sm font-semibold">
          Distância (metros)
          <input type="number" min="1" max="500" className="mt-1 h-10 w-full rounded-md border border-border px-3" {...register('distanceMeters')} />
          {errors.distanceMeters && <span className="mt-1 block text-xs text-danger">{errors.distanceMeters.message}</span>}
        </label>
        <label className="block text-sm font-semibold">
          Tempo (segundos)
          <input type="number" min="1" max="300" className="mt-1 h-10 w-full rounded-md border border-border px-3" {...register('traversalTimeSeconds')} />
          {errors.traversalTimeSeconds && <span className="mt-1 block text-xs text-danger">{errors.traversalTimeSeconds.message}</span>}
        </label>
        <label className="block text-sm font-semibold">
          Nível de risco: <strong>{String(risk)}</strong>
          <input type="range" min="0" max="10" className="mt-3 w-full" {...register('riskLevel')} />
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
          <button
            type="button"
            className="rounded-md border border-danger px-4 py-2 text-sm font-bold text-danger"
            onClick={() => setConfirmOpen(true)}
          >
            Excluir
          </button>
        </div>
      </form>
      {confirmOpen && (
        <ConfirmDialog
          title="Excluir conexão"
          message="A conexão será removida desta planta."
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => {
            onDelete(connection.id);
            setConfirmOpen(false);
          }}
        />
      )}
    </section>
  );
};
