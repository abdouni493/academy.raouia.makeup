import { useId } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '@/i18n';
import { supabase } from '@/lib/supabase';
import { useReducedMotion, spring } from '@/lib/motion';
import { cn } from '@/lib/utils';

export function LanguageSwitcher({ className }: { className?: string }) {
  const { t, i18n } = useTranslation();
  const id = useId();
  const reduced = useReducedMotion();

  const change = async (code: string) => {
    await i18n.changeLanguage(code);
    const { data } = await supabase.auth.getUser();
    if (data.user) await supabase.from('profiles').update({ language: code }).eq('id', data.user.id);
  };

  return (
    <div role="group" aria-label={t('common.language')} className={cn('glass inline-flex max-w-full flex-wrap items-center rounded-full p-0.5 text-footnote font-semibold', className)}>
      {LANGUAGES.map(({ code, label, short }) => {
        const selected = i18n.language === code;
        return (
          <button key={code} type="button" onClick={() => void change(code)} title={label} lang={code} aria-label={label} aria-pressed={selected}
            className={cn('focus-ring relative flex min-h-11 min-w-11 items-center justify-center rounded-full px-2', selected ? 'text-label' : 'text-label-secondary hover:text-label')}>
            {selected && <motion.span aria-hidden="true" layoutId={reduced ? undefined : id} transition={spring} className="absolute inset-0.5 rounded-full bg-card shadow-soft" />}
            <span className="relative">{short}</span>
          </button>
        );
      })}
    </div>
  );
}
