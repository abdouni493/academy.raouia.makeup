import { useSyncExternalStore } from 'react';
import type { Transition, Variants } from 'framer-motion';

const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const subscribe = (notify: () => void) => {
  motionPreference.addEventListener('change', notify);
  return () => motionPreference.removeEventListener('change', notify);
};

export function useReducedMotion() {
  return useSyncExternalStore(subscribe, () => motionPreference.matches);
}

// Near-critical damping settles quickly without a visible second bounce.
export const spring: Transition = { type: 'spring', stiffness: 620, damping: 40, mass: 0.72 };
export const softSpring: Transition = { type: 'spring', stiffness: 420, damping: 38, mass: 0.86 };
export const ease = [0.2, 0.8, 0.2, 1] as const;
export const reducedTransition: Transition = { duration: 0 };

export interface PageMove {
  back: boolean;
  /** Positive means the trailing edge is on the right. */
  sign: number;
  previousScroll: number;
}
const routeSpring: Transition = { type: 'spring', stiffness: 540, damping: 42, mass: 0.84 };
export const pageVariants: Variants = {
  initial: ({ back, sign }: PageMove) => ({ x: `${sign * (back ? -20 : 100)}%` }),
  enter: { x: '0%', transition: routeSpring },
  exit: ({ back, sign }: PageMove) => ({ x: `${sign * (back ? 100 : -20)}%`, transition: routeSpring }),
};

export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { delayChildren: (index: number) => Math.min(index, 5) * 0.024 } },
};
export const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 5 },
  show: { opacity: 1, y: 0, transition: { ...spring, opacity: { duration: 0.14, ease } } },
};
export const dropdown: Variants = {
  hidden: { opacity: 0, scale: 0.97, y: -4 },
  show: { opacity: 1, scale: 1, y: 0, transition: spring },
  exit: { opacity: 0, scale: 0.98, y: -3, transition: { duration: 0.1 } },
};
