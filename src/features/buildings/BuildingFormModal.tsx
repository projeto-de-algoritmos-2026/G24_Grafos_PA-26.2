import { useState } from 'react';
import { z } from 'zod';
import type { BuildingType } from '@/types';

const schema = z.object({
  name: z.string().min(2, 'Informe um nome com pelo menos 2 caracteres.'),
  type: z.enum(['COMMERCIAL', 'HOSPITAL', 'SCHOOL', 'RESIDENTIAL', 'INDUSTRIAL']),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface BuildingFormModalProps {
  onSubmit: (values: { name: string; type: BuildingType; description?: string }) => void;
  onClose: () => void;
}

export const BuildingFormModal = ({ onSubmit, onClose }: BuildingFormModalProps) => {
  const [values, setValues] = useState<FormValues>({ name: '', type: 'COMMERCIAL', description: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [issue.path.join('.'), issue.message])));
      return;
    }
    onSubmit(parsed.data);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30">
      <form
        className="w-full max-w-lg rounded-lg bg-white p-6 shadow-soft"
        onSubmit={submit}
      >
        <h2 className="text-lg font-bold">Novo Edifício</h2>
        <label className="mt-4 block text-sm font-semibold" htmlFor="name">Nome</label>
        <input id="name" className="mt-1 h-10 w-full rounded-md border border-border px-3" value={values.name} onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))} />
        {errors.name ? <p className="mt-1 text-sm text-danger">{errors.name}</p> : null}
        <label className="mt-4 block text-sm font-semibold" htmlFor="type">Tipo</label>
        <select id="type" className="mt-1 h-10 w-full rounded-md border border-border px-3" value={values.type} onChange={(event) => setValues((current) => ({ ...current, type: event.target.value as BuildingType }))}>
          <option value="COMMERCIAL">Comercial</option>
          <option value="HOSPITAL">Hospitalar</option>
          <option value="SCHOOL">Escolar</option>
          <option value="RESIDENTIAL">Residencial</option>
          <option value="INDUSTRIAL">Industrial</option>
        </select>
        <label className="mt-4 block text-sm font-semibold" htmlFor="description">Descrição</label>
        <textarea id="description" className="mt-1 min-h-24 w-full rounded-md border border-border px-3 py-2" value={values.description} onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))} />
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm font-bold">Cancelar</button>
          <button className="rounded-md bg-primary px-4 py-2 text-sm font-bold text-white">Salvar</button>
        </div>
      </form>
    </div>
  );
};
