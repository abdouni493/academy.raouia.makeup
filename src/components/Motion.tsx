import { useRef, useLayoutEffect, type ReactNode } from 'react';
import { AnimatePresence, motion, useIsPresent } from 'framer-motion';
import { ease, fadeUpItem, reducedTransition, spring, staggerContainer, useReducedMotion } from '@/lib/motion';

export function StaggerGroup({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.div className={`min-w-0 ${className ?? ''}`} variants={staggerContainer} initial={reduced ? false : 'hidden'} animate="show">
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, hover = true }: { children: ReactNode; className?: string; hover?: boolean }) {
  const reduced = useReducedMotion();
  return (
    <motion.div className={`min-w-0 ${className ?? ''}`}
      variants={reduced ? { hidden: {}, show: { opacity: 1, y: 0, transition: reducedTransition } } : fadeUpItem}
      whileHover={hover && !reduced ? { y: -1 } : undefined}
      transition={reduced ? reducedTransition : spring}
    >
      {children}
    </motion.div>
  );
}

function LoadingFrame({ children }: { children: ReactNode }) {
  const present = useIsPresent();
  const frame = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (frame.current) frame.current.inert = !present;
  }, [present]);
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={present ? 'min-w-0' : 'pointer-events-none absolute inset-x-0 top-0'}
      aria-hidden={present ? undefined : true}
      ref={frame}
      initial={{ opacity: reduced ? 1 : 0 }} animate={{ opacity: 1 }} exit={{ opacity: reduced ? 1 : 0 }}
      transition={reduced ? reducedTransition : { duration: 0.14, ease }}
    >{children}</motion.div>
  );
}

/** Crossfade placeholders in-place without blocking input or delaying content layout. */
export function LoadingTransition({ loading, fallback, children }: { loading: boolean; fallback: ReactNode; children: ReactNode }) {
  return (
    <div className="relative min-w-0">
      <AnimatePresence initial={false}>
        <LoadingFrame key={loading ? 'skeleton' : 'content'}>{loading ? fallback : children}</LoadingFrame>
      </AnimatePresence>
    </div>
  );
}
