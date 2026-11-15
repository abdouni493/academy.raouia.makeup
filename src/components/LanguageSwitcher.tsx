import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '@/i18n';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

export function LanguageSwitcher({ dark = false, className }: { dark?: boolean; className?: string }) {
  const { i18n } = useTranslation();

  const change = async (code: string) => {
    await i18n.changeLanguage(code);
    const { data } = await supabase.auth.getUser();
    if (data.user) await supabase.from('profiles').update({ language: code }).eq('id', data.user.id);
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full p-1 text-xs font-semibold',
        dark ? 'bg-white/10 text-white/70' : 'bg-white/80 text-muted ring-1 ring-blush-100',
        className,
      )}
    >
      <Globe className="mx-1 h-3.5 w-3.5 opacity-70" />
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          onClick={() => void change(l.code)}
          title={l.label}
          className={cn(
            'min-w-[30px] rounded-full px-2 py-1 transition',
            i18n.language === l.code
              ? dark
                ? 'bg-white text-plum'
                : 'bg-brand-gradient text-white shadow'
              : dark
                ? 'hover:text-white'
                : 'hover:text-plum',
          )}
        >
          {l.short}
        </button>
      ))}
    </div>
  );
}
