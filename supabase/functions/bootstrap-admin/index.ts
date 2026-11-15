import { HttpError, handleError, json, preflight, readJson } from '../_shared/cors.ts';
import { adminClient } from '../_shared/supabase.ts';
import { ensureProfile, findAuthUserIdByEmail } from '../_shared/users.ts';

/**
 * Public (verify_jwt = false): creates the FIRST admin account.
 * - The account is created in Supabase Auth (auth.users) with the e-mail already
 *   confirmed, so it can log in immediately with e-mail + password.
 * - Refuses with 409 as soon as an admin exists: it is a one-time operation.
 */

async function adminAlreadyExists(): Promise<boolean> {
  const { data, error } = await adminClient.from('profiles').select('id').eq('role', 'admin').limit(1);
  if (error) throw new HttpError(500, `Database not ready (did you run 0001_init.sql?): ${error.message}`);
  return (data?.length ?? 0) > 0;
}

/** Promotes atomically through the SQL function; falls back to a direct update. */
async function promote(userId: string): Promise<boolean> {
  const { data, error } = await adminClient.rpc('bootstrap_first_admin', { p_user_id: userId });
  if (!error) return data === true;
  if (await adminAlreadyExists()) return false;
  const { error: upErr } = await adminClient.from('profiles').update({ role: 'admin', is_active: true }).eq('id', userId);
  if (upErr) throw new HttpError(500, upErr.message);
  return true;
}

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;
  try {
    if (req.method === 'GET') return json({ admin_exists: await adminAlreadyExists() });
    if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed');

    if (await adminAlreadyExists()) throw new HttpError(409, 'An admin account already exists');

    const body = await readJson<{ email?: string; password?: string; full_name?: string }>(req);
    const email = (body.email ?? '').trim().toLowerCase();
    const password = body.password ?? '';
    const fullName = (body.full_name ?? '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Invalid e-mail');
    if (password.length < 8) throw new HttpError(400, 'Password must be at least 8 characters');

    let userId: string;
    let createdNow = false;
    const { data: created, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (created?.user) {
      userId = created.user.id;
      createdNow = true;
    } else if (error && /already|registered|exists/i.test(error.message)) {
      // The e-mail is already in auth.users (e.g. created earlier by hand) and no
      // admin exists yet: take it over — set the password, confirm, unban.
      const existing = await findAuthUserIdByEmail(email);
      if (!existing) throw new HttpError(400, error.message);
      const { error: updErr } = await adminClient.auth.admin.updateUserById(existing, {
        password,
        email_confirm: true,
        ban_duration: 'none',
        user_metadata: { full_name: fullName },
      });
      if (updErr) throw new HttpError(400, updErr.message);
      userId = existing;
    } else {
      throw new HttpError(400, error?.message ?? 'Could not create user');
    }

    try {
      await ensureProfile(userId, email, { full_name: fullName || null, is_active: true });
      if (!(await promote(userId))) throw new HttpError(409, 'An admin account already exists');
    } catch (err) {
      if (createdNow) await adminClient.auth.admin.deleteUser(userId).catch(() => {});
      throw err;
    }

    return json({ ok: true, user_id: userId });
  } catch (err) {
    return handleError(err);
  }
});
