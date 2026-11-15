import type { ReactNode } from 'react';
import { Brush, Gem, Palette, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/Logo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

/** Split-screen frame used by the login & reset pages. */
export function AuthShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="grid min-h-dvh bg-white lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-blush-gradient lg:flex lg:flex-col lg:justify-between lg:p-12">
        {/* Abstract decorative shapes */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -start-24 -top-24 h-96 w-96 rounded-full bg-blush-200/70 blur-3xl" />
          <div className="absolute -bottom-32 -end-16 h-[28rem] w-[28rem] rounded-full bg-champagne blur-3xl" />
          <div className="absolute end-20 top-28 h-44 w-44 animate-float rounded-[42%_58%_63%_37%/41%_44%_56%_59%] bg-gradient-to-br from-blush-300 to-rosegold opacity-80 shadow-glow" />
          <div
            className="absolute bottom-44 start-24 h-28 w-28 animate-float rounded-full border-[10px] border-rosegold-light/80"
            style={{ animationDelay: '-2.5s' }}
          />
          <div className="absolute end-10 top-[45%] h-16 w-16 animate-float rounded-2xl bg-white/70 shadow-soft" style={{ animationDelay: '-4s', rotate: '18deg' }} />
          <svg className="absolute bottom-0 start-0 w-full text-white/50" viewBox="0 0 600 200" preserveAspectRatio="none" aria-hidden>
            <path d="M0 120 C 150 40, 300 200, 600 90 L600 200 L0 200 Z" fill="currentColor" />
          </svg>
        </div>

        <Logo className="relative" />
        <div className="relative max-w-md">
          <div className="mb-6 flex gap-3 text-rosegold">
            {[Brush, Palette, Gem, Sparkles].map((Icon, i) => (
              <span key={i} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70 shadow-soft backdrop-blur">
                <Icon className="h-5 w-5" />
              </span>
            ))}
          </div>
          <h2 className="text-4xl font-semibold leading-tight xl:text-5xl">{t('auth.tagline')}</h2>
          <p className="mt-4 text-lg text-muted">{t('auth.taglineSub')}</p>
        </div>
        <div className="relative text-xs text-muted">© {new Date().getFullYear()}</div>
      </aside>

      <section className="relative flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between">
          <Logo className="lg:invisible" />
          <LanguageSwitcher />
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">{children}</div>
      </section>
    </div>
  );
}
