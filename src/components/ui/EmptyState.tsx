import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function EmptyState({ icon, title, text, action, className }: { icon: ReactNode; title: string; text?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-2xl bg-surface-secondary px-6 py-16 text-center', className)}>
      <span aria-hidden="true" className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft text-accent [&>svg]:h-8 [&>svg]:w-8">
        {icon}
      </span>
      <h3 className="text-title-3">{title}</h3>
      {text && <p className="mt-2 max-w-sm text-callout text-label-secondary">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
