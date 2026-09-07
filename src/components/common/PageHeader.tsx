import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export const PageHeader = ({ title, subtitle, actions }: PageHeaderProps) => (
  <header className="mb-8 flex items-start justify-between gap-4">
    <div>
      <h1 className="text-3xl font-bold text-slate-950">{title}</h1>
      {subtitle ? <p className="mt-2 text-base text-slate-500">{subtitle}</p> : null}
    </div>
    {actions}
  </header>
);
