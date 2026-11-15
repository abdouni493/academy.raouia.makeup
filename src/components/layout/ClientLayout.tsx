import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Crown, Home, LayoutDashboard, LogOut, Sparkles, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AnimatedOutlet } from '@/components/AnimatedOutlet';
import { Logo } from '@/components/Logo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useAuth } from '@/features/auth/AuthProvider';
import { BRAND_NAME } from '@/lib/config';
import { dropdown, spring } from '@/lib/motion';
import { cn } from '@/lib/utils';

export function ClientLayout() {
  const { t } = useTranslation();
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
    <div className="flex min-h-dvh flex-col pb-20 md:pb-0">
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-40 border-b border-blush-100/80 bg-white/75 backdrop-blur-xl"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-1 rounded-full bg-blush-50/80 p-1 ring-1 ring-blush-100 md:flex">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className="relative rounded-full px-5 py-2 text-sm font-medium">
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span layoutId="client-nav-pill" className="absolute inset-0 rounded-full bg-white shadow-soft" transition={spring} />
                    )}
                    <span className={cn('relative transition-colors', isActive ? 'text-blush-700' : 'text-muted hover:text-plum')}>{l.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSwitcher className="hidden sm:inline-flex" />
            <div className="relative" ref={menuRef}>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setMenu((m) => !m)}
                className="focus-ring flex items-center gap-2 rounded-full p-1 pe-2 transition hover:bg-blush-50"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient text-sm font-semibold text-white">{initials}</span>
                <motion.span animate={{ rotate: menu ? 180 : 0 }} transition={spring}>
                  <ChevronDown className="h-4 w-4 text-muted" />
                </motion.span>
              </motion.button>
              <AnimatePresence>
                {menu && (
                  <motion.div
                    variants={dropdown}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    className="card absolute end-0 top-12 w-64 origin-top-right p-2 rtl:origin-top-left"
                  >
                    <div className="border-b border-blush-100 px-3 pb-3 pt-2">
                      <div className="truncate font-medium text-plum">{profile?.full_name || '—'}</div>
                      <div className="truncate text-xs text-muted">{profile?.email}</div>
                    </div>
                    <LanguageSwitcher className="mx-2 my-2 sm:hidden" />
                    <NavLink to="/profile" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-plum transition hover:bg-blush-50">
                      <User className="h-4 w-4 text-rosegold" /> {t('nav.profile')}
                    </NavLink>
                    {isAdmin && (
                      <NavLink to="/admin" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-plum transition hover:bg-blush-50">
                        <LayoutDashboard className="h-4 w-4 text-rosegold" /> {t('nav.admin')}
                      </NavLink>
                    )}
                    <button
                      onClick={() => void signOut()}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
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

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <AnimatedOutlet />
      </main>

      <footer className="hidden border-t border-blush-100 py-6 text-center text-xs text-muted md:block">
        <Sparkles className="me-1 inline h-3 w-3 text-rosegold" /> {BRAND_NAME} © {new Date().getFullYear()}
      </footer>

      {/* Mobile bottom navigation with gliding indicator */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-blush-100 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        <div className="grid grid-cols-3">
          {[...links, { to: '/profile', label: t('nav.profile'), icon: User, end: false }].map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className="relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium">
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="client-tab-indicator"
                      className="absolute inset-x-6 top-0 h-[3px] rounded-b-full bg-brand-gradient"
                      transition={spring}
                    />
                  )}
                  <motion.span animate={{ scale: isActive ? 1.12 : 1, y: isActive ? -1 : 0 }} transition={spring}>
                    <l.icon className={cn('h-5 w-5 transition-colors', isActive ? 'text-blush-600' : 'text-muted')} />
                  </motion.span>
                  <span className={cn('transition-colors', isActive ? 'text-blush-600' : 'text-muted')}>{l.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
