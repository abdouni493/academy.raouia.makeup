import { supabase } from './supabase';
import { COVERS_BUCKET } from './config';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

export async function uploadCover(file: File, folder: 'formations' | 'packs'): Promise<string> {
  if (!ALLOWED.includes(file.type)) throw new Error('JPEG, PNG or WEBP only');
  if (file.size > MAX_BYTES) throw new Error('Max 5 MB');
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(COVERS_BUCKET).upload(path, file, {
    cacheControl: '31536000',
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  return supabase.storage.from(COVERS_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Best-effort removal of a cover previously uploaded to our bucket. */
export async function removeCover(url: string | null | undefined): Promise<void> {
  if (!url) return;
  const marker = `/object/public/${COVERS_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return;
  await supabase.storage.from(COVERS_BUCKET).remove([url.slice(idx + marker.length)]);
}
