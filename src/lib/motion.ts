import type { Transition, Variants } from 'framer-motion';

/** Brief, interruptible, critically damped feedback; values are web adaptations of HIG intent. */
export const spring: Transition = { type: 'spring', stiffness: 500, damping: 38, mass: 0.8 };
export const softSpring: Transition = { type: 'spring', stiffness: 360, damping: 36, mass: 1 };
export const ease = [0.2, 0.8, 0.2, 1] as const;
export const reducedTransition: Transition = { duration: 0 };
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 6 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.18, ease } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};
export const reducedPageVariants: Variants = { initial: { opacity: 1 }, enter: { opacity: 1, transition: reducedTransition }, exit: { opacity: 1, transition: reducedTransition } };
export const staggerContainer: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.025 } } };
export const fadeUpItem: Variants = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.18, ease } } };
export const fadeItem: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.15 } } };
export const dropdown: Variants = {
  hidden: { opacity: 0, scale: 0.98, y: -4 },
  show: { opacity: 1, scale: 1, y: 0, transition: spring },
  exit: { opacity: 0, scale: 0.98, y: -4, transition: { duration: 0.1 } },
};
