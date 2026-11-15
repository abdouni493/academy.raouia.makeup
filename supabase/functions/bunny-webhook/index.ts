import { json, preflight } from '../_shared/cors.ts';
import { adminClient } from '../_shared/supabase.ts';
import { bunnyEnv, getBunnyVideo, statusPatch } from '../_shared/bunny.ts';

/**
 * Public endpoint called by Bunny Stream on every encoding status change.
 * URL: https://<project>.supabase.co/functions/v1/bunny-webhook?secret=<BUNNY_WEBHOOK_SECRET>
 * The body is never trusted: we re-fetch the video from the Bunny API.
 */
Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;

  const url = new URL(req.url);
  const expected = Deno.env.get('BUNNY_WEBHOOK_SECRET');
  if (!expected || url.searchParams.get('secret') !== expected) {
    return json({ error: 'Unauthorized' }, 401);
  }
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let payload: { VideoLibraryId?: number | string; VideoGuid?: string; Status?: number } = {};
  try {
    payload = await req.json();
  } catch {
    return json({ ok: true, ignored: 'invalid body' });
  }

  try {
    const { libraryId } = bunnyEnv();
    const guid = payload.VideoGuid;
    if (!guid || String(payload.VideoLibraryId) !== String(libraryId)) {
      return json({ ok: true, ignored: 'unknown library or missing guid' });
    }

    const { data: row } = await adminClient
      .from('videos').select('id').eq('bunny_video_id', guid).maybeSingle();
    if (!row) return json({ ok: true, ignored: 'video not tracked' });

    const video = await getBunnyVideo(guid);
    if (!video) {
      await adminClient.from('videos').update({ status: 'failed' }).eq('id', row.id);
      return json({ ok: true, status: 'failed' });
    }

    const patch = statusPatch(video);
    await adminClient.from('videos').update(patch).eq('id', row.id);
    return json({ ok: true, status: patch.status });
  } catch (err) {
    // Always answer 200 so Bunny doesn't hammer us; the admin can "refresh status" manually.
    console.error('bunny-webhook error', err);
    return json({ ok: false });
  }
});
