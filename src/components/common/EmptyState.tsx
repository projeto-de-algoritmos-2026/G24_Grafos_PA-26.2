import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export const EmptyState = ({ icon: Icon, title, description, action }: EmptyStateProps) => (
  <section className="grid min-h-72 place-items-center rounded-lg border border-dashed border-border bg-white p-8 text-center">
    <div>
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-md bg-blue-50 text-primary">
        <Icon size={28} aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  </section>
);
