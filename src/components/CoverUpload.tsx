import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { uploadCover } from '@/lib/storage';
import { errorMessage } from '@/lib/utils';

export function CoverUpload({ value, onChange, folder }: { value: string | null; onChange: (url: string | null) => void; folder: 'formations' | 'packs' }) {
  const { t } = useTranslation();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pick = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      onChange(await uploadCover(file, folder));
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div className="space-y-1.5">
      <span className="block text-sm font-medium text-plum">{t('formations.cover')}</span>
      <div
        className="group relative flex aspect-[16/9] w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-blush-200 bg-blush-50 transition hover:border-blush-400"
        onClick={() => input.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void pick(e.dataTransfer.files?.[0]);
        }}
      >
        {value ? (
          <>
            <img src={value} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-plum/50 opacity-0 transition group-hover:opacity-100">
              <span className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-plum">{t('formations.changeCover')}</span>
              <button
                type="button"
                className="rounded-lg bg-white p-1.5 text-red-500"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted">
            {busy ? <Loader2 className="h-7 w-7 animate-spin text-blush-500" /> : <ImagePlus className="h-7 w-7 text-blush-400" />}
            <span className="text-xs">{t('formations.coverHint')}</span>
          </div>
        )}
        {busy && value && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60">
            <Loader2 className="h-7 w-7 animate-spin text-blush-500" />
          </div>
        )}
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => void pick(e.target.files?.[0])} />
    </div>
  );
}
