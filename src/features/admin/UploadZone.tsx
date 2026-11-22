import { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Field, Select } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { Section } from '@/types/database';
import { UploadRow } from './uploads/UploadRow';
import { useUploads } from './uploads/UploadProvider';

export function UploadZone({ formationId, sections }: { formationId: string; sections: Section[] }) {
  const { t } = useTranslation();
  const { enqueue, items, clearFinished } = useUploads();
  const [sectionId, setSectionId] = useState('');
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const mine = items.filter((i) => i.formationId === formationId);

  const add = (files: FileList | null) => {
    if (!files?.length) return;
    enqueue(Array.from(files), formationId, sectionId || null);
    if (input.current) input.current.value = '';
  };

  return (
    <div className="space-y-4">
      {sections.length > 0 && (
        <Field label={t('videos.targetSection')} className="max-w-sm">
          <Select value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
            <option value="">{t('sections.noSection')}</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <div
        role="button"
        tabIndex={0}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          add(e.dataTransfer.files);
        }}
        className={cn(
          'focus-ring flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition',
          over ? 'border-accent bg-accent-soft' : 'border-control-border bg-surface-tertiary hover:border-accent hover:bg-fill-secondary',
        )}
      >
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <UploadCloud className="h-6 w-6" />
        </span>
        <div className="font-semibold text-label">{t('videos.dropzone')}</div>
        <div className="mt-1 text-xs text-label-secondary">{t('videos.dropHint')}</div>
        <input ref={input} type="file" accept="video/*" multiple hidden onChange={(e) => add(e.target.files)} />
      </div>
      {mine.length > 0 && (
        <div className="space-y-2">
          {mine.map((i) => (
            <UploadRow key={i.id} item={i} />
          ))}
          {mine.some((i) => ['done', 'error', 'cancelled'].includes(i.state)) && (
            <button onClick={clearFinished} className="focus-ring min-h-11 rounded-lg px-3 text-footnote text-accent hover:bg-accent-soft">
              {t('common.close')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
