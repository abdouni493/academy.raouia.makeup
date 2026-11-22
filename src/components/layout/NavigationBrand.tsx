import { useState } from 'react';
import { useMotionValueEvent, useScroll, motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/motion';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';

/** After the page's large heading scrolls away, keep the section name in the bar. */
export function NavigationBrand({ title, to = '/' }: { title: string; to?: string }) {
  const { scrollY } = useScroll();
  const [compact, setCompact] = useState(() => window.scrollY > 96);
  const reduced = useReducedMotion();
  useMotionValueEvent(scrollY, 'change', (y) => setCompact(y > 96));
  return (
    <div className="min-w-0">
      {compact ? (
        <Link to={to} className="focus-ring flex min-h-11 min-w-0 items-center rounded-xl px-1">
          <motion.span initial={reduced ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : 0.15 }} className="truncate text-headline">
            {title}
          </motion.span>
        </Link>
      ) : <Logo to={to} />}
    </div>
  );
}
