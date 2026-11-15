import { HttpError, handleError, json, preflight, readJson } from '../_shared/cors.ts';
import { adminClient, requireAdmin } from '../_shared/supabase.ts';
import { bunnyEnv, bunnyFetch, getBunnyVideo, statusPatch } from '../_shared/bunny.ts';

interface Body {
  action?: 'delete' | 'refresh_status' | 'delete_formation';
  video_id?: string;
  formation_id?: string;
}

async function deleteFromBunny(guid: string | null) {
  if (!guid) return;
  const { libraryId } = bunnyEnv();
  const res = await bunnyFetch(`/library/${libraryId}/videos/${guid}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 404) {
    throw new HttpError(502, `Bunny delete failed (${res.status}): ${await res.text()}`);
  }
}

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;
  try {
    if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed');
    await requireAdmin(req);
    const body = await readJson<Body>(req);
    const action = body.action ?? 'delete';

    if (action === 'delete_formation') {
      if (!body.formation_id) throw new HttpError(400, 'formation_id is required');
      const { data: vids } = await adminClient
        .from('videos').select('bunny_video_id').eq('formation_id', body.formation_id);
      for (const v of vids ?? []) await deleteFromBunny(v.bunny_video_id);
      const { error } = await adminClient.from('formations').delete().eq('id', body.formation_id);
      if (error) throw new HttpError(500, error.message);
      return json({ ok: true, deleted_videos: vids?.length ?? 0 });
    }

    if (!body.video_id) throw new HttpError(400, 'video_id is required');
    const { data: video } = await adminClient
      .from('videos').select('id, bunny_video_id').eq('id', body.video_id).maybeSingle();
    if (!video) throw new HttpError(404, 'Video not found');

    if (action === 'refresh_status') {
      if (!video.bunny_video_id) throw new HttpError(400, 'Video has no Bunny id');
      const remote = await getBunnyVideo(video.bunny_video_id);
      const patch = remote ? statusPatch(remote) : { status: 'failed' as const };
      const { data: updated, error } = await adminClient
        .from('videos').update(patch).eq('id', video.id).select('*').single();
      if (error) throw new HttpError(500, error.message);
      return json({ video: updated, bunny_status: remote?.status ?? null, encode_progress: remote?.encodeProgress ?? null });
    }

    await deleteFromBunny(video.bunny_video_id);
    const { error } = await adminClient.from('videos').delete().eq('id', video.id);
    if (error) throw new HttpError(500, error.message);
    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
});
