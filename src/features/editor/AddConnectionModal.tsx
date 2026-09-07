import { CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ConnectionType } from '@/types';

const schema = z.object({
  type: z.enum(['DOOR', 'CORRIDOR', 'STAIRCASE', 'ELEVATOR']),
  distanceMeters: z.coerce.number().min(1, 'Distância mínima de 1 metro.').max(500, 'Distância máxima de 500 metros.'),
  traversalTimeSeconds: z.coerce.number().min(1, 'Tempo mínimo de 1 segundo.').max(300, 'Tempo máximo de 300 segundos.'),
  riskLevel: z.coerce.number().min(0).max(10),
  isAccessible: z.boolean(),
});

export type AddConnectionFormData = z.infer<typeof schema>;

interface AddConnectionModalProps {
  fromName: string;
  toName: string;
  onCancel: () => void;
  onConfirm: (data: AddConnectionFormData) => void;
}

const connectionOptions: Array<{ value: ConnectionType; label: string }> = [
  { value: 'DOOR', label: 'Porta' },
  { value: 'CORRIDOR', label: 'Corredor' },
  { value: 'STAIRCASE', label: 'Escada' },
  { value: 'ELEVATOR', label: 'Elevador' },
];

export const AddConnectionModal = ({ fromName, toName, onCancel, onConfirm }: AddConnectionModalProps) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AddConnectionFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'CORRIDOR',
      distanceMeters: 15,
      traversalTimeSeconds: 25,
      riskLevel: 2,
      isAccessible: true,
    },
  });

  const risk = watch('riskLevel');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form
        className="w-full max-w-xl rounded-lg bg-white p-6 shadow-lg"
        onSubmit={handleSubmit(onConfirm)}
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-success">
          <CheckCircle2 size={18} />
          Conectar: {fromName} → {toName}
        </div>
        <h2 className="mt-2 text-lg font-bold">Criar conexão</h2>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <label className="text-sm font-semibold">
            Tipo
            <select className="mt-1 h-10 w-full rounded-md border border-border px-3" {...register('type')}>
              {connectionOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold">
            Distância (metros)
            <input type="number" min="1" max="500" className="mt-1 h-10 w-full rounded-md border border-border px-3" {...register('distanceMeters')} />
            {errors.distanceMeters && <span className="mt-1 block text-xs text-danger">{errors.distanceMeters.message}</span>}
          </label>
          <label className="text-sm font-semibold">
            Tempo de travessia (segundos)
            <input type="number" min="1" max="300" className="mt-1 h-10 w-full rounded-md border border-border px-3" {...register('traversalTimeSeconds')} />
            {errors.traversalTimeSeconds && <span className="mt-1 block text-xs text-danger">{errors.traversalTimeSeconds.message}</span>}
          </label>
          <label className="text-sm font-semibold">
            Nível de risco: <strong>{String(risk)}</strong>
            <input type="range" min="0" max="10" className="mt-3 w-full" {...register('riskLevel')} />
          </label>
          <label className="col-span-2 flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" className="h-4 w-4" {...register('isAccessible')} />
            Acessível para PCD
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="rounded-md border border-border px-4 py-2 text-sm font-bold" onClick={onCancel}>
            Cancelar
          </button>
          <button className="rounded-md bg-primary px-4 py-2 text-sm font-bold text-white">
            Criar Conexão
          </button>
        </div>
      </form>
    </div>
  );
};
