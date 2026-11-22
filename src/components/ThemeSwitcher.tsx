import { useId } from 'react';
import { Contrast, Moon, Sun } from 'lucide-react';
import { LayoutGroup, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { spring, useReducedMotion } from '@/lib/motion';
import { setThemeMode, useThemeMode } from '@/lib/theme';
import { cn } from '@/lib/utils';

const choices = [
  { mode: 'system', Icon: Contrast },
  { mode: 'light', Icon: Sun },
  { mode: 'dark', Icon: Moon },
] as const;

export function ThemeSwitcher({ className }: { className?: string }) {
  const { t } = useTranslation();
  const id = useId();
  const mode = useThemeMode();
  const reduce = useReducedMotion();

  return (
    <fieldset className={cn('glass inline-flex w-fit shrink-0 items-center rounded-full p-1', className)}>
      <legend className="sr-only">{t('theme.appearance')}</legend>
      <LayoutGroup id={id}>
        {choices.map(({ mode: value, Icon }) => {
          const selected = mode === value;
          const label = t(`theme.${value}`);
          return (
            <label key={value} className="relative grid h-11 w-11 cursor-pointer place-items-center" title={label}>
              <input type="radio" name={id} className="peer sr-only" value={value}
                checked={selected} onChange={() => setThemeMode(value)} aria-label={label} />
              {selected && (
                <motion.span aria-hidden="true" layoutId={reduce ? undefined : 'selected-theme'} transition={spring}
                  className="absolute inset-0.5 rounded-full bg-card shadow-soft" />
              )}
              <motion.span aria-hidden="true" initial={false}
                animate={{ scale: selected && !reduce ? 1.08 : 1 }} transition={reduce ? { duration: 0 } : spring}
                className={cn('relative grid size-full place-items-center rounded-full peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-current',
                  selected ? 'text-accent' : 'text-label-secondary')}>
                <Icon className="size-[18px]" />
              </motion.span>
            </label>
          );
        })}
      </LayoutGroup>
    </fieldset>
  );
}
