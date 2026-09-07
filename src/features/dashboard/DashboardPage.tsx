import { useState } from 'react';
import { Building2, Layers, Users, DoorOpen, Plus, X, Play, AlertCircle, ChevronRight, Stethoscope, GraduationCap, Home, Factory, Briefcase } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useBuildingsStore } from '@/store/buildings.store';
import { buildingTypeLabels } from '@/utils/format';
import type { BuildingType } from '@/types';

// ── Building type visual config ───────────────────────────────────────────────
const buildingVisual: Record<BuildingType, {
  Icon: React.ElementType;
  bg: string;
  iconColor: string;
  badgeBg: string;
  badgeColor: string;
  badgeBorder: string;
  illustration: string; // emoji / SVG symbol
}> = {
  HOSPITAL: {
    Icon: Stethoscope,
    bg: '#fef2f2',
    iconColor: '#dc2626',
    badgeBg: '#fef2f2',
    badgeColor: '#dc2626',
    badgeBorder: '#fecaca',
    illustration: '🏥',
  },
  SCHOOL: {
    Icon: GraduationCap,
    bg: '#eff6ff',
    iconColor: '#2563eb',
    badgeBg: '#eff6ff',
    badgeColor: '#2563eb',
    badgeBorder: '#bfdbfe',
    illustration: '🏫',
  },
  RESIDENTIAL: {
    Icon: Home,
    bg: '#f0fdf4',
    iconColor: '#16a34a',
    badgeBg: '#f0fdf4',
    badgeColor: '#16a34a',
    badgeBorder: '#bbf7d0',
    illustration: '🏘️',
  },
  INDUSTRIAL: {
    Icon: Factory,
    bg: '#fefce8',
    iconColor: '#ca8a04',
    badgeBg: '#fefce8',
    badgeColor: '#ca8a04',
    badgeBorder: '#fde68a',
    illustration: '🏭',
  },
  COMMERCIAL: {
    Icon: Briefcase,
    bg: '#f5f3ff',
    iconColor: '#7c3aed',
    badgeBg: '#f5f3ff',
    badgeColor: '#7c3aed',
    badgeBorder: '#ddd6fe',
    illustration: '🏢',
  },
};

