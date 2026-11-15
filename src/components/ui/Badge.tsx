import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'rose' | 'gold' | 'green' | 'gray' | 'red' | 'blue' | 'plum';
const tones: Record<Tone, string> = {
  rose: 'bg-blush-100 text-blush-700 ring-blush-200',
  gold: 'bg-champagne text-[#8a5a2b] ring-rosegold-light',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  gray: 'bg-stone-100 text-stone-600 ring-stone-200',
  red: 'bg-red-50 text-red-600 ring-red-100',
  blue: 'bg-sky-50 text-sky-700 ring-sky-100',
  plum: 'bg-plum text-white ring-plum',
};

export function Badge({ tone = 'rose', icon, children, className }: { tone?: Tone; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset', tones[tone], className)}>
      {icon}
      {children}
    </span>
  );
}
