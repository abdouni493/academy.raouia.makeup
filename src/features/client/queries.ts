import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/AuthProvider';
import type { CatalogEntry, Formation, OutlineItem, Pack, Section, Video, VideoProgress } from '@/types/database';

export function useCatalog() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['catalog', session?.user.id],
    queryFn: async (): Promise<CatalogEntry[]> => {
      const { data, error } = await supabase.from('public_catalog').select('*').order('sort_order').order('title');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export type PackWithFormations = Pack & { formation_ids: string[]; owned: boolean };

export function usePublishedPacks() {
  const { session } = useAuth();
  const uid = session?.user.id;
  return useQuery({
    queryKey: ['packs', 'published', uid],
    queryFn: async (): Promise<PackWithFormations[]> => {
      const [packsRes, grantsRes] = await Promise.all([
        supabase.from('packs').select('*, pack_formations(formation_id, sort_order)').eq('is_published', true).order('sort_order'),
        supabase.from('access_grants').select('pack_id, starts_at, expires_at').eq('user_id', uid!).not('pack_id', 'is', null),
      ]);
      if (packsRes.error) throw packsRes.error;
      const now = Date.now();
      const owned = new Set(
        (grantsRes.data ?? [])
          .filter((g) => new Date(g.starts_at).getTime() <= now && (!g.expires_at || new Date(g.expires_at).getTime() > now))
          .map((g) => g.pack_id),
      );
      return (packsRes.data ?? []).map((p) => {
        const { pack_formations, ...rest } = p as Pack & { pack_formations: { formation_id: string; sort_order: number }[] };
        return {
          ...rest,
          formation_ids: [...(pack_formations ?? [])].sort((a, b) => a.sort_order - b.sort_order).map((pf) => pf.formation_id),
          owned: owned.has(p.id),
        };
      });
    },
    enabled: !!uid,
  });
}

export function useMyProgress() {
  const { session } = useAuth();
  const uid = session?.user.id;
  return useQuery({
    queryKey: ['progress', uid],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('video_progress')
        .select('video_id, completed, last_position_seconds, updated_at, videos(id, title, thumbnail_url, duration_seconds, formation_id, formations(slug, title, cover_url))')
        .eq('user_id', uid!)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ProgressWithVideo[];
    },
    enabled: !!uid,
  });
}

export type ProgressWithVideo = {
  video_id: string;
  completed: boolean;
  last_position_seconds: number;
  updated_at: string;
  videos: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    duration_seconds: number | null;
    formation_id: string;
    formations: { slug: string; title: string; cover_url: string | null } | null;
  } | null;
};

export interface FormationData {
  formation: Formation;
  sections: Section[];
  videos: Video[];
  outline: OutlineItem[];
  hasAccess: boolean;
  progress: Record<string, VideoProgress>;
}

export function useFormationBySlug(slug: string | undefined) {
  const { session } = useAuth();
  const uid = session?.user.id;
  return useQuery({
    queryKey: ['formation', slug, uid],
    enabled: !!slug && !!uid,
    queryFn: async (): Promise<FormationData | null> => {
      const { data: formation, error } = await supabase.from('formations').select('*').eq('slug', slug!).maybeSingle();
      if (error) throw error;
      if (!formation) return null;
      const [sectionsRes, videosRes, accessRes, outlineRes, progressRes] = await Promise.all([
        supabase.from('sections').select('*').eq('formation_id', formation.id).order('sort_order'),
        supabase.from('videos').select('*').eq('formation_id', formation.id).eq('status', 'ready').order('sort_order').order('created_at'),
        supabase.rpc('has_formation_access', { p_formation_id: formation.id }),
        supabase.rpc('formation_outline', { p_formation_id: formation.id }),
        supabase.from('video_progress').select('*').eq('user_id', uid!),
      ]);
      if (sectionsRes.error) throw sectionsRes.error;
      if (videosRes.error) throw videosRes.error;
      const progress: Record<string, VideoProgress> = {};
      for (const p of progressRes.data ?? []) progress[p.video_id] = p;
      return {
        formation,
        sections: sectionsRes.data ?? [],
        videos: videosRes.data ?? [],
        outline: (outlineRes.data as OutlineItem[] | null) ?? [],
        hasAccess: accessRes.data === true,
        progress,
      };
    },
  });
}
