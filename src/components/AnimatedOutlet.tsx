import { Suspense, useState } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { pageVariants, reducedPageVariants } from '@/lib/motion';
import { PageLoader } from '@/components/ui';

/** Keeps the old page rendered while it animates out. */
function FrozenOutlet() {
  const outlet = useOutlet();
  const [frozen] = useState(outlet);
  return frozen;
}

/** Route outlet with smooth page transitions (keyed by pathname, not query string). */
export function AnimatedOutlet() {
  const location = useLocation();
  const reducedMotion = useReducedMotion();
  return (
    <AnimatePresence mode="wait" initial={false} onExitComplete={() => window.scrollTo({ top: 0 })}>
      <motion.div key={location.pathname} variants={reducedMotion ? reducedPageVariants : pageVariants} initial="initial" animate="enter" exit="exit">
        <Suspense fallback={<PageLoader />}>
          <FrozenOutlet />
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}
