import { HttpError, handleError, json, preflight, readJson } from '../_shared/cors.ts';
import { adminClient } from '../_shared/supabase.ts';

/**
 * Public (verify_jwt = false): creates the FIRST admin account.
 * Refuses with 409 as soon as an admin exists, so it is a one-time operation.
 */
Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;
  try {
    if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed');

    const { data: exists, error: existsErr } = await adminClient.rpc('admin_exists');
    if (existsErr) throw new HttpError(500, existsErr.message);
    if (exists) throw new HttpError(409, 'An admin account already exists');

    const body = await readJson<{ email?: string; password?: string; full_name?: string }>(req);
    const email = (body.email ?? '').trim().toLowerCase();
    const password = body.password ?? '';
    const fullName = (body.full_name ?? '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Invalid e-mail');
    if (password.length < 8) throw new HttpError(400, 'Password must be at least 8 characters');

    const { data: created, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (error || !created.user) throw new HttpError(400, error?.message ?? 'Could not create user');

    // Make sure the profile row exists, then promote atomically.
    await adminClient
      .from('profiles')
      .upsert({ id: created.user.id, email, full_name: fullName || null }, { onConflict: 'id', ignoreDuplicates: true });

    const { data: promoted, error: promoteErr } = await adminClient.rpc('bootstrap_first_admin', {
      p_user_id: created.user.id,
    });
    if (promoteErr || promoted !== true) {
      // Someone else won the race (or something failed): roll back the new user.
      await adminClient.auth.admin.deleteUser(created.user.id).catch(() => {});
      throw new HttpError(409, promoteErr?.message ?? 'An admin account already exists');
    }

    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
});
