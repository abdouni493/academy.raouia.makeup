import type { ReactNode } from 'react';

export function PageHeader({ title, subtitle, action, eyebrow }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-2 text-footnote font-semibold uppercase tracking-widest text-label-secondary">{eyebrow}</div>}
        <h1 className="text-title-1 sm:text-large-title">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-callout text-label-secondary">{subtitle}</p>}
      </div>
      {action && <div className="flex max-w-full shrink-0 flex-wrap gap-2">{action}</div>}
    </div>
  );
}
