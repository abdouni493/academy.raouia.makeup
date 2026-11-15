import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button, Field, Input, Modal, Select, Switch, Textarea } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import type { Section, Video } from '@/types/database';

export function VideoEditModal({ video, sections, onClose }: { video: Video | null; sections: Section[]; onClose: () => void }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [free, setFree] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!video) return;
    setTitle(video.title);
    setDescription(video.description ?? '');
    setSectionId(video.section_id ?? '');
    setFree(video.is_free_preview);
  }, [video]);

  const save = async () => {
    if (!video || !title.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from('videos')
      .update({ title: title.trim(), description: description.trim() || null, section_id: sectionId || null, is_free_preview: free })
      .eq('id', video.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(t('common.saved'));
    void qc.invalidateQueries({ queryKey: ['admin', 'videos', video.formation_id] });
    onClose();
  };

  return (
    <Modal
      open={!!video}
      onClose={onClose}
      title={t('videos.editVideo')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={() => void save()} loading={saving} disabled={!title.trim()}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <Field label={t('videos.fieldTitle')}>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label={t('videos.description')}>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <Field label={t('videos.section')}>
          <Select value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
            <option value="">{t('sections.noSection')}</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </Select>
        </Field>
        <Switch checked={free} onChange={setFree} label={t('videos.freePreview')} />
      </div>
    </Modal>
  );
}
