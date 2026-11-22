import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button, Field, Input, Modal, Select, Switch, Textarea } from '@/components/ui';
import { CoverUpload } from '@/components/CoverUpload';
import { supabase } from '@/lib/supabase';
import { slugify } from '@/lib/utils';
import type { Formation } from '@/types/database';

const schema = z.object({
  title: z.string().trim().min(2),
  slug: z
    .string()
    .trim()
    .min(2)
    .regex(/^[a-z0-9؀-ۿ]+(?:-[a-z0-9؀-ۿ]+)*$/),
  short_description: z.string().optional(),
  description: z.string().optional(),
  level: z.enum(['beginner', 'intermediate', 'pro']),
});
type Values = z.infer<typeof schema>;

export function FormationFormModal({
  open,
  onClose,
  formation,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  formation?: Formation | null;
  onSaved?: (f: Formation) => void;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [cover, setCover] = useState<string | null>(null);
  const [published, setPublished] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const { register, handleSubmit, reset, watch, setValue, formState, setError } = useForm<Values>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!open) return;
    reset({
      title: formation?.title ?? '',
      slug: formation?.slug ?? '',
      short_description: formation?.short_description ?? '',
      description: formation?.description ?? '',
      level: formation?.level ?? 'beginner',
    });
    setCover(formation?.cover_url ?? null);
    setPublished(formation?.is_published ?? false);
    setSlugTouched(!!formation);
  }, [open, formation, reset]);

  const title = watch('title');
  useEffect(() => {
    if (!slugTouched && title !== undefined) setValue('slug', slugify(title));
  }, [title, slugTouched, setValue]);

  const onSubmit = async (v: Values) => {
    const payload = {
      title: v.title.trim(),
      slug: v.slug.trim(),
      short_description: v.short_description?.trim() || null,
      description: v.description?.trim() || null,
      level: v.level,
      cover_url: cover,
      is_published: published,
    };
    let result;
    if (formation) {
      result = await supabase.from('formations').update(payload).eq('id', formation.id).select('*').single();
    } else {
      const { data: last } = await supabase.from('formations').select('sort_order').order('sort_order', { ascending: false }).limit(1).maybeSingle();
      result = await supabase
        .from('formations')
        .insert({ ...payload, sort_order: (last?.sort_order ?? -1) + 1 })
        .select('*')
        .single();
    }
    if (result.error) {
      if (result.error.code === '23505') setError('slug', { message: t('formations.slugTaken') });
      else toast.error(result.error.message);
      return;
    }
    toast.success(t('common.saved'));
    void qc.invalidateQueries({ queryKey: ['admin', 'formations'] });
    void qc.invalidateQueries({ queryKey: ['admin', 'formation', result.data.id] });
    onSaved?.(result.data);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={formation ? t('formations.edit') : t('formations.new')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={formState.isSubmitting}>
            {formation ? t('common.save') : t('common.create')}
          </Button>
        </>
      }
    >
      <form className="grid gap-4 sm:grid-cols-2 sm:gap-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="sm:col-span-2">
          <CoverUpload value={cover} onChange={setCover} folder="formations" />
        </div>
        <Field label={t('formations.fieldTitle')} error={formState.errors.title && t('common.required')} className="sm:col-span-2">
          <Input {...register('title')} invalid={!!formState.errors.title} />
        </Field>
        <Field label={t('formations.slug')} error={formState.errors.slug?.message || (formState.errors.slug && t('common.required'))}>
          <Input dir="ltr" {...register('slug', { onChange: () => setSlugTouched(true) })} invalid={!!formState.errors.slug} />
        </Field>
        <Field label={t('formations.level')}>
          <Select {...register('level')}>
            <option value="beginner">{t('levels.beginner')}</option>
            <option value="intermediate">{t('levels.intermediate')}</option>
            <option value="pro">{t('levels.pro')}</option>
          </Select>
        </Field>
        <Field label={t('formations.shortDescription')} className="sm:col-span-2">
          <Input maxLength={200} {...register('short_description')} />
        </Field>
        <Field label={t('formations.description')} className="sm:col-span-2">
          <Textarea rows={5} {...register('description')} />
        </Field>
        <div className="sm:col-span-2">
          <Switch checked={published} onChange={setPublished} label={t('formations.published')} />
        </div>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
