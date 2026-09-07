import { useLocation } from 'react-router-dom';

const titleByPath = (pathname: string): string => {
  if (pathname === '/') return 'Dashboard';
  if (pathname.includes('/floors/')) return 'Editor de Planta';
  if (pathname.startsWith('/buildings/new')) return 'Novo Edifício';
  return 'ExitPath';
};

export const Topbar = () => {
  const { pathname } = useLocation();
  return (
    <header
      className="flex items-center px-8 border-b border-slate-100 bg-white"
      style={{ height: '64px', flexShrink: 0 }}
    >
      <p className="text-base font-semibold text-slate-400">
        ExitPath <span className="text-slate-300 mx-1">/</span>{' '}
        <span className="text-slate-800">{titleByPath(pathname)}</span>
      </p>
    </header>
  );
};
