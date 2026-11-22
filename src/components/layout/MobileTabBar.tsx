import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Link, matchPath, useLocation } from 'react-router-dom';
import { useReducedMotion, spring } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface Tab {
  to: string;
  label: string;
  icon: LucideIcon;
  end: boolean;
}

interface Props {
  tabs: Tab[];
  label: string;
  layoutId: string;
  className: string;
  /** Keep the originating tab selected when a detail view is pushed. */
  parentTab?: string;
}

export function MobileTabBar({ tabs, label, layoutId, className, parentTab }: Props) {
  const { pathname } = useLocation();
  const reduced = useReducedMotion();
  return (
    <nav aria-label={label} className={cn('pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]', className)}>
      <div className="glass-ultrathin pointer-events-auto mx-auto flex max-w-md items-stretch gap-0.5 rounded-[2rem] p-1 shadow-elevated">
        {tabs.map(({ to, label: tabLabel, icon: Icon, end }) => {
          const active = !!matchPath({ path: to, end }, pathname);
          const selected = active || parentTab === to;
          return (
            <Link key={to} to={to} aria-current={selected ? (pathname === to ? 'page' : 'location') : undefined}
              className="focus-ring relative flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[1.75rem] px-1 py-2">
              {selected && <motion.span aria-hidden="true" layoutId={reduced ? undefined : layoutId} transition={spring}
                className="absolute inset-0 rounded-[inherit] bg-accent-soft" />}
              <motion.span aria-hidden="true" initial={false} animate={{ scale: selected && !reduced ? 1.12 : 1 }}
                transition={reduced ? { duration: 0 } : spring} className={cn('relative', selected ? 'text-accent' : 'text-label-secondary')}>
                <Icon className="h-5 w-5" />
              </motion.span>
              <span className={cn('relative max-w-full text-balance break-words text-center text-caption font-semibold leading-tight', selected ? 'text-accent' : 'text-label-secondary')}>
                {tabLabel}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
