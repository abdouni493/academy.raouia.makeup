import { HttpError, handleError, json, preflight, readJson } from '../_shared/cors.ts';
import { adminClient, requireUser } from '../_shared/supabase.ts';
import { bunnyEnv, sha256Hex } from '../_shared/bunny.ts';

const TTL_SECONDS = 3 * 3600;

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;
  try {
    if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed');
    const { profile } = await requireUser(req);
    const { video_id } = await readJson<{ video_id?: string }>(req);
    if (!video_id) throw new HttpError(400, 'video_id is required');

    const { data: video } = await adminClient
      .from('videos')
      .select('id, bunny_video_id, status, is_free_preview, formation_id, formations!inner(is_published)')
      .eq('id', video_id)
      .maybeSingle();
    if (!video) throw new HttpError(404, 'Video not found');

    const formation = video.formations as unknown as { is_published: boolean };
    let allowed = profile.role === 'admin';
    if (!allowed && formation?.is_published) {
      if (video.is_free_preview) {
        allowed = true;
      } else {
        const { data: hasAccess, error } = await adminClient.rpc('user_has_formation_access', {
          p_user_id: profile.id,
          p_formation_id: video.formation_id,
        });
        if (error) throw new HttpError(500, error.message);
        allowed = hasAccess === true;
      }
    }
    if (!allowed) throw new HttpError(403, 'You do not have access to this video');
    if (video.status !== 'ready' || !video.bunny_video_id) {
      throw new HttpError(409, 'Video is not ready yet');
    }

    const { libraryId, tokenAuthKey } = bunnyEnv();
    if (!tokenAuthKey) throw new HttpError(500, 'BUNNY_TOKEN_AUTH_KEY is not configured');

    const expires = Math.floor(Date.now() / 1000) + TTL_SECONDS;
    const token = await sha256Hex(`${tokenAuthKey}${video.bunny_video_id}${expires}`);
    const embedUrl =
      `https://iframe.mediadelivery.net/embed/${libraryId}/${video.bunny_video_id}` +
      `?token=${token}&expires=${expires}&autoplay=false&preload=true&responsive=true`;

    return json({ embedUrl, expiresAt: new Date(expires * 1000).toISOString() });
  } catch (err) {
    return handleError(err);
  }
});
