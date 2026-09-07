import { LayoutDashboard, Building2, ChevronLeft, Network } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useUiStore } from '@/store/ui.store';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/buildings/new', label: 'Edifícios', icon: Building2 },
  { to: '/infrastructure', label: 'Planejar Infraestrutura', icon: Network },
];

export const Sidebar = () => {
  const { sidebarCollapsed, toggleSidebar } = useUiStore();

  return (
    <aside
      className="flex flex-col border-r border-slate-700/50"
      style={{
        width: sidebarCollapsed ? '64px' : '220px',
        minWidth: sidebarCollapsed ? '64px' : '220px',
        background: '#0f172a',
        transition: 'width 0.2s ease, min-width 0.2s ease',
        height: '100vh',
        position: 'sticky',
        top: 0,
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 border-b px-4"
        style={{ height: '64px', borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div
          className="flex items-center justify-center rounded-lg shrink-0"
          style={{ width: '36px', height: '36px', background: '#16a34a' }}
        >
          <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
            <path d="M13 3L5 13h7l-1 8 8-10h-7l1-8z" fill="white" />
          </svg>
        </div>
        {!sidebarCollapsed && (
          <span style={{ color: 'white', fontWeight: 700, fontSize: '18px', letterSpacing: '-0.02em' }}>
            ExitPath
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors ${
                isActive
                  ? 'text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
            style={({ isActive }) => ({
              height: '40px',
              background: isActive ? 'rgba(22,163,74,0.18)' : undefined,
              color: isActive ? '#4ade80' : undefined,
            })}
          >
            <Icon size={18} aria-hidden="true" style={{ flexShrink: 0 }} />
            {!sidebarCollapsed && label}
          </NavLink>
        ))}
      </nav>

      {/* Collapse button */}
      <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          className="flex items-center justify-center rounded-lg transition-colors hover:bg-white/5"
          style={{ width: '100%', height: '36px', color: '#94a3b8' }}
          onClick={toggleSidebar}
          title={sidebarCollapsed ? 'Expandir' : 'Recolher'}
        >
          <ChevronLeft
            size={18}
            style={{
              transform: sidebarCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          />
          {!sidebarCollapsed && (
            <span className="ml-2 text-sm font-semibold">Recolher</span>
          )}
        </button>
      </div>
    </aside>
  );
};
