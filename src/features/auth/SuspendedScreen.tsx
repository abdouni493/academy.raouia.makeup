import { LogOut, MessageCircle, ShieldOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, buttonClassName } from '@/components/ui';
import { AuthShell } from './AuthShell';
import { whatsappLink } from '@/lib/utils';
import { useAuth } from './AuthProvider';

export function SuspendedScreen() {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  return (
    <AuthShell>
      <div className="rounded-3xl bg-card p-4 text-center sm:p-8">
        <span className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft text-accent">
          <ShieldOff className="h-7 w-7" />
        </span>
        <h1 className="text-title-2">{t('auth.suspendedTitle')}</h1>
        <p className="mt-3 text-label-secondary">{t('auth.suspendedText')}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a href={whatsappLink('')} target="_blank" rel="noreferrer" className={buttonClassName()}>
            <MessageCircle className="h-4 w-4" aria-hidden="true" /> {t('auth.contactUs')}
          </a>
          <Button variant="secondary" icon={<LogOut className="h-4 w-4" />} onClick={() => void signOut()}>
            {t('common.logout')}
          </Button>
        </div>
      </div>
    </AuthShell>
  );
}
