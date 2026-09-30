import type { ReactNode } from "react";

export function PageHeader({ title, eyebrow, actions }: { title: string; eyebrow: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/95 px-6 py-5 lg:flex-row lg:items-center lg:justify-between transition-colors">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white tracking-tight">{title}</h1>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
