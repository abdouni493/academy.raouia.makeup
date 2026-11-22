import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/Logo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { BRAND_NAME } from '@/lib/config';

export function AuthShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();

  return (
    <div className="mx-auto flex min-h-dvh max-w-screen-2xl flex-col bg-surface px-4 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] sm:px-8 lg:px-10">
      <header className="flex flex-wrap items-center justify-between gap-2 py-4 lg:py-6">
        <Logo />
        <div className="ms-auto flex flex-wrap items-center justify-end gap-3">
          <LanguageSwitcher className="hidden sm:inline-flex" />
          <ThemeSwitcher />
        </div>
      </header>

      <main className="grid flex-1 content-start gap-8 lg:grid-cols-[1fr_0.95fr] lg:content-stretch lg:gap-0 lg:pb-6">
        <aside className="relative isolate overflow-hidden rounded-3xl bg-surface-secondary lg:min-h-[36rem]">
          <img
            className="absolute inset-0 h-full w-full object-cover object-[50%_64%] lg:object-center"
            src="/brand/academy-studio.webp"
            alt=""
            fetchPriority="high"
          />
          <div className="h-32 sm:h-52 lg:hidden" />
          <div className="absolute inset-x-0 bottom-0 hidden bg-gradient-to-t from-black/95 via-black/80 to-transparent px-10 pb-10 pt-24 lg:block xl:px-14 xl:pb-14">
            <h2 className="max-w-lg font-brand text-[clamp(2rem,3.3vw,3.5rem)] font-medium leading-[1.1] tracking-tight text-white">{t('auth.tagline')}</h2>
            <p className="mt-4 max-w-sm text-callout text-white">{t('auth.taglineSub')}</p>
          </div>
        </aside>
        <section className="mx-auto flex w-full min-w-0 max-w-md flex-col justify-center px-2 pb-4 sm:px-0 lg:max-w-lg lg:px-10 lg:py-12">
          {children}
        </section>
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-separator py-4 text-footnote text-label-secondary">
        <span dir="ltr">© {new Date().getFullYear()} {BRAND_NAME}</span>
        <LanguageSwitcher className="sm:hidden" />
      </footer>
    </div>
  );
}
