import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, Crown, GraduationCap, LogOut, Menu, Users, Video, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AnimatedOutlet } from '@/components/AnimatedOutlet';
import { Logo } from '@/components/Logo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useAuth } from '@/features/auth/AuthProvider';
import { UploadTray } from '@/features/admin/uploads/UploadTray';
import { ease, spring } from '@/lib/motion';
import { cn } from '@/lib/utils';

export function AdminLayout() {
  const { t, i18n } = useTranslation();
  const { profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const rtl = i18n.dir() === 'rtl';
  useEffect(() => setOpen(false), [location.pathname]);

  const links = [
    { to: '/admin', label: t('nav.overview'), icon: BarChart3, end: true },
    { to: '/admin/formations', label: t('nav.formations'), icon: Video, end: false },
    { to: '/admin/packs', label: t('nav.packs'), icon: Crown, end: false },
    { to: '/admin/clients', label: t('nav.clients'), icon: Users, end: false },
  ];

  const sidebar = (layoutId?: string) => (
    <div className="relative flex h-full flex-col overflow-hidden bg-plum text-white">
      {/* soft glow decoration */}
      <div className="pointer-events-none absolute -start-20 -top-20 h-56 w-56 rounded-full bg-blush-500/20 blur-3xl" />
      <div className="relative flex h-20 items-center justify-between px-6">
        <Logo light to="/admin" />
        <button className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 lg:hidden" onClick={() => setOpen(false)}>
          <X className="h-5 w-5" />
        </button>
      </div>
      <motion.nav
        className="relative flex-1 space-y-1 px-3 py-4"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } } }}
      >
        {links.map((l) => (
          <motion.div
            key={l.to}
            variants={{
              hidden: { opacity: 0, x: rtl ? 16 : -16 },
              show: { opacity: 1, x: 0, transition: { duration: 0.4, ease } },
            }}
          >
            <NavLink to={l.to} end={l.end} className="group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium">
              {({ isActive }) => (
                <>
                  {isActive &&
                    (layoutId ? (
                      <motion.span
                        layoutId={layoutId}
                        className="absolute inset-0 rounded-xl bg-white/10 shadow-inner ring-1 ring-white/10"
                        transition={spring}
                      >
                        <span className="absolute inset-y-2 start-0 w-1 rounded-full bg-gradient-to-b from-blush-300 to-rosegold" />
                      </motion.span>
                    ) : (
                      <span className="absolute inset-0 rounded-xl bg-white/10 shadow-inner ring-1 ring-white/10">
                        <span className="absolute inset-y-2 start-0 w-1 rounded-full bg-gradient-to-b from-blush-300 to-rosegold" />
                      </span>
                    ))}
                  <motion.span
                    className={cn('relative transition-colors', isActive ? 'text-blush-300' : 'text-white/60 group-hover:text-white')}
                    whileHover={{ scale: 1.15, rotate: -6 }}
                    transition={spring}
                  >
                    <l.icon className="h-5 w-5" />
                  </motion.span>
                  <span
                    className={cn(
                      'relative transition-all duration-300',
                      isActive ? 'text-white' : 'text-white/60 group-hover:translate-x-0.5 group-hover:text-white rtl:group-hover:-translate-x-0.5',
                    )}
                  >
                    {l.label}
                  </span>
                </>
              )}
            </NavLink>
          </motion.div>
        ))}
      </motion.nav>
      <div className="relative space-y-3 border-t border-white/10 p-4">
        <LanguageSwitcher dark />
        <NavLink to="/catalog" className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-white/70 transition hover:bg-white/5 hover:text-white">
          <GraduationCap className="h-4 w-4" /> {t('nav.clientArea')}
        </NavLink>
        <div className="flex items-center justify-between gap-2 rounded-xl bg-white/5 px-4 py-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{profile?.full_name || 'Admin'}</div>
            <div className="truncate text-xs text-white/50">{profile?.email}</div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => void signOut()}
            className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
            title={t('common.logout')}
          >
            <LogOut className="h-4 w-4" />
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
            <motion.div
              className="absolute inset-0 bg-plum/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              className="absolute inset-y-0 start-0 w-72 shadow-2xl"
              initial={{ x: rtl ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: rtl ? '100%' : '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            >
              {sidebar()}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-blush-100 bg-white/80 px-4 backdrop-blur-xl lg:hidden">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setOpen(true)} className="rounded-lg p-2 text-plum hover:bg-blush-50">
          <Menu className="h-5 w-5" />
        </motion.button>
        <Logo to="/admin" />
        <span className="w-9" />
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-10">
        <AnimatedOutlet />
      </main>
      <UploadTray />
    </div>
  );
}
