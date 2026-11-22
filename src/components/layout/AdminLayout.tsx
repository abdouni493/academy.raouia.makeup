import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { BarChart3, Crown, GraduationCap, LogOut, Menu, Users, Video, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AnimatedOutlet } from '@/components/AnimatedOutlet';
import { Logo } from '@/components/Logo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useAuth } from '@/features/auth/AuthProvider';
import { UploadTray } from '@/features/admin/uploads/UploadTray';
import { spring, reducedTransition } from '@/lib/motion';
import { cn } from '@/lib/utils';

export function AdminLayout() {
  const { t, i18n } = useTranslation();
  const { profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const rtl = i18n.dir() === 'rtl';
  const reduceMotion = useReducedMotion();
  const transition = reduceMotion ? reducedTransition : spring;
  const drawerRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const frame = requestAnimationFrame(() => drawerRef.current?.querySelector<HTMLButtonElement>('button')?.focus());
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
      if (event.key !== 'Tab') return;
      const elements = drawerRef.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)');
      if (!elements?.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
      menuRef.current?.focus();
    };
  }, [open]);

  const links = [
    { to: '/admin', label: t('nav.overview'), icon: BarChart3, end: true },
    { to: '/admin/formations', label: t('nav.formations'), icon: Video, end: false },
    { to: '/admin/packs', label: t('nav.packs'), icon: Crown, end: false },
    { to: '/admin/clients', label: t('nav.clients'), icon: Users, end: false },
  ];

  const sidebar = (layoutId?: string) => (
    <div className="sidebar-material flex h-full flex-col overflow-y-auto border-e border-sidebar-fill">
      <div className="flex min-h-24 shrink-0 items-center justify-between gap-2 px-6 py-4">
        <Logo light to="/admin" />
        <button type="button" className="focus-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sidebar-secondary hover:bg-sidebar-fill lg:hidden" onClick={() => setOpen(false)} aria-label={t('common.close')}>
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <nav aria-label={t('nav.admin')} className="flex-1 space-y-2 px-4 py-6">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className="focus-ring group relative flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 text-subhead font-medium">
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span layoutId={reduceMotion ? undefined : layoutId} className="absolute inset-0 rounded-xl bg-sidebar-fill" transition={transition} />
                )}
                <l.icon className={cn('relative h-5 w-5 shrink-0', isActive ? 'text-sidebar-label' : 'text-sidebar-secondary group-hover:text-sidebar-label')} aria-hidden="true" />
                <span className={cn('relative', isActive ? 'font-semibold text-sidebar-label' : 'text-sidebar-secondary group-hover:text-sidebar-label')}>{l.label}</span>
                {isActive && <span className="relative ms-auto h-1.5 w-1.5 shrink-0 rounded-full bg-sidebar-label" aria-hidden="true" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-4 border-t border-sidebar-fill p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <LanguageSwitcher dark />
        <NavLink to="/catalog" className="focus-ring flex min-h-11 items-center gap-3 rounded-xl px-4 py-3 text-subhead text-sidebar-secondary transition-colors hover:bg-sidebar-fill hover:text-sidebar-label">
          <GraduationCap className="h-5 w-5" aria-hidden="true" /> {t('nav.clientArea')}
        </NavLink>
        <div className="flex items-center justify-between gap-2 rounded-xl bg-sidebar-fill/50 px-4 py-3">
          <div className="min-w-0">
            <div className="truncate text-subhead font-semibold text-sidebar-label">{profile?.full_name || 'Admin'}</div>
            <div className="mt-1 truncate text-footnote text-sidebar-secondary">{profile?.email}</div>
          </div>
          <motion.button whileTap={reduceMotion ? undefined : { scale: 0.98 }} transition={transition} onClick={() => void signOut()} className="focus-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sidebar-secondary hover:bg-sidebar-fill hover:text-sidebar-label" title={t('common.logout')} aria-label={t('common.logout')}>
            <LogOut className="h-5 w-5" aria-hidden="true" />
          </motion.button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh lg:ps-72">
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-72 lg:block">{sidebar('admin-nav-desktop')}</aside>
      <AnimatePresence>
        {open && (
          <motion.div key="drawer" className="fixed inset-0 z-50 lg:hidden">
            <motion.div className="absolute inset-0 bg-scrim/50" initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={reduceMotion ? reducedTransition : { duration: 0.15 }} onClick={() => setOpen(false)} />
            <motion.aside ref={drawerRef} id="admin-navigation" role="dialog" aria-modal="true" aria-label={t('nav.admin')}
              className="absolute inset-y-0 start-0 w-80 max-w-[calc(100vw-2rem)] shadow-sheet"
              initial={reduceMotion ? false : { x: rtl ? '100%' : '-100%' }} animate={{ x: 0 }} exit={reduceMotion ? { opacity: 0 } : { x: rtl ? '100%' : '-100%' }} transition={transition}>
              {sidebar('admin-nav-mobile')}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
      <header className="material sticky top-0 z-30 flex min-h-20 items-center justify-between gap-2 border-b border-separator/70 px-4 pt-[env(safe-area-inset-top)] lg:hidden">
        <motion.button ref={menuRef} whileTap={reduceMotion ? undefined : { scale: 0.98 }} transition={transition} onClick={() => setOpen(true)} className="focus-ring flex h-11 w-11 items-center justify-center rounded-full text-label hover:bg-fill-secondary" aria-label={t('nav.admin')} aria-expanded={open} aria-controls="admin-navigation">
          <Menu className="h-5 w-5" aria-hidden="true" />
        </motion.button>
        <Logo to="/admin" />
        <span className="w-11" aria-hidden="true" />
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-10">
        <AnimatedOutlet />
      </main>
      <UploadTray />
    </div>
  );
}
