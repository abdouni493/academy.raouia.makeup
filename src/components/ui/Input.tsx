import { createContext, forwardRef, useContext, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const FieldContext = createContext<{ descriptionId?: string; invalid?: boolean }>({});
const base =
  'w-full min-w-0 rounded-xl border border-control-border bg-surface-tertiary/60 px-4 text-callout text-label placeholder:text-label-tertiary transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  function Input({ className, invalid, ...rest }, ref) {
    const field = useContext(FieldContext);
    return <input ref={ref} aria-invalid={invalid || field.invalid || undefined} aria-describedby={field.descriptionId} className={cn(base, 'min-h-12 py-3', invalid && 'border-danger focus:border-danger focus:ring-danger', className)} {...rest} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, rows = 4, ...rest },
  ref,
) {
  const field = useContext(FieldContext);
  return <textarea ref={ref} rows={rows} aria-invalid={field.invalid || undefined} aria-describedby={field.descriptionId} className={cn(base, 'py-3 leading-relaxed', className)} {...rest} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...rest },
  ref,
) {
  const field = useContext(FieldContext);
  return (
    <select ref={ref} aria-invalid={field.invalid || undefined} aria-describedby={field.descriptionId} className={cn(base, 'min-h-12 appearance-auto py-3 pe-8', className)} {...rest}>
      {children}
    </select>
  );
});

export function Field({
  label,
  error,
  hint,
  children,
  className,
}: {
  label?: ReactNode;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const descriptionId = useId();
  return (
    <FieldContext.Provider value={{ descriptionId: error || hint ? descriptionId : undefined, invalid: !!error }}>
      <label className={cn('block space-y-2', className)}>
        {label && <span className="block text-subhead font-medium text-label">{label}</span>}
        {children}
        {error ? <span id={descriptionId} role="alert" className="block text-footnote text-danger">{error}</span> : hint ? <span id={descriptionId} className="block text-footnote text-label-secondary">{hint}</span> : null}
      </label>
    </FieldContext.Provider>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="focus-ring group inline-flex min-h-11 items-center gap-3 rounded-xl text-start disabled:opacity-50"
    >
      <span
        aria-hidden="true"
        className={cn(
          'relative inline-flex h-8 w-[52px] shrink-0 items-center rounded-full border transition-colors duration-150',
          checked ? 'border-accent bg-accent' : 'border-control-border bg-fill',
        )}
      >
        <span
          className={cn(
            'absolute h-[26px] w-[26px] rounded-full bg-surface-secondary shadow-soft transition-[inset-inline-start] duration-200',
            checked ? 'start-[22px]' : 'start-0.5',
          )}
        />
      </span>
      {label && <span className="text-subhead text-label">{label}</span>}
    </button>
  );
}