// ── KPI Card ──────────────────────────────────────────────────────────────────
const KpiCard = ({
  label,
  sublabel,
  value,
  icon: Icon,
  iconColor,
  iconBg,
}: {
  label: string;
  sublabel: string;
  value: number;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}) => (
  <div
    style={{
      background: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: '16px',
      padding: '28px 28px',
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}
  >
    <div
      style={{
        width: '60px',
        height: '60px',
        borderRadius: '16px',
        background: iconBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon size={28} style={{ color: iconColor }} />
    </div>
    <div>
      <p style={{ fontSize: '42px', fontWeight: 800, color: iconColor, lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: '16px', fontWeight: 700, color: '#334155', marginTop: '6px' }}>{label}</p>
      <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '2px' }}>{sublabel}</p>
    </div>
  </div>
);

// ── Building Card ─────────────────────────────────────────────────────────────
const BuildingCard = ({
  building,
  onSimulate,
}: {
  building: any;
  onSimulate: (buildingId: string) => void;
}) => {
  const environments = building.floors.flatMap((f: any) => f.environments);
  const people = environments.reduce((t: number, e: any) => t + e.occupancy.regular + e.occupancy.pcd, 0);
  const visual = buildingVisual[building.type as BuildingType] ?? buildingVisual.COMMERCIAL;
  const { Icon } = visual;

  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'flex',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}
    >
      {/* Image / illustration panel */}
      <div
        style={{
          width: '140px',
          minWidth: '140px',
          background: visual.bg,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          padding: '24px 12px',
        }}
      >
        <span style={{ fontSize: '56px', lineHeight: 1 }}>{visual.illustration}</span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '3px 10px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 700,
            background: visual.badgeBg,
            color: visual.badgeColor,
            border: `1px solid ${visual.badgeBorder}`,
            textAlign: 'center',
          }}
        >
          {buildingTypeLabels[building.type as BuildingType]}
        </span>
      </div>

      {/* Info */}
      <div style={{ flex: 1, padding: '24px 28px', display: 'flex', alignItems: 'center', gap: '24px', minWidth: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>{building.name}</h3>
          {building.description && (
            <p style={{ fontSize: '15px', color: '#64748b', marginTop: '6px' }}>{building.description}</p>
          )}
          <div style={{ display: 'flex', gap: '28px', marginTop: '16px' }}>
            {[
              { icon: Layers, label: building.floors.length === 1 ? 'Andar' : 'Andares', value: building.floors.length },
              { icon: DoorOpen, label: 'Ambientes', value: environments.length },
              { icon: Users, label: 'Pessoas', value: people },
            ].map(({ icon: StatIcon, label, value }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <StatIcon size={16} style={{ color: visual.iconColor }} />
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>{value}</span>
                <span style={{ fontSize: '15px', color: '#94a3b8' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Floors */}
        {building.floors.length > 0 && (
          <div style={{ flexShrink: 0 }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
              Andares
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', maxWidth: '220px' }}>
              {building.floors.map((floor: any) => (
                <Link
                  key={floor.id}
                  to={`/buildings/${building.id}/floors/${floor.id}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '7px 16px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 700,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    color: '#334155',
                    textDecoration: 'none',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = visual.badgeBg;
                    (e.currentTarget as HTMLElement).style.color = visual.badgeColor;
                    (e.currentTarget as HTMLElement).style.borderColor = visual.badgeBorder;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = '#f8fafc';
                    (e.currentTarget as HTMLElement).style.color = '#334155';
                    (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0';
                  }}
                >
                  {floor.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        <ChevronRight size={24} style={{ color: '#cbd5e1', flexShrink: 0 }} />
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export const DashboardPage = () => {
  const buildings = useBuildingsStore((state) => state.buildings);
  const navigate = useNavigate();

  const totalFloors = buildings.reduce((t, b) => t + b.floors.length, 0);
  const totalEnvironments = buildings.reduce((t, b) => t + b.floors.flatMap(f => f.environments).length, 0);
  const totalPeople = buildings.reduce((t, b) =>
    t + b.floors.flatMap(f => f.environments).reduce((s, e) => s + e.occupancy.regular + e.occupancy.pcd, 0), 0);

  const [simOpen, setSimOpen] = useState(false);
  const [buildingId, setBuildingId] = useState('');
  const [floorId, setFloorId] = useState('');
  const [error, setError] = useState('');

  const selectedBuilding = buildings.find(b => b.id === buildingId);

  const openModal = () => { setBuildingId(''); setFloorId(''); setError(''); setSimOpen(true); };
  const closeModal = () => setSimOpen(false);
  const startSim = () => {
    if (!buildingId) { setError('Selecione um edifício.'); return; }
    if (!floorId) { setError('Selecione um andar.'); return; }
    navigate(`/buildings/${buildingId}/floors/${floorId}`);
    closeModal();
  };

  return (
    <div>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '36px', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
            Painel Principal
          </h1>
          <p style={{ fontSize: '17px', color: '#64748b', marginTop: '8px' }}>
            Visão geral dos edifícios, andares e simulações de evacuação.
          </p>
        </div>
        <button
          onClick={openModal}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            height: '52px',
            padding: '0 28px',
            borderRadius: '12px',
            background: '#16a34a',
            color: 'white',
            fontSize: '16px',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            flexShrink: 0,
            boxShadow: '0 2px 12px rgba(22,163,74,0.35)',
          }}
        >
          <Play size={18} /> Iniciar Simulação
        </button>
      </div>

      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
        <KpiCard label="Edifícios cadastrados" sublabel="Total de edifícios" value={buildings.length} icon={Building2} iconColor="#16a34a" iconBg="#dcfce7" />
        <KpiCard label="Andares configurados" sublabel="Total de andares" value={totalFloors} icon={Layers} iconColor="#2563eb" iconBg="#eff6ff" />
        <KpiCard label="Ambientes cadastrados" sublabel="Total de ambientes" value={totalEnvironments} icon={DoorOpen} iconColor="#d97706" iconBg="#fef3c7" />
        <KpiCard label="Pessoas cadastradas" sublabel="Total de pessoas" value={totalPeople} icon={Users} iconColor="#7c3aed" iconBg="#f5f3ff" />
      </div>

      {/* Buildings section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Edifícios</h2>
        <Link
          to="/buildings/new"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            background: 'white',
            fontSize: '15px',
            fontWeight: 700,
            color: '#334155',
            textDecoration: 'none',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <Plus size={17} /> Novo Edifício
        </Link>
      </div>

      {buildings.length === 0 ? (
        <div
          style={{
            background: 'white',
            border: '2px dashed #e2e8f0',
            borderRadius: '16px',
            padding: '64px',
            textAlign: 'center',
          }}
        >
          <Building2 size={48} style={{ color: '#cbd5e1', margin: '0 auto 16px' }} />
          <p style={{ fontSize: '18px', fontWeight: 700, color: '#475569' }}>Nenhum edifício cadastrado</p>
          <p style={{ fontSize: '15px', color: '#94a3b8', marginTop: '6px' }}>
            Cadastre um edifício para configurar plantas e rotas de evacuação.
          </p>
          <Link
            to="/buildings/new"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '20px',
              padding: '12px 24px',
              borderRadius: '10px',
              background: '#0f172a',
              color: 'white',
              fontSize: '15px',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            <Plus size={17} /> Cadastrar Edifício
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {buildings.map(b => (
            <BuildingCard key={b.id} building={b} onSimulate={() => { setBuildingId(b.id); setFloorId(''); setSimOpen(true); }} />
          ))}
        </div>
      )}

      {/* Simulation Modal */}
      {simOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(15,23,42,0.5)',
            padding: '16px',
          }}
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              background: 'white',
              borderRadius: '20px',
              padding: '36px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
          >
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Play size={22} style={{ color: '#16a34a' }} />
                </div>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Iniciar Simulação</h2>
                  <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '2px' }}>Selecione o local da simulação</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                style={{ width: '36px', height: '36px', borderRadius: '10px', border: 'none', background: '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Building select */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '15px', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>
                Edifício
              </label>
              <select
                value={buildingId}
                onChange={e => { setBuildingId(e.target.value); setFloorId(''); setError(''); }}
                style={{
                  width: '100%',
                  height: '48px',
                  borderRadius: '10px',
                  border: '1.5px solid #e2e8f0',
                  padding: '0 14px',
                  fontSize: '15px',
                  color: '#0f172a',
                  background: 'white',
                  outline: 'none',
                }}
              >
                <option value="">Selecione um edifício</option>
                {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            {/* Floor select */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '15px', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>
                Andar
              </label>
              <select
                value={floorId}
                onChange={e => { setFloorId(e.target.value); setError(''); }}
                disabled={!selectedBuilding}
                style={{
                  width: '100%',
                  height: '48px',
                  borderRadius: '10px',
                  border: '1.5px solid #e2e8f0',
                  padding: '0 14px',
                  fontSize: '15px',
                  color: !selectedBuilding ? '#94a3b8' : '#0f172a',
                  background: !selectedBuilding ? '#f8fafc' : 'white',
                  outline: 'none',
                  cursor: !selectedBuilding ? 'not-allowed' : 'pointer',
                }}
              >
                <option value="">Selecione um andar</option>
                {selectedBuilding?.floors.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              {selectedBuilding?.floors.length === 0 && (
                <p style={{ fontSize: '13px', color: '#f59e0b', marginTop: '6px' }}>
                  Este edifício não possui andares configurados.
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fecaca', marginBottom: '20px' }}>
                <AlertCircle size={16} style={{ color: '#dc2626', flexShrink: 0 }} />
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#dc2626' }}>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={closeModal}
                style={{ flex: 1, height: '48px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: 'white', fontSize: '15px', fontWeight: 700, color: '#475569', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={startSim}
                style={{ flex: 1, height: '48px', borderRadius: '10px', border: 'none', background: '#16a34a', fontSize: '15px', fontWeight: 700, color: 'white', cursor: 'pointer', boxShadow: '0 2px 8px rgba(22,163,74,0.3)' }}
              >
                Abrir Planta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
