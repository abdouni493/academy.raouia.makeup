import type { ReactNode } from 'react';
import { Brush, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/Logo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

/** A quiet brand canvas beside a focused, inset authentication surface. */
export function AuthShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="grid min-h-dvh bg-surface lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden border-e border-separator/60 bg-blush-gradient p-12 lg:flex xl:p-16">
        <Logo />
        <div className="py-12">
          <div className="relative mb-12 flex h-48 items-end gap-4" aria-hidden="true">
            <div className="flex h-48 w-32 items-center justify-center rounded-t-full rounded-b-3xl border border-rosegold/20 bg-surface-secondary/60">
              <Brush className="h-16 w-16 text-rosegold" strokeWidth={1} />
            </div>
            <div className="h-36 w-16 rounded-full bg-brand-gradient" />
            <div className="h-24 w-16 rounded-full bg-rosegold-light" />
            <Sparkles className="absolute start-52 top-0 h-6 w-6 text-rosegold" />
          </div>
          <h2 className="max-w-lg font-brand text-4xl font-medium leading-tight xl:text-5xl">{t('auth.tagline')}</h2>
          <p className="mt-6 max-w-md text-body text-label-secondary">{t('auth.taglineSub')}</p>
        </div>
        <div className="text-footnote text-label-secondary">© {new Date().getFullYear()}</div>
      </aside>
      <section className="relative flex min-w-0 flex-col px-6 py-6 sm:px-12 lg:px-8 xl:px-16">
        <div className="flex flex-wrap items-center justify-between gap-4 lg:justify-end">
          <Logo className="lg:hidden" />
          <LanguageSwitcher />
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12 sm:py-16">{children}</div>
      </section>
    </div>
  );
}
