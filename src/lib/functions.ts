import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Profile, Video } from '@/types/database';

/** Invokes an Edge Function and turns `{ error }` JSON bodies into thrown Errors. */
export async function callFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    let message = error.message;
    if (error instanceof FunctionsHttpError) {
      try {
        const payload = await error.context.json();
        if (payload?.error) message = payload.error;
      } catch {
        /* keep default message */
      }
    }
    throw new Error(message);
  }
  return data as T;
}

export interface TusInfo {
  endpoint: string;
  libraryId: string;
  videoId: string;
  signature: string;
  expire: number;
}

/** Runs a database function (RPC) and throws its error message. */
async function rpc<T>(promise: PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await promise;
  if (error) throw new Error(error.message);
  return data as T;
}

export const api = {
  // Accounts are managed by SQL functions (see 0001_init.sql §13) — no Edge Function needed.
  bootstrapAdmin: (p: { email: string; password: string; full_name: string }) =>
    rpc<string>(supabase.rpc('create_first_admin', { p_email: p.email, p_password: p.password, p_full_name: p.full_name })),
  clients: {
    create: (p: { email: string; password: string; full_name: string; phone?: string; notes?: string }) =>
      rpc<Profile>(
        supabase.rpc('admin_create_client', {
          p_email: p.email,
          p_password: p.password,
          p_full_name: p.full_name,
          p_phone: p.phone ?? null,
          p_notes: p.notes ?? null,
        }),
      ).then((profile) => ({ profile })),
    update: (p: { user_id: string; email: string; full_name: string; phone: string | null; notes: string | null }) =>
      rpc<Profile>(
        supabase.rpc('admin_update_client', {
          p_user_id: p.user_id,
          p_email: p.email,
          p_full_name: p.full_name,
          p_phone: p.phone ?? '',
          p_notes: p.notes ?? '',
        }),
      ).then((profile) => ({ profile })),
    resetPassword: (user_id: string, password: string) =>
      rpc<null>(supabase.rpc('admin_reset_password', { p_user_id: user_id, p_password: password })),
    setActive: (user_id: string, is_active: boolean) =>
      rpc<Profile>(supabase.rpc('admin_set_client_active', { p_user_id: user_id, p_active: is_active })).then((profile) => ({
        profile,
      })),
    remove: (user_id: string) => rpc<null>(supabase.rpc('admin_delete_client', { p_user_id: user_id })),
  },
  // Video features talk to Bunny Stream and need the deployed Edge Functions.
  createUpload: (p: { formation_id: string; section_id?: string | null; title: string }) =>
    callFunction<{ video_row: Video; tus: TusInfo }>('bunny-create-upload', p),
  getPlayback: (video_id: string) =>
    callFunction<{ embedUrl: string; expiresAt: string }>('get-playback', { video_id }),
  deleteVideo: (video_id: string) => callFunction<{ ok: true }>('bunny-delete-video', { action: 'delete', video_id }),
  refreshVideo: (video_id: string) =>
    callFunction<{ video: Video; bunny_status: number | null; encode_progress: number | null }>('bunny-delete-video', {
      action: 'refresh_status',
      video_id,
    }),
  deleteFormation: async (formation_id: string) => {
    // No videos → nothing to remove from Bunny: delete directly in the database.
    const { count } = await supabase.from('videos').select('id', { count: 'exact', head: true }).eq('formation_id', formation_id);
    if (!count) {
      const { error } = await supabase.from('formations').delete().eq('id', formation_id);
      if (error) throw new Error(error.message);
      return { ok: true as const };
    }
    return callFunction<{ ok: true }>('bunny-delete-video', { action: 'delete_formation', formation_id });
  },
};
