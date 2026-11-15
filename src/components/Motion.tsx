import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { fadeUpItem, staggerContainer } from '@/lib/motion';

/** Grid/list whose children appear one after another. */
export function StaggerGroup({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={staggerContainer} initial="hidden" animate="show">
      {children}
    </motion.div>
  );
}

/** A child of StaggerGroup: fades up, lifts slightly on hover. */
export function StaggerItem({ children, className, hover = true }: { children: ReactNode; className?: string; hover?: boolean }) {
  return (
    <motion.div
      className={className}
      variants={fadeUpItem}
      whileHover={hover ? { y: -4, transition: { type: 'spring', stiffness: 400, damping: 25 } } : undefined}
      whileTap={hover ? { scale: 0.985 } : undefined}
    >
      {children}
    </motion.div>
  );
}
