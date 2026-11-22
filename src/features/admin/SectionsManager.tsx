import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Check, FolderOpen, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button, ConfirmDialog, Input } from '@/components/ui';
import { SortableList } from '@/components/SortableList';
import { supabase } from '@/lib/supabase';
import { errorMessage } from '@/lib/utils';
import type { Section } from '@/types/database';
import { persistOrder } from './hooks';

export function SectionsManager({ formationId, sections }: { formationId: string; sections: Section[] }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleting, setDeleting] = useState<Section | null>(null);
  const key = ['admin', 'sections', formationId];
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: key });
    void qc.invalidateQueries({ queryKey: ['admin', 'videos', formationId] });
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    const next = sections.reduce((m, s) => Math.max(m, s.sort_order), -1) + 1;
    const { error } = await supabase.from('sections').insert({ formation_id: formationId, title: newTitle.trim(), sort_order: next });
    setAdding(false);
    if (error) return toast.error(error.message);
    setNewTitle('');
    refresh();
  };

  const rename = async (id: string) => {
    if (!editTitle.trim()) return;
    const { error } = await supabase.from('sections').update({ title: editTitle.trim() }).eq('id', id);
    if (error) return toast.error(error.message);
    setEditingId(null);
    refresh();
  };

  const remove = async () => {
    if (!deleting) return;
    const { error } = await supabase.from('sections').delete().eq('id', deleting.id);
    if (error) toast.error(error.message);
    else toast.success(t('common.deleted'));
    setDeleting(null);
    refresh();
  };

  const reorder = async (next: Section[]) => {
    qc.setQueryData(key, next);
    try {
      await persistOrder('sections', next);
    } catch (e) {
      toast.error(errorMessage(e));
    }
    refresh();
  };

  return (
    <div className="space-y-4">
      {sections.length === 0 ? (
        <p className="rounded-xl bg-surface-tertiary p-4 text-sm text-label-secondary">{t('sections.empty')}</p>
      ) : (
        <SortableList
          items={sections}
          onReorder={(n) => void reorder(n)}
          className="space-y-2"
          renderItem={(s, handle, index) => (
            <div className="flex items-center gap-2 rounded-xl border border-separator/60 bg-surface-secondary px-2 py-2">
              {handle}
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-xs font-semibold text-accent">{index + 1}</span>
              {editingId === s.id ? (
                <form
                  className="flex flex-1 items-center gap-1"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void rename(s.id);
                  }}
                >
                  <Input autoFocus className="min-h-11" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                  <Button type="submit" size="icon" variant="subtle">
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </form>
              ) : (
                <>
                  <span className="flex min-w-0 flex-1 items-center gap-2 text-sm font-medium text-label">
                    <FolderOpen className="h-4 w-4 shrink-0 text-rosegold" />
                    <span className="truncate">{s.title}</span>
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    title={t('sections.rename')}
                    onClick={() => {
                      setEditingId(s.id);
                      setEditTitle(s.title);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-danger hover:bg-danger-soft" onClick={() => setDeleting(s)} title={t('common.delete')}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          )}
        />
      )}
      <form onSubmit={add} className="flex gap-2">
        <Input placeholder={t('sections.newTitle')} value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
        <Button type="submit" variant="secondary" loading={adding} icon={<Plus className="h-4 w-4" />} title={t('sections.add')} aria-label={t('sections.add')} />
      </form>
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => void remove()}
        title={t('sections.deleteConfirm')}
        description={t('sections.deleteText')}
        confirmLabel={t('common.delete')}
      />
    </div>
  );
}
