import { createContext, forwardRef, useContext, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const FieldContext = createContext<{ descriptionId?: string; invalid?: boolean }>({});
const base =
  'w-full min-w-0 rounded-xl border border-control-border bg-fill-quaternary px-4 text-callout text-label placeholder:text-label-tertiary aria-invalid:border-danger aria-invalid:focus:ring-danger transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50';

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
    <span className="relative block">
      <select ref={ref} aria-invalid={field.invalid || undefined} aria-describedby={field.descriptionId} className={cn(base, 'min-h-12 py-3', !rest.multiple && !rest.size && 'appearance-none pe-11', className)} {...rest}>
        {children}
      </select>
      {!rest.multiple && !rest.size && <ChevronsUpDown aria-hidden="true" className="pointer-events-none absolute end-4 top-1/2 h-4 w-4 -translate-y-1/2 text-label-secondary" />}
    </span>
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
      className="focus-ring press-feedback inline-flex min-h-11 items-center gap-3 rounded-xl text-start disabled:opacity-50"
    >
      <span
        aria-hidden="true"
        className={cn(
          'relative inline-flex h-8 w-[52px] shrink-0 items-center rounded-full border shadow-[inset_0_1px_2px_rgb(0_0_0/0.07)] transition-colors duration-150',
          checked ? 'border-transparent bg-success' : 'border-control-border bg-fill',
        )}
      >
        <span
          className={cn(
            'absolute start-0.5 h-[26px] w-[26px] rounded-full bg-white shadow-[0_1px_3px_rgb(0_0_0/0.28)] transition-transform duration-200 ease-out',
            checked ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0',
          )}
        />
      </span>
      {label && <span className="text-subhead text-label">{label}</span>}
    </button>
  );
}
