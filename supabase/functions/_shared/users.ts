import { adminClient } from './supabase.ts';

/** Finds an auth user id by e-mail (profiles first, then the Auth admin API). */
export async function findAuthUserIdByEmail(email: string): Promise<string | null> {
  const { data: profile } = await adminClient.from('profiles').select('id').eq('email', email).maybeSingle();
  if (profile?.id) return profile.id;
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !data?.users?.length) return null;
    const hit = data.users.find((u) => (u.email ?? '').toLowerCase() === email);
    if (hit) return hit.id;
    if (data.users.length < 200) return null;
  }
  return null;
}

/** Makes sure the public.profiles row exists (in case the auth trigger is missing). */
export async function ensureProfile(id: string, email: string, fields: Record<string, unknown> = {}) {
  const { error } = await adminClient.from('profiles').upsert({ id, email, ...fields }, { onConflict: 'id' });
  if (error) throw error;
}
