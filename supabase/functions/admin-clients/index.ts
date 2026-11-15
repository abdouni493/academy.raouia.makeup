import { HttpError, handleError, json, preflight, readJson } from '../_shared/cors.ts';
import { adminClient, requireAdmin } from '../_shared/supabase.ts';
import { findAuthUserIdByEmail } from '../_shared/users.ts';

interface Body {
  action?: 'create' | 'update' | 'reset_password' | 'set_active' | 'delete';
  user_id?: string;
  email?: string;
  password?: string;
  full_name?: string;
  phone?: string | null;
  notes?: string | null;
  is_active?: boolean;
}

function assertPassword(pw: string | undefined): string {
  if (!pw || pw.length < 8) throw new HttpError(400, 'Password must be at least 8 characters');
  return pw;
}

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;
  try {
    if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed');
    const { profile: me } = await requireAdmin(req);
    const body = await readJson<Body>(req);

    switch (body.action) {
      case 'create': {
        const email = (body.email ?? '').trim().toLowerCase();
        if (!email) throw new HttpError(400, 'email is required');
        const password = assertPassword(body.password);
        // Created directly in Supabase Auth (auth.users) with the e-mail confirmed,
        // so the client can log in right away with this e-mail + password.
        const { data, error } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: body.full_name ?? '', phone: body.phone ?? '' },
        });
        if (error || !data.user) {
          if (error && /already|registered|exists/i.test(error.message)) {
            const existing = await findAuthUserIdByEmail(email);
            throw new HttpError(409, existing ? 'A user with this e-mail already exists' : error.message);
          }
          throw new HttpError(400, error?.message ?? 'Could not create user');
        }
        const { data: profile, error: pErr } = await adminClient
          .from('profiles')
          .upsert({
            id: data.user.id,
            email,
            full_name: body.full_name ?? null,
            phone: body.phone ?? null,
            notes: body.notes ?? null,
            role: 'client',
            is_active: true,
          })
          .select('*')
          .single();
        if (pErr) {
          // Don't leave a login without a profile: roll back the auth user.
          await adminClient.auth.admin.deleteUser(data.user.id).catch(() => {});
          throw new HttpError(500, pErr.message);
        }
        return json({ profile });
      }

      case 'update': {
        if (!body.user_id) throw new HttpError(400, 'user_id is required');
        if (body.email) {
          const { error } = await adminClient.auth.admin.updateUserById(body.user_id, {
            email: body.email.trim().toLowerCase(),
            email_confirm: true,
          });
          if (error) throw new HttpError(400, error.message);
        }
        const patch: Record<string, unknown> = {};
        if (body.full_name !== undefined) patch.full_name = body.full_name;
        if (body.phone !== undefined) patch.phone = body.phone;
        if (body.notes !== undefined) patch.notes = body.notes;
        if (body.email) patch.email = body.email.trim().toLowerCase();
        const { data: profile, error } = await adminClient
          .from('profiles').update(patch).eq('id', body.user_id).select('*').single();
        if (error) throw new HttpError(400, error.message);
        return json({ profile });
      }

      case 'reset_password': {
        if (!body.user_id) throw new HttpError(400, 'user_id is required');
        const password = assertPassword(body.password);
        const { error } = await adminClient.auth.admin.updateUserById(body.user_id, { password });
        if (error) throw new HttpError(400, error.message);
        return json({ ok: true });
      }

      case 'set_active': {
        if (!body.user_id || typeof body.is_active !== 'boolean') {
          throw new HttpError(400, 'user_id and is_active are required');
        }
        if (body.user_id === me.id) throw new HttpError(400, 'You cannot deactivate yourself');
        const { error } = await adminClient.auth.admin.updateUserById(body.user_id, {
          ban_duration: body.is_active ? 'none' : '876000h',
        });
        if (error) throw new HttpError(400, error.message);
        const { data: profile, error: pErr } = await adminClient
          .from('profiles').update({ is_active: body.is_active }).eq('id', body.user_id)
          .select('*').single();
        if (pErr) throw new HttpError(400, pErr.message);
        return json({ profile });
      }

      case 'delete': {
        if (!body.user_id) throw new HttpError(400, 'user_id is required');
        if (body.user_id === me.id) throw new HttpError(400, 'You cannot delete yourself');
        const { error } = await adminClient.auth.admin.deleteUser(body.user_id);
        if (error) throw new HttpError(400, error.message);
        return json({ ok: true });
      }

      default:
        throw new HttpError(400, 'Unknown action');
    }
  } catch (err) {
    return handleError(err);
  }
});
