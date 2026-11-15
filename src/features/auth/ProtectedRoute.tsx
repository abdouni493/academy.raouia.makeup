import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, PageLoader } from '@/components/ui';
import { useAuth } from './AuthProvider';
import { SuspendedScreen } from './SuspendedScreen';

export function ProtectedRoute({ adminOnly = false }: { adminOnly?: boolean }) {
  const { session, profile, profileError, loading, isAdmin, refreshProfile, signOut } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  if (loading) return <PageLoader />;
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (!profile && profileError) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-muted">{t('common.error')}</p>
        <div className="flex gap-2">
          <Button onClick={() => void refreshProfile()}>{t('common.retry')}</Button>
          <Button variant="secondary" onClick={() => void signOut()}>
            {t('common.logout')}
          </Button>
        </div>
      </div>
    );
  }
  if (!profile) return <PageLoader />;
  if (!profile.is_active) return <SuspendedScreen />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}
