import { Brush, Crown, Gem, Palette, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const icons = [Brush, Palette, Gem, Sparkles];

/** Shows a cover or an elegant generated placeholder (no stock photos). */
export function CoverImage({ src, alt, seed = '', pack = false, className }: { src?: string | null; alt: string; seed?: string; pack?: boolean; className?: string }) {
  if (src) {
    return <img src={src} alt={alt} loading="lazy" className={cn('h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:scale-[1.02]', className)} />;
  }
  const n = Array.from(seed).reduce((a, c) => a + c.charCodeAt(0), 0);
  const Icon = pack ? Crown : icons[n % icons.length];
  // Elegant generated placeholders in the beauty palette (no stock photos).
  const fills = [
    'bg-blush-gradient',
    'bg-champagne-gradient',
    'bg-gradient-to-br from-blush-100 to-blush-200',
    'bg-gradient-to-br from-background-tertiary to-nude',
  ];
  return (
    <div className={cn('relative flex h-full w-full items-center justify-center overflow-hidden', fills[n % fills.length], className)}>
      <span aria-hidden="true" className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/25 blur-2xl" />
      <Icon className="relative h-12 w-12 text-rosegold/80" strokeWidth={1.25} />
    </div>
  );
}
