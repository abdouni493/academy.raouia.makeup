import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle' | 'filled' | 'tinted' | 'gray' | 'plain' | 'destructive';
type Size = 'sm' | 'md' | 'lg' | 'icon';

const filled = 'bg-accent text-accent-contrast shadow-soft hover:bg-accent-pressed active:bg-accent-pressed';
const tinted = 'bg-accent-soft text-accent hover:bg-fill active:bg-fill';
const plain = 'text-accent hover:bg-accent-soft active:bg-fill';
const destructive = 'bg-danger-soft text-danger hover:bg-danger/15 active:bg-danger/20';
const variants: Record<Variant, string> = {
  primary: filled,
  filled,
  secondary: tinted,
  tinted,
  ghost: plain,
  plain,
  subtle: 'bg-fill-secondary text-label hover:bg-fill active:bg-fill',
  gray: 'bg-fill-secondary text-label hover:bg-fill active:bg-fill',
  danger: destructive,
  destructive,
};
const sizes: Record<Size, string> = {
  sm: 'min-h-11 px-3 py-2 text-subhead gap-2',
  md: 'min-h-11 px-5 py-2 text-callout gap-2',
  lg: 'min-h-12 px-6 py-3 text-headline gap-2',
  icon: 'h-11 w-11 justify-center',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, icon, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      aria-label={rest['aria-label'] ?? (size === 'icon' ? rest.title : undefined)}
      className={cn(
        'focus-ring press-feedback inline-flex max-w-full shrink-0 items-center justify-center rounded-xl text-center font-semibold disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" /> : icon}
      {children}
    </button>
  );
});
