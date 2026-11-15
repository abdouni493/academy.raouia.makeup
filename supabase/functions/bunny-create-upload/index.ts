import { HttpError, handleError, json, preflight, readJson } from '../_shared/cors.ts';
import { adminClient, requireAdmin } from '../_shared/supabase.ts';
import { bunnyEnv, bunnyFetch, sha256Hex } from '../_shared/bunny.ts';

interface Body {
  formation_id?: string;
  section_id?: string | null;
  title?: string;
}

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;
  try {
    if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed');
    await requireAdmin(req);
    const body = await readJson<Body>(req);
    const title = (body.title ?? '').trim();
    if (!body.formation_id || !title) throw new HttpError(400, 'formation_id and title are required');

    const { data: formation } = await adminClient
      .from('formations').select('id').eq('id', body.formation_id).maybeSingle();
    if (!formation) throw new HttpError(404, 'Formation not found');

    if (body.section_id) {
      const { data: section } = await adminClient
        .from('sections').select('id').eq('id', body.section_id)
        .eq('formation_id', body.formation_id).maybeSingle();
      if (!section) throw new HttpError(400, 'Section does not belong to this formation');
    }

    const { libraryId, apiKey } = bunnyEnv();

    // 1. Create the video object in Bunny Stream.
    const res = await bunnyFetch(`/library/${libraryId}/videos`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
    if (!res.ok) throw new HttpError(502, `Bunny create failed (${res.status}): ${await res.text()}`);
    const created = (await res.json()) as { guid: string };
    const videoId = created.guid;

    // 2. Next sort order inside the formation.
    const { data: last } = await adminClient
      .from('videos').select('sort_order').eq('formation_id', body.formation_id)
      .order('sort_order', { ascending: false }).limit(1).maybeSingle();
    const sortOrder = (last?.sort_order ?? -1) + 1;

    // 3. Insert DB row.
    const { data: videoRow, error } = await adminClient
      .from('videos')
      .insert({
        formation_id: body.formation_id,
        section_id: body.section_id ?? null,
        title,
        bunny_video_id: videoId,
        status: 'uploading',
        sort_order: sortOrder,
      })
      .select('*')
      .single();
    if (error) {
      // Roll back the Bunny object so we don't leave orphans.
      await bunnyFetch(`/library/${libraryId}/videos/${videoId}`, { method: 'DELETE' }).catch(() => {});
      throw new HttpError(500, error.message);
    }

    // 4. Presigned TUS signature (valid 6 hours).
    const expire = Math.floor(Date.now() / 1000) + 6 * 3600;
    const signature = await sha256Hex(`${libraryId}${apiKey}${expire}${videoId}`);

    return json({
      video_row: videoRow,
      tus: {
        endpoint: 'https://video.bunnycdn.com/tusupload',
        libraryId,
        videoId,
        signature,
        expire,
      },
    });
  } catch (err) {
    return handleError(err);
  }
});
