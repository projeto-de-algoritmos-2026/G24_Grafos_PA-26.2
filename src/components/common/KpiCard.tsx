import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: 'blue' | 'green' | 'amber' | 'red';
}

const tones = {
  blue: 'bg-blue-50 text-blue-700',
  green: 'bg-green-50 text-green-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
};

export const KpiCard = ({ label, value, icon: Icon, tone = 'blue' }: KpiCardProps) => (
  <section className="rounded-lg border border-border bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-base font-medium text-slate-500">{label}</p>
        <strong className="mt-2 block text-4xl font-bold text-slate-950">{value}</strong>
      </div>
      <span className={`grid h-11 w-11 place-items-center rounded-md ${tones[tone]}`}>
        <Icon size={22} aria-hidden="true" />
      </span>
    </div>
  </section>
);
