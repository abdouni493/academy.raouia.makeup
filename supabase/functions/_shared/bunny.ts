import { HttpError } from './cors.ts';

export function bunnyEnv() {
  const libraryId = Deno.env.get('BUNNY_LIBRARY_ID');
  const apiKey = Deno.env.get('BUNNY_API_KEY');
  if (!libraryId || !apiKey) throw new HttpError(500, 'Bunny secrets are not configured');
  return {
    libraryId,
    apiKey,
    tokenAuthKey: Deno.env.get('BUNNY_TOKEN_AUTH_KEY') ?? '',
    cdnHostname: Deno.env.get('BUNNY_CDN_HOSTNAME') ?? '',
  };
}

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function bunnyFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { apiKey } = bunnyEnv();
  return await fetch(`https://video.bunnycdn.com${path}`, {
    ...init,
    headers: {
      AccessKey: apiKey,
      accept: 'application/json',
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
}

export interface BunnyVideo {
  guid: string;
  title: string;
  status: number;
  length: number;
  thumbnailFileName: string | null;
  encodeProgress: number;
}

export async function getBunnyVideo(guid: string): Promise<BunnyVideo | null> {
  const { libraryId } = bunnyEnv();
  const res = await bunnyFetch(`/library/${libraryId}/videos/${guid}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new HttpError(502, `Bunny API error ${res.status}: ${await res.text()}`);
  return (await res.json()) as BunnyVideo;
}

/** Maps a Bunny Stream status code to our video_status enum + patch. */
export function statusPatch(video: BunnyVideo) {
  const { cdnHostname } = bunnyEnv();
  const s = video.status;
  if (s === 3 || s === 4) {
    return {
      status: 'ready' as const,
      duration_seconds: Math.round(video.length ?? 0),
      thumbnail_url:
        cdnHostname && video.thumbnailFileName
          ? `https://${cdnHostname}/${video.guid}/${video.thumbnailFileName}`
          : null,
    };
  }
  if (s === 5 || s === 8) return { status: 'failed' as const };
  return { status: 'processing' as const };
}
