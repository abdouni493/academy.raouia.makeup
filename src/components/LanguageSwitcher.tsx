import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '@/i18n';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

export function LanguageSwitcher({ dark = false, className }: { dark?: boolean; className?: string }) {
  const { t, i18n } = useTranslation();

  const change = async (code: string) => {
    await i18n.changeLanguage(code);
    const { data } = await supabase.auth.getUser();
    if (data.user) await supabase.from('profiles').update({ language: code }).eq('id', data.user.id);
  };

  return (
    <div role="group" aria-label={t('common.language')}
      className={cn('inline-flex max-w-full flex-wrap items-center rounded-full p-1 text-footnote font-semibold', dark ? 'bg-sidebar-fill/60 text-sidebar-secondary' : 'bg-fill-secondary text-label-secondary', className)}>
      <Globe className="mx-2 h-4 w-4" aria-hidden="true" />
      {LANGUAGES.map((l) => (
        <button key={l.code} type="button" onClick={() => void change(l.code)} title={l.label} aria-label={l.label} aria-pressed={i18n.language === l.code}
          className={cn('focus-ring min-h-11 min-w-11 rounded-full px-2 transition-colors',
            i18n.language === l.code
              ? dark ? 'bg-sidebar-label text-sidebar shadow-soft' : 'bg-surface-secondary text-accent shadow-soft'
              : dark ? 'hover:bg-sidebar-fill hover:text-sidebar-label' : 'hover:bg-fill hover:text-label',
          )}>
          {l.short}
        </button>
      ))}
    </div>
  );
}
