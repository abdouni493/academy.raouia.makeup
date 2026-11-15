import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('scrollbar-thin overflow-x-auto', className)}>
      <table className="w-full min-w-[640px] text-sm">{children}</table>
    </div>
  );
}
export function THead({ children }: { children: ReactNode }) {
  return <thead className="bg-blush-50/80 text-xs uppercase tracking-wide text-muted">{children}</thead>;
}
export function Th({ className, ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn('px-5 py-3 text-start font-semibold', className)} {...rest} />;
}
export function Tr({ className, ...rest }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn('border-t border-blush-100 transition hover:bg-blush-50/60', className)} {...rest} />;
}
export function Td({ className, ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-5 py-3.5 align-middle', className)} {...rest} />;
}
