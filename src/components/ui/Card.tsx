import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('card', className)} {...rest} />;
}

export function CardHeader({ title, subtitle, action, icon }: { title: React.ReactNode; subtitle?: React.ReactNode; action?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-separator/70 px-4 py-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {icon && <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">{icon}</span>}
        <div className="min-w-0">
          <h3 className="text-headline">{title}</h3>
          {subtitle && <p className="mt-1 text-subhead text-label-secondary">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
