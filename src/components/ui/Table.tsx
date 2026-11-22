import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('scrollbar-thin overflow-x-auto overscroll-x-contain', className)}>
      <table className="w-full min-w-[640px] text-subhead">{children}</table>
    </div>
  );
}
export function THead({ children }: { children: ReactNode }) {
  return <thead className="bg-grouped text-footnote text-label-secondary">{children}</thead>;
}
export function Th({ className, ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th scope="col" className={cn('px-4 py-3 text-start font-medium sm:px-6', className)} {...rest} />;
}
export function Tr({ className, ...rest }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn('border-t border-separator transition-colors hover:bg-fill-tertiary', className)} {...rest} />;
}
export function Td({ className, ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-4 py-4 align-middle sm:px-6', className)} {...rest} />;
}
