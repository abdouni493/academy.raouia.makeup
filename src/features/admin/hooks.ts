import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/** Persists a new order by writing sort_order = index for each changed row. */
export async function persistOrder(
  table: 'formations' | 'sections' | 'videos' | 'packs',
  rows: { id: string; sort_order: number }[],
) {
  const changed = rows.map((r, i) => ({ ...r, next: i })).filter((r) => r.sort_order !== r.next);
  const results = await Promise.all(changed.map((r) => supabase.from(table).update({ sort_order: r.next }).eq('id', r.id)));
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}

/** Realtime: refresh admin video queries when a video row changes. */
export function useVideosRealtime(formationId?: string) {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel(`videos-${formationId ?? 'all'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'videos',
          ...(formationId ? { filter: `formation_id=eq.${formationId}` } : {}),
        },
        () => {
          void qc.invalidateQueries({ queryKey: ['admin', 'videos'] });
          void qc.invalidateQueries({ queryKey: ['admin', 'attention'] });
          void qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [formationId, qc]);
}
