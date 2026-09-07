import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import type { BuildingType } from '@/types';
import { useBuildingsStore } from '@/store/buildings.store';
import { ArrowLeft } from 'lucide-react';

const schema = z.object({
  name: z.string().min(2, 'Informe um nome com pelo menos 2 caracteres.'),
  type: z.enum(['COMMERCIAL', 'HOSPITAL', 'SCHOOL', 'RESIDENTIAL', 'INDUSTRIAL']),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
  <div>
    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
      {label}
    </label>
    {children}
    {error && <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>{error}</p>}
  </div>
);

const inputStyle = {
  width: '100%',
  height: '42px',
  borderRadius: '8px',
  border: '1.5px solid #e2e8f0',
  padding: '0 12px',
  fontSize: '14px',
  color: '#0f172a',
  background: 'white',
  outline: 'none',
  boxSizing: 'border-box' as const,
};

export const BuildingFormPage = () => {
  const addBuilding = useBuildingsStore((state) => state.addBuilding);
  const navigate = useNavigate();
  const [values, setValues] = useState<FormValues>({ name: '', type: 'COMMERCIAL', description: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map(i => [i.path.join('.'), i.message])));
      return;
    }
    addBuilding(parsed.data);
    navigate('/');
  };

  return (
    <div style={{ maxWidth: '560px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <button
          onClick={() => navigate('/')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: '12px' }}
        >
          <ArrowLeft size={15} /> Voltar ao painel
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
          Novo Edifício
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
          Preencha os dados para cadastrar o edifício no sistema.
        </p>
      </div>

      {/* Form card */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '28px' }}>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Field label="Nome do edifício" error={errors.name}>
            <input
              style={inputStyle}
              value={values.name}
              placeholder="Ex: Hospital Santa Clara"
              onChange={e => setValues(v => ({ ...v, name: e.target.value }))}
            />
          </Field>

          <Field label="Tipo">
            <select
              style={inputStyle}
              value={values.type}
              onChange={e => setValues(v => ({ ...v, type: e.target.value as BuildingType }))}
            >
              <option value="COMMERCIAL">Comercial</option>
              <option value="HOSPITAL">Hospitalar</option>
              <option value="SCHOOL">Escolar</option>
              <option value="RESIDENTIAL">Residencial</option>
              <option value="INDUSTRIAL">Industrial</option>
            </select>
          </Field>

          <Field label="Descrição (opcional)">
            <textarea
              style={{ ...inputStyle, height: 'auto', minHeight: '90px', padding: '10px 12px', resize: 'vertical' }}
              value={values.description}
              placeholder="Descreva brevemente o edifício..."
              onChange={e => setValues(v => ({ ...v, description: e.target.value }))}
            />
          </Field>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '4px' }}>
            <button
              type="button"
              onClick={() => navigate('/')}
              style={{ height: '42px', padding: '0 20px', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: 'white', fontSize: '14px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{ height: '42px', padding: '0 24px', borderRadius: '8px', border: 'none', background: '#0f172a', fontSize: '14px', fontWeight: 700, color: 'white', cursor: 'pointer' }}
            >
              Salvar Edifício
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
