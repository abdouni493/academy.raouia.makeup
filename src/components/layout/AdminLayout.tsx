import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { BarChart3, Crown, GraduationCap, LogOut, Menu, Users, Video, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/Logo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useAuth } from '@/features/auth/AuthProvider';
import { UploadTray } from '@/features/admin/uploads/UploadTray';
import { cn } from '@/lib/utils';

export function AdminLayout() {
  const { t } = useTranslation();
  const { profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);

  const links = [
    { to: '/admin', label: t('nav.overview'), icon: BarChart3, end: true },
    { to: '/admin/formations', label: t('nav.formations'), icon: Video, end: false },
    { to: '/admin/packs', label: t('nav.packs'), icon: Crown, end: false },
    { to: '/admin/clients', label: t('nav.clients'), icon: Users, end: false },
  ];

  const sidebar = (
    <div className="flex h-full flex-col bg-plum text-white">
      <div className="flex h-20 items-center justify-between px-6">
        <Logo light to="/admin" />
        <button className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 lg:hidden" onClick={() => setOpen(false)}>
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition',
                isActive ? 'bg-white/10 text-white shadow-inner ring-1 ring-white/10' : 'text-white/60 hover:bg-white/5 hover:text-white',
              )
            }
          >
            {({ isActive }) => (
              <>
                <l.icon className={cn('h-5 w-5', isActive ? 'text-blush-300' : '')} />
                {l.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-3 border-t border-white/10 p-4">
        <LanguageSwitcher dark />
        <NavLink to="/" className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white">
          <GraduationCap className="h-4 w-4" /> {t('nav.clientArea')}
        </NavLink>
        <div className="flex items-center justify-between gap-2 rounded-xl bg-white/5 px-4 py-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{profile?.full_name || 'Admin'}</div>
            <div className="truncate text-xs text-white/50">{profile?.email}</div>
          </div>
          <button onClick={() => void signOut()} className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white" title={t('common.logout')}>
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh lg:ps-72">
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-72 lg:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-plum/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 start-0 w-72 animate-fade-in shadow-2xl">{sidebar}</aside>
        </div>
      )}

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-blush-100 bg-white/80 px-4 backdrop-blur-xl lg:hidden">
        <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-plum hover:bg-blush-50">
          <Menu className="h-5 w-5" />
        </button>
        <Logo to="/admin" />
        <span className="w-9" />
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-10">
        <Outlet />
      </main>
      <UploadTray />
    </div>
  );
}
