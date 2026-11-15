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

export const api = {
  bootstrapAdmin: (p: { email: string; password: string; full_name: string }) =>
    callFunction<{ ok: true }>('bootstrap-admin', p),
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
  deleteFormation: (formation_id: string) =>
    callFunction<{ ok: true }>('bunny-delete-video', { action: 'delete_formation', formation_id }),
  clients: {
    create: (p: { email: string; password: string; full_name: string; phone?: string; notes?: string }) =>
      callFunction<{ profile: Profile }>('admin-clients', { action: 'create', ...p }),
    update: (p: { user_id: string; email?: string; full_name?: string; phone?: string | null; notes?: string | null }) =>
      callFunction<{ profile: Profile }>('admin-clients', { action: 'update', ...p }),
    resetPassword: (user_id: string, password: string) =>
      callFunction<{ ok: true }>('admin-clients', { action: 'reset_password', user_id, password }),
    setActive: (user_id: string, is_active: boolean) =>
      callFunction<{ profile: Profile }>('admin-clients', { action: 'set_active', user_id, is_active }),
    remove: (user_id: string) => callFunction<{ ok: true }>('admin-clients', { action: 'delete', user_id }),
  },
};
