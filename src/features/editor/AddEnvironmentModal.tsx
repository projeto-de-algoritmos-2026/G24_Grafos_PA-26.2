import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { EnvironmentType } from '@/types';

const schema = z
  .object({
    name: z.string().min(2, 'Informe um nome com pelo menos 2 caracteres.'),
    type: z.enum(['ROOM', 'CORRIDOR', 'STAIRCASE', 'ELEVATOR', 'BATHROOM', 'EMERGENCY_EXIT', 'MEETING_POINT']),
    capacity: z.coerce.number().min(1, 'A capacidade deve ser maior que zero.'),
    regular: z.coerce.number().min(0, 'Informe zero ou mais pessoas.'),
    pcd: z.coerce.number().min(0, 'Informe zero ou mais pessoas PCD.'),
    isAccessible: z.boolean(),
  })
  .refine((data) => data.regular + data.pcd <= data.capacity, {
    message: 'O total de pessoas não pode exceder a capacidade.',
    path: ['regular'],
  });

export type AddEnvironmentFormData = z.infer<typeof schema>;

interface AddEnvironmentModalProps {
  onCancel: () => void;
  onConfirm: (data: AddEnvironmentFormData) => void;
}

const environmentOptions: Array<{ value: EnvironmentType; label: string }> = [
  { value: 'ROOM', label: 'Sala' },
  { value: 'CORRIDOR', label: 'Corredor' },
  { value: 'STAIRCASE', label: 'Escada' },
  { value: 'ELEVATOR', label: 'Elevador' },
  { value: 'BATHROOM', label: 'Banheiro' },
  { value: 'EMERGENCY_EXIT', label: 'Saída de Emergência' },
  { value: 'MEETING_POINT', label: 'Ponto de Encontro' },
];

export const AddEnvironmentModal = ({ onCancel, onConfirm }: AddEnvironmentModalProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddEnvironmentFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      type: 'ROOM',
      capacity: 30,
      regular: 0,
      pcd: 0,
      isAccessible: true,
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form
        className="w-full max-w-xl rounded-lg bg-white p-6 shadow-lg"
        onSubmit={handleSubmit(onConfirm)}
      >
        <h2 className="text-lg font-bold">Adicionar ambiente</h2>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <label className="col-span-2 text-sm font-semibold">
            Nome
            <input className="mt-1 h-10 w-full rounded-md border border-border px-3" {...register('name')} />
            {errors.name && <span className="mt-1 block text-xs text-danger">{errors.name.message}</span>}
          </label>
          <label className="text-sm font-semibold">
            Tipo
            <select className="mt-1 h-10 w-full rounded-md border border-border px-3" {...register('type')}>
              {environmentOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold">
            Capacidade
            <input type="number" min="1" className="mt-1 h-10 w-full rounded-md border border-border px-3" {...register('capacity')} />
            {errors.capacity && <span className="mt-1 block text-xs text-danger">{errors.capacity.message}</span>}
          </label>
          <label className="text-sm font-semibold">
            Pessoas (regular)
            <input type="number" min="0" className="mt-1 h-10 w-full rounded-md border border-border px-3" {...register('regular')} />
            {errors.regular && <span className="mt-1 block text-xs text-danger">{errors.regular.message}</span>}
          </label>
          <label className="text-sm font-semibold">
            Pessoas PCD
            <input type="number" min="0" className="mt-1 h-10 w-full rounded-md border border-border px-3" {...register('pcd')} />
            {errors.pcd && <span className="mt-1 block text-xs text-danger">{errors.pcd.message}</span>}
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
            Adicionar
          </button>
        </div>
      </form>
    </div>
  );
};
