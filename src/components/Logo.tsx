import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BRAND_NAME } from '@/lib/config';
import { cn } from '@/lib/utils';

export function Logo({ light = false, to = '/', className }: { light?: boolean; to?: string; className?: string }) {
  const [first, ...rest] = BRAND_NAME.split(' ');
  return (
    <Link to={to} className={cn('group inline-flex items-center gap-2 font-display', className)} dir="ltr">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient shadow-glow transition-transform group-hover:rotate-6">
        <Sparkles className="h-5 w-5 text-white" />
      </span>
      <span className="leading-none">
        <span className={cn('block text-xl font-semibold italic', light ? 'text-white' : 'text-plum')}>{first}</span>
        <span className={cn('block text-[10px] font-sans uppercase tracking-[0.25em]', light ? 'text-rosegold-light' : 'text-rosegold')}>
          {rest.join(' ')}
        </span>
      </span>
    </Link>
  );
}
