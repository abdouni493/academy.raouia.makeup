import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, Crown, Home, LayoutDashboard, LogOut, Sparkles, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AnimatedOutlet } from '@/components/AnimatedOutlet';
import { Logo } from '@/components/Logo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useAuth } from '@/features/auth/AuthProvider';
import { BRAND_NAME } from '@/lib/config';
import { dropdown, spring, reducedTransition } from '@/lib/motion';
import { cn } from '@/lib/utils';

export function ClientLayout() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const transition = reduceMotion ? reducedTransition : spring;
  const { profile, isAdmin, signOut } = useAuth();
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => setMenu(false), [location.pathname]);
  useEffect(() => {
    const close = (e: MouseEvent) => menuRef.current && !menuRef.current.contains(e.target as Node) && setMenu(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const links = [
    isAdmin
      ? { to: '/admin', label: t('nav.admin'), icon: LayoutDashboard, end: false }
      : { to: '/', label: t('nav.dashboard'), icon: Home, end: true },
    { to: '/catalog', label: t('nav.catalog'), icon: Crown, end: false },
  ];
  const initials = (profile?.full_name || profile?.email || '?').trim().slice(0, 1).toUpperCase();

  return (
    <div className="flex min-h-dvh flex-col pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-0">
      <motion.header
        className="material sticky top-0 z-40 border-b border-separator/70 pt-[env(safe-area-inset-top)]"
      >
        <div className="mx-auto flex min-h-20 max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-2 sm:px-8">
          <Logo />
          <nav className="hidden items-center gap-1 rounded-full bg-fill-secondary p-1 md:flex">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className="focus-ring relative flex min-h-11 items-center rounded-full px-5 py-2 text-subhead font-semibold">
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span layoutId={reduceMotion ? undefined : "client-nav-pill"} className="absolute inset-0 rounded-full bg-surface-secondary shadow-soft" transition={transition} />
                    )}
                    <span className={cn('relative transition-colors', isActive ? 'text-accent' : 'text-label-secondary hover:text-label')}>{l.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSwitcher className="hidden sm:inline-flex" />
            <div className="relative" ref={menuRef}>
              <motion.button
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                onClick={() => setMenu((m) => !m)}
                aria-label={t('nav.profile')}
                aria-expanded={menu}
                aria-controls="profile-menu"
                className="focus-ring flex min-h-11 items-center gap-2 rounded-full p-1 pe-2 transition-colors hover:bg-fill-secondary"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient text-subhead font-semibold text-accent-contrast">{initials}</span>
                <motion.span animate={{ rotate: menu ? 180 : 0 }} transition={transition}>
                  <ChevronDown className="h-4 w-4 text-label-secondary" />
                </motion.span>
              </motion.button>
              <AnimatePresence>
                {menu && (
                  <motion.div
                    id="profile-menu"
                    variants={reduceMotion ? undefined : dropdown}
                    initial={reduceMotion ? false : "hidden"}
                    animate={reduceMotion ? undefined : "show"}
                    exit={reduceMotion ? undefined : "exit"}
                    className="material absolute end-0 top-14 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-separator/70 p-2 shadow-elevated"
                  >
                    <div className="border-b border-separator/70 px-3 pb-3 pt-2">
                      <div className="truncate font-medium text-label">{profile?.full_name || '—'}</div>
                      <div className="truncate text-xs text-label-secondary">{profile?.email}</div>
                    </div>
                    <LanguageSwitcher className="mx-2 my-2 sm:hidden" />
                    <NavLink to="/profile" className="focus-ring flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-subhead text-label transition-colors hover:bg-fill-secondary">
                      <User className="h-4 w-4 text-rosegold" /> {t('nav.profile')}
                    </NavLink>
                    {isAdmin && (
                      <NavLink to="/admin" className="focus-ring flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-subhead text-label transition-colors hover:bg-fill-secondary">
                        <LayoutDashboard className="h-4 w-4 text-rosegold" /> {t('nav.admin')}
                      </NavLink>
                    )}
                    <button
                      onClick={() => void signOut()}
                      className="focus-ring flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-3 text-subhead text-danger transition-colors hover:bg-danger-soft"
                    >
                      <LogOut className="h-4 w-4" /> {t('common.logout')}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-8 sm:py-10">
        <AnimatedOutlet />
      </main>

      <footer className="hidden border-t border-separator/70 py-6 text-center text-xs text-label-secondary md:block">
        <Sparkles className="me-1 inline h-3 w-3 text-rosegold" /> {BRAND_NAME} © {new Date().getFullYear()}
      </footer>

      {/* Stable top-level navigation above the safe area. */}
      <nav aria-label={t('nav.clientArea')} className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 md:hidden">
        <div className="material mx-auto grid max-w-lg grid-cols-3 gap-1 rounded-full border border-separator/70 p-1.5 shadow-elevated">
          {[...links, { to: '/profile', label: t('nav.profile'), icon: User, end: false }].map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className="focus-ring relative flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-full px-2 py-2 text-caption font-semibold">
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span layoutId={reduceMotion ? undefined : 'client-tab-indicator'} className="absolute inset-0 rounded-full bg-accent-soft" transition={transition} />
                  )}
                  <l.icon className={cn('relative h-5 w-5', isActive ? 'text-accent' : 'text-label-secondary')} aria-hidden="true" />
                  <span className={cn('relative max-w-full break-words text-center', isActive ? 'text-accent' : 'text-label-secondary')}>{l.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
