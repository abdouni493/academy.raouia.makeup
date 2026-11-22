import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useDragControls, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { softSpring } from '@/lib/motion';
import { cn } from '@/lib/utils';

function useIsMobile() {
  const query = '(max-width: 639px)';
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMobile(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return mobile;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const { t } = useTranslation();
  const mobile = useIsMobile();
  const dragControls = useDragControls();
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const appRoot = document.getElementById('root');
    const previousInert = appRoot?.inert ?? false;
    if (appRoot) appRoot.inert = true;
    document.body.style.overflow = 'hidden';
    const focusFrame = requestAnimationFrame(() => panelRef.current?.focus({ preventScroll: true }));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeRef.current();
      }
      if (e.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )).filter((element) => element.getClientRects().length > 0 && element.tabIndex >= 0);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first) {
        e.preventDefault();
        panel.focus();
      } else if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      if (appRoot) appRoot.inert = previousInert;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [open]);

  const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  const panel = reduceMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 } }
    : mobile
      ? { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } }
      : {
          initial: { opacity: 0, scale: 0.98, y: 8 },
          animate: { opacity: 1, scale: 1, y: 0 },
          exit: { opacity: 0, scale: 0.98, y: 8 },
        };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-scrim/45"
            aria-hidden="true"
            initial={{ opacity: reduceMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: reduceMotion ? 1 : 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
            onClick={onClose}
          />
          <motion.div
            {...panel}
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            tabIndex={-1}
            transition={reduceMotion ? { duration: 0 } : softSpring}
            drag={mobile ? 'y' : false}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.35 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose();
            }}
            className={cn('material relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-sheet shadow-sheet outline-none sm:rounded-sheet', widths[size])}
          >
            {mobile && (
              <div aria-hidden="true" onPointerDown={(event) => dragControls.start(event)} className="flex h-9 w-full shrink-0 touch-none items-center justify-center">
                <span className="h-1 w-10 rounded-full bg-label-tertiary/50" />
              </div>
            )}
            <div className="flex items-center gap-3 border-b border-separator px-4 py-3 sm:px-6">
              <button
                type="button"
                onClick={onClose}
                className="focus-ring press-feedback inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-fill-secondary text-label-secondary hover:bg-fill hover:text-label"
                aria-label={t('common.close')}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
              <h2 id={titleId} className="min-w-0 text-headline">{title}</h2>
            </div>
            <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6 sm:px-6" onPointerDown={(e) => e.stopPropagation()}>
              {children}
            </div>
            {footer && <div className="flex flex-wrap justify-end gap-3 border-t border-separator px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">{footer}</div>}
            {!footer && <div className="h-[env(safe-area-inset-bottom)] shrink-0" />}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
