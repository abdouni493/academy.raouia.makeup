import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BRAND_NAME } from '@/lib/config';
import { cn } from '@/lib/utils';

export function Logo({ light = false, to = '/', className }: { light?: boolean; to?: string; className?: string }) {
  const [first, ...rest] = BRAND_NAME.split(' ');
  return (
    <Link to={to} className={cn('focus-ring inline-flex min-h-11 shrink-0 items-center gap-3 rounded-xl', className)} dir="ltr">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient shadow-soft">
        <Sparkles className="h-5 w-5 text-accent-contrast" aria-hidden="true" />
      </span>
      <span className="leading-none">
        <span className={cn('block font-brand text-title-2 font-semibold italic', light ? 'text-sidebar-label' : 'text-label')}>{first}</span>
        <span className={cn('mt-1 block font-sans text-[10px] font-medium uppercase tracking-[0.18em]', light ? 'text-sidebar-secondary' : 'text-label-secondary')}>
          {rest.join(' ')}
        </span>
      </span>
    </Link>
  );
}
