import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'rose' | 'gold' | 'green' | 'gray' | 'red' | 'blue' | 'plum';
const tones: Record<Tone, string> = {
  rose: 'bg-accent-soft text-accent',
  gold: 'bg-champagne text-rosegold',
  green: 'bg-success-soft text-success',
  gray: 'bg-fill-secondary text-label-secondary',
  red: 'bg-danger-soft text-danger',
  blue: 'bg-info-soft text-info',
  plum: 'bg-sidebar-fill text-sidebar-label',
};

export function Badge({ tone = 'rose', icon, children, className }: { tone?: Tone; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-2 py-1 text-caption font-semibold', tones[tone], className)}>
      {icon}
      {children}
    </span>
  );
}
