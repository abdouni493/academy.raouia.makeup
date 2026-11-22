import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { fadeUpItem, staggerContainer } from '@/lib/motion';

/** Grid/list whose children appear one after another. */
export function StaggerGroup({ children, className }: { children: ReactNode; className?: string }) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div className={`min-w-0 ${className ?? ''}`} variants={reducedMotion ? undefined : staggerContainer} initial={reducedMotion ? false : "hidden"} animate="show">
      {children}
    </motion.div>
  );
}

/** A child of StaggerGroup: fades up, lifts slightly on hover. */
export function StaggerItem({ children, className, hover = true }: { children: ReactNode; className?: string; hover?: boolean }) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      className={`min-w-0 ${className ?? ''}`}
      variants={reducedMotion ? undefined : fadeUpItem}
      whileHover={hover && !reducedMotion ? { y: -1, transition: { type: 'spring', stiffness: 500, damping: 38 } } : undefined}
      whileTap={hover && !reducedMotion ? { scale: 0.99 } : undefined}
    >
      {children}
    </motion.div>
  );
}
