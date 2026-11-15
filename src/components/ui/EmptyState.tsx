import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function EmptyState({ icon, title, text, action, className }: { icon: ReactNode; title: string; text?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-2xl border border-dashed border-blush-200 bg-white/60 px-6 py-14 text-center', className)}>
      <div className="relative mb-5">
        <div className="absolute inset-0 rounded-full bg-blush-200 blur-xl" />
        <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blush-100 to-champagne text-blush-500 [&>svg]:h-7 [&>svg]:w-7">
          {icon}
        </span>
      </div>
      <h3 className="text-xl font-semibold">{title}</h3>
      {text && <p className="mt-2 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
