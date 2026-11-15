// Supabase database types (same shape as `supabase gen types typescript`).
// Regenerate with: npx supabase gen types typescript --project-id <ref> > src/types/database.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = 'admin' | 'client';
export type VideoStatus = 'uploading' | 'processing' | 'ready' | 'failed';
export type Level = 'beginner' | 'intermediate' | 'pro';

type Timestamps = { created_at: string; updated_at: string };

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
  notes: string | null;
  language: string;
} & Timestamps;

export type Formation = {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  cover_url: string | null;
  level: Level;
  is_published: boolean;
  sort_order: number;
} & Timestamps;

export type Section = {
  id: string;
  formation_id: string;
  title: string;
  sort_order: number;
} & Timestamps;

export type Video = {
  id: string;
  formation_id: string;
  section_id: string | null;
  title: string;
  description: string | null;
  bunny_video_id: string | null;
  status: VideoStatus;
  duration_seconds: number | null;
  thumbnail_url: string | null;
  is_free_preview: boolean;
  sort_order: number;
} & Timestamps;

export type Pack = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_url: string | null;
  price: number | null;
  currency: string;
  is_published: boolean;
  sort_order: number;
} & Timestamps;

export type PackFormation = { pack_id: string; formation_id: string; sort_order: number };

export type AccessGrant = {
  id: string;
  user_id: string;
  formation_id: string | null;
  pack_id: string | null;
  starts_at: string;
  expires_at: string | null;
  granted_by: string | null;
  created_at: string;
};

export type VideoProgress = {
  user_id: string;
  video_id: string;
  last_position_seconds: number;
  completed: boolean;
  updated_at: string;
};

export type CatalogEntry = {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  cover_url: string | null;
  level: Level;
  sort_order: number;
  video_count: number;
  total_seconds: number;
  has_access: boolean;
};

export type DashboardStats = {
  clients_count: number;
  active_clients_count: number;
  formations_count: number;
  videos_count: number;
  packs_count: number;
  total_video_minutes: number;
};

export type OutlineItem = {
  id: string;
  section_id: string | null;
  title: string;
  duration_seconds: number | null;
  is_free_preview: boolean;
  sort_order: number;
};

type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type Rel = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};
type TableDef<Row, Insert, Relationships extends Rel[] = []> = {
  Row: Row;
  Insert: Insert;
  Update: Partial<Insert>;
  Relationships: Relationships;
};

export type Database = {
  __InternalSupabase: { PostgrestVersion: '12' };
  public: {
    Tables: {
      profiles: TableDef<Profile, Optional<Profile, 'email' | 'full_name' | 'phone' | 'role' | 'is_active' | 'notes' | 'language' | 'created_at' | 'updated_at'>>;
      formations: TableDef<
        Formation,
        Optional<Formation, 'id' | 'short_description' | 'description' | 'cover_url' | 'level' | 'is_published' | 'sort_order' | 'created_at' | 'updated_at'>
      >;
      sections: TableDef<
        Section,
        Optional<Section, 'id' | 'sort_order' | 'created_at' | 'updated_at'>,
        [
          { foreignKeyName: 'sections_formation_id_fkey'; columns: ['formation_id']; isOneToOne: false; referencedRelation: 'formations'; referencedColumns: ['id'] },
        ]
      >;
      videos: TableDef<
        Video,
        Optional<
          Video,
          'id' | 'section_id' | 'description' | 'bunny_video_id' | 'status' | 'duration_seconds' | 'thumbnail_url' | 'is_free_preview' | 'sort_order' | 'created_at' | 'updated_at'
        >,
        [
          { foreignKeyName: 'videos_formation_id_fkey'; columns: ['formation_id']; isOneToOne: false; referencedRelation: 'formations'; referencedColumns: ['id'] },
          { foreignKeyName: 'videos_section_id_fkey'; columns: ['section_id']; isOneToOne: false; referencedRelation: 'sections'; referencedColumns: ['id'] },
        ]
      >;
      packs: TableDef<Pack, Optional<Pack, 'id' | 'description' | 'cover_url' | 'price' | 'currency' | 'is_published' | 'sort_order' | 'created_at' | 'updated_at'>>;
      pack_formations: TableDef<
        PackFormation,
        Optional<PackFormation, 'sort_order'>,
        [
          { foreignKeyName: 'pack_formations_pack_id_fkey'; columns: ['pack_id']; isOneToOne: false; referencedRelation: 'packs'; referencedColumns: ['id'] },
          { foreignKeyName: 'pack_formations_formation_id_fkey'; columns: ['formation_id']; isOneToOne: false; referencedRelation: 'formations'; referencedColumns: ['id'] },
        ]
      >;
      access_grants: TableDef<
        AccessGrant,
        Optional<AccessGrant, 'id' | 'formation_id' | 'pack_id' | 'starts_at' | 'expires_at' | 'granted_by' | 'created_at'>,
        [
          { foreignKeyName: 'access_grants_user_id_fkey'; columns: ['user_id']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] },
          { foreignKeyName: 'access_grants_formation_id_fkey'; columns: ['formation_id']; isOneToOne: false; referencedRelation: 'formations'; referencedColumns: ['id'] },
          { foreignKeyName: 'access_grants_pack_id_fkey'; columns: ['pack_id']; isOneToOne: false; referencedRelation: 'packs'; referencedColumns: ['id'] },
          { foreignKeyName: 'access_grants_granted_by_fkey'; columns: ['granted_by']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] },
        ]
      >;
      video_progress: TableDef<
        VideoProgress,
        Optional<VideoProgress, 'last_position_seconds' | 'completed' | 'updated_at'>,
        [
          { foreignKeyName: 'video_progress_user_id_fkey'; columns: ['user_id']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] },
          { foreignKeyName: 'video_progress_video_id_fkey'; columns: ['video_id']; isOneToOne: false; referencedRelation: 'videos'; referencedColumns: ['id'] },
        ]
      >;
    };
    Views: {
      public_catalog: { Row: CatalogEntry; Relationships: [] };
      admin_dashboard_stats: { Row: DashboardStats; Relationships: [] };
    };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_active_user: { Args: Record<string, never>; Returns: boolean };
      has_formation_access: { Args: { p_formation_id: string }; Returns: boolean };
      formation_outline: { Args: { p_formation_id: string }; Returns: OutlineItem[] };
      admin_exists: { Args: Record<string, never>; Returns: boolean };
      create_first_admin: { Args: { p_email: string; p_password: string; p_full_name: string }; Returns: string };
      admin_create_client: {
        Args: { p_email: string; p_password: string; p_full_name: string; p_phone?: string | null; p_notes?: string | null };
        Returns: Profile;
      };
      admin_update_client: {
        Args: { p_user_id: string; p_email: string; p_full_name: string; p_phone: string; p_notes: string };
        Returns: Profile;
      };
      admin_reset_password: { Args: { p_user_id: string; p_password: string }; Returns: undefined };
      admin_set_client_active: { Args: { p_user_id: string; p_active: boolean }; Returns: Profile };
      admin_delete_client: { Args: { p_user_id: string }; Returns: undefined };
    };
    Enums: { user_role: UserRole; video_status: VideoStatus };
    CompositeTypes: Record<string, never>;
  };
};
