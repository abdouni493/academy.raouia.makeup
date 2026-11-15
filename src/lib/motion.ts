import type { Transition, Variants } from 'framer-motion';

/** Shared motion language: soft, elegant springs (no bounce-heavy effects). */
export const spring: Transition = { type: 'spring', stiffness: 380, damping: 34, mass: 0.8 };
export const softSpring: Transition = { type: 'spring', stiffness: 260, damping: 30 };
export const ease = [0.22, 1, 0.36, 1] as const; // "easeOutQuint"-like curve

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 14, filter: 'blur(6px)' },
  enter: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.45, ease } },
  exit: { opacity: 0, y: -8, filter: 'blur(4px)', transition: { duration: 0.2, ease: 'easeIn' } },
};

export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

export const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease } },
};

export const fadeItem: Variants = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: { duration: 0.35, ease } },
};

export const dropdown: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: -6 },
  show: { opacity: 1, scale: 1, y: 0, transition: spring },
  exit: { opacity: 0, scale: 0.97, y: -4, transition: { duration: 0.12 } },
};
