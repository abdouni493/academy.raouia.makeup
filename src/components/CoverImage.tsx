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
  const gradients = [
    'from-blush-200 via-blush-100 to-champagne',
    'from-rosegold-light via-blush-100 to-nude',
    'from-champagne via-blush-100 to-blush-200',
    'from-nude via-champagne to-blush-100',
  ];
  return (
    <div className={cn('relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br', gradients[n % gradients.length], className)}>
      <Icon className="relative h-12 w-12 text-rosegold" strokeWidth={1.25} />
    </div>
  );
}
