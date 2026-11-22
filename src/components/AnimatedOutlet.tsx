import { Suspense, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion, useIsPresent, usePresenceData } from 'framer-motion';
import { pageVariants, reducedTransition, useReducedMotion, type PageMove } from '@/lib/motion';
import { PageLoader } from '@/components/ui';

function Page({ children, move }: { children: ReactNode; move: PageMove }) {
  const present = useIsPresent();
  const frame = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (frame.current) frame.current.inert = !present;
  }, [present]);
  const latestMove: PageMove = usePresenceData() ?? move;
  const reduced = useReducedMotion();
  const stationary = { x: '0%', transition: reducedTransition };

  // Keep the exiting frame at its old viewport offset after the new page scrolls to top.
  return (
    <motion.div
      ref={frame}
      aria-hidden={present ? undefined : true}
      className={present ? 'relative min-w-0 bg-grouped' : 'pointer-events-none absolute inset-x-0 bg-grouped'}
      style={{ top: present ? undefined : -latestMove.previousScroll, zIndex: present === !latestMove.back ? 1 : 0 }}
      custom={move} variants={pageVariants}
      initial={reduced ? false : 'initial'} animate={reduced ? stationary : 'enter'} exit={reduced ? stationary : 'exit'}
    >
      <Suspense fallback={<PageLoader />}>{children}</Suspense>
    </motion.div>
  );
}

export function AnimatedOutlet() {
  const location = useLocation();
  const outlet = useOutlet();
  const index: number = window.history.state?.idx ?? 0;
  const committed = useRef({ index, pathname: location.pathname });

  // BrowserRouter's entry index distinguishes Back from Forward, both of which report POP.
  const move = useMemo<PageMove>(() => ({
    back: index < committed.current.index,
    sign: document.documentElement.dir === 'rtl' ? -1 : 1,
    previousScroll: window.scrollY,
  }), [index, location.key]);

  useLayoutEffect(() => {
    if (committed.current.pathname !== location.pathname) window.scrollTo({ top: 0, behavior: 'instant' });
    committed.current = { index, pathname: location.pathname };
  }, [index, location.pathname]);

  return (
    <div className="relative isolate min-w-0 [overflow-x:clip]">
      <AnimatePresence initial={false} custom={move}>
        <Page key={location.pathname} move={move}>{outlet}</Page>
      </AnimatePresence>
    </div>
  );
}
