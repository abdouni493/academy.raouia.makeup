import { createClient, type SupabaseClient, type User } from 'jsr:@supabase/supabase-js@2';
import { HttpError } from './cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

/** Service-role client: bypasses RLS. Never expose its results without checks. */
export const adminClient: SupabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: 'admin' | 'client';
  is_active: boolean;
}

export interface AuthContext {
  user: User;
  profile: Profile;
}

/** Validates the caller's JWT and loads their profile. Rejects inactive users. */
export async function requireUser(req: Request): Promise<AuthContext> {
  const header = req.headers.get('Authorization') ?? '';
  const token = header.replace(/^Bearer\s+/i, '').trim();
  if (!token) throw new HttpError(401, 'Missing Authorization header');

  const { data, error } = await adminClient.auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, 'Invalid or expired session');

  const { data: profile, error: pErr } = await adminClient
    .from('profiles')
    .select('id, email, full_name, role, is_active')
    .eq('id', data.user.id)
    .single();
  if (pErr || !profile) throw new HttpError(403, 'Profile not found');
  if (!profile.is_active) throw new HttpError(403, 'Account suspended');

  return { user: data.user, profile: profile as Profile };
}

export async function requireAdmin(req: Request): Promise<AuthContext> {
  const ctx = await requireUser(req);
  if (ctx.profile.role !== 'admin') throw new HttpError(403, 'Admin only');
  return ctx;
}
