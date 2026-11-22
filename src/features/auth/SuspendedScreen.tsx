import { LogOut, MessageCircle, ShieldOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui';
import { Logo } from '@/components/Logo';
import { whatsappLink } from '@/lib/utils';
import { useAuth } from './AuthProvider';

export function SuspendedScreen() {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-blush-gradient px-6 text-center">
      <Logo />
      <div className="card max-w-md p-8">
        <span className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft text-accent">
          <ShieldOff className="h-7 w-7" />
        </span>
        <h1 className="text-title-2">{t('auth.suspendedTitle')}</h1>
        <p className="mt-3 text-label-secondary">{t('auth.suspendedText')}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a href={whatsappLink('')} target="_blank" rel="noreferrer">
            <Button icon={<MessageCircle className="h-4 w-4" />} className="w-full">
              {t('auth.contactUs')}
            </Button>
          </a>
          <Button variant="secondary" icon={<LogOut className="h-4 w-4" />} onClick={() => void signOut()}>
            {t('common.logout')}
          </Button>
        </div>
      </div>
    </div>
  );
}
