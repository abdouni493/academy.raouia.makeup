# Raouia Makeup Academy

Private video-training platform for a professional makeup artist. The admin uploads and organises
formations (courses), bundles them into packs, creates client accounts and decides exactly what each
client can watch. Clients log in and watch only what they were given — mostly on their phones.

- **Frontend:** React 18 · Vite · TypeScript · Tailwind · React Router · TanStack Query · react-i18next (FR / AR-RTL / EN)
- **Backend:** Supabase (Auth, Postgres + RLS, Storage for cover images, Edge Functions in Deno)
- **Video:** Bunny Stream — direct TUS upload from the browser, signed expiring iframe playback
- **Hosting:** Vercel (SPA)

---

## Architecture

```
Browser (React SPA)
 ├── Supabase JS (anon key + user JWT) ──► Postgres (RLS on every table)
 │                                        Storage bucket "covers" (public images)
 ├── supabase.functions.invoke(...) ──► Edge Functions (secrets live here only)
 │      bunny-create-upload  → creates Bunny video + DB row, returns presigned TUS signature
 │      get-playback         → checks access, returns 3h signed iframe URL
 │      admin-clients        → create / update / reset password / ban / delete users
 │      bunny-delete-video   → delete video(s) from Bunny + DB, manual status refresh
      bootstrap-admin      → public, one-time: creates the first admin (refuses once one exists)
 └── tus-js-client ──► https://video.bunnycdn.com/tusupload   (video bytes never touch Supabase)

Bunny Stream ── webhook ──► bunny-webhook?secret=…  → re-fetches video from Bunny API → updates status
Supabase Realtime (videos table) ──► admin UI status badges update live
```

**Security model**

| Rule | Where it is enforced |
| --- | --- |
| Bunny API key / token key / webhook secret / service-role key never reach the browser | Edge Function secrets only |
| Clients read only published content they have an active grant for | RLS + `has_formation_access()` |
| Locked formations show title/cover/outline, never `bunny_video_id` | `public_catalog` view, `formation_outline()` function, `videos` RLS |
| Clients cannot change `role`, `is_active`, `email`, `notes` | `protect_profile_columns` trigger |
| No public sign-up — admin creates accounts | `admin-clients` function + disable sign-ups in Auth settings |
| Deactivated users are blocked | Auth ban (`ban_duration`) **and** `is_active_user()` in RLS |
| Playback URLs expire after 3 h and are only issued after an access check | `get-playback` |
| Moving e-mail watermark on the player (kept visible in our own fullscreen mode) | `VideoPlayer.tsx` |

## Project structure

```
src/
  components/ui/        Button, Input/Select/Textarea/Switch, Modal, ConfirmDialog, Badge, Card, Table, EmptyState, Skeleton
  components/layout/    ClientLayout (top bar + mobile tab bar), AdminLayout (dark plum sidebar)
  components/           Logo, LanguageSwitcher, VideoPlayer, CoverUpload, SortableList (dnd-kit), …
  features/auth/        AuthProvider, ProtectedRoute, Login, Reset password, Suspended screen
  features/client/      Dashboard, Catalog, Formation (player), Profile
  features/admin/       Dashboard, Formations list/editor, Packs, Clients, Client detail, uploads/ (TUS queue)
  i18n/                 fr.json, ar.json, en.json
  lib/                  supabase client, edge-function API, storage, utils
  types/database.ts     typed Supabase schema
supabase/
  migrations/0001_init.sql   complete schema (run once in SQL editor)
  seed_admin.sql             promote your account to admin
  functions/                 Edge Functions + _shared helpers
  config.toml                verify_jwt = false for bunny-webhook
```

## Local setup

```bash
npm install
cp .env.example .env      # fill VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_WHATSAPP_NUMBER
npm run dev               # http://localhost:5173
npm run build             # type-check + production build
```

### Environment variables (frontend — public values only)

| Variable | Description |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `VITE_WHATSAPP_NUMBER` | Number used by "Request access" / "Contact us" buttons, e.g. `+213555123456` |
| `VITE_DEFAULT_CURRENCY` | Default pack currency (`DZD`) |

## Supabase setup

1. **SQL** — open *SQL Editor*, paste `supabase/migrations/0001_init.sql`, run. (Safe to re-run.)
2. **Admin account** — also run `supabase/migrations/0002_bootstrap_admin.sql`, deploy the `bootstrap-admin`
   function, then open the login page and click **Create admin account**. The button only shows while no admin
   exists and disappears for good once yours is created (the function refuses any further attempt).
   *Alternative:* create the user in *Authentication → Users* and run `supabase/seed_admin.sql`.
3. **Disable public sign-up** — *Authentication → Sign In / Providers → Email*: turn off *Allow new users to sign up*.
4. **URLs** — *Authentication → URL Configuration*: set *Site URL* to your Vercel URL and add
   `https://<your-domain>/reset-password` (and `http://localhost:5173/reset-password`) to *Redirect URLs*.
5. **Realtime** — the SQL adds `videos` to the `supabase_realtime` publication. Check *Database → Publications* if badges don't update live.

## Bunny Stream setup

1. *Stream → Add Video Library*. Note the **Library ID** (*API* tab) and the **API key** (*API* tab → *API Key*).
2. **Token authentication** — library → *Security* → enable **Embed view token authentication**.
   Copy the **Token Authentication Key** → `BUNNY_TOKEN_AUTH_KEY`.
   Also add your domains to *Allowed domains* (e.g. `your-app.vercel.app`, `localhost`) to block hotlinking.
3. **CDN hostname** — library → *API* tab → *CDN Hostname* (e.g. `vz-xxxxxxxx-xxx.b-cdn.net`) → `BUNNY_CDN_HOSTNAME`.
4. **Webhook** — library → *API* → *Webhook URL*:
   `https://<project-ref>.supabase.co/functions/v1/bunny-webhook?secret=<BUNNY_WEBHOOK_SECRET>`

## Deploy Edge Functions

```bash
npm i -g supabase            # or: npx supabase …
supabase login
supabase link --project-ref <project-ref>

supabase secrets set \
  BUNNY_LIBRARY_ID=<library id> \
  BUNNY_API_KEY=<stream library api key> \
  BUNNY_TOKEN_AUTH_KEY=<token authentication key> \
  BUNNY_CDN_HOSTNAME=<vz-xxxx.b-cdn.net> \
  BUNNY_WEBHOOK_SECRET=$(openssl rand -hex 24)

supabase functions deploy bunny-create-upload
supabase functions deploy get-playback
supabase functions deploy admin-clients
supabase functions deploy bunny-delete-video
supabase functions deploy bunny-webhook --no-verify-jwt
supabase functions deploy bootstrap-admin --no-verify-jwt
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.
Check the webhook secret later with `supabase secrets list` (digest only) — keep a copy when you generate it.

## Deploy the frontend (Vercel)

Import the repository, framework **Vite**, add the `VITE_*` variables, deploy. `vercel.json` rewrites every
route to `index.html` so deep links like `/formation/my-course` work.

## Troubleshooting

**CORS error when calling a function** — the function probably crashed before returning (missing secret or
not deployed). Check *Edge Functions → Logs*. Every function answers `OPTIONS` with CORS headers; a CORS error
almost always hides a 500/404.

**401 from functions** — the user session expired (log out / in), or a function was deployed with
`--no-verify-jwt` by mistake / without it for `bunny-webhook`. Only `bunny-webhook` and `bootstrap-admin` must skip JWT verification.
`403 Account suspended` means the profile has `is_active = false`; `403 Admin only` means the profile role isn't `admin`
(run `seed_admin.sql`).

**Webhook not firing** — verify the URL in Bunny includes `?secret=` with the exact `BUNNY_WEBHOOK_SECRET`
(a wrong secret returns 401 — visible in function logs). Test it:
`curl -X POST "https://<ref>.supabase.co/functions/v1/bunny-webhook?secret=…" -H 'content-type: application/json' -d '{"VideoLibraryId":<id>,"VideoGuid":"<guid>","Status":3}'`.

**Video stuck in "processing"** — click the ↻ *Refresh status* button on the video (re-syncs from Bunny API).
If Bunny shows it as failed, re-upload. The editor also polls every 20 s while a video is processing.

**Player shows "403" / blank** — token authentication is enabled but `BUNNY_TOKEN_AUTH_KEY` is wrong, or your
domain isn't in Bunny's allowed referrers.

**Upload fails immediately** — wrong `BUNNY_API_KEY` / `BUNNY_LIBRARY_ID` (the TUS signature is
`sha256(libraryId + apiKey + expire + videoId)`). Use the *Stream library* API key, not the account API key.

**Reset-password link opens the login page** — add `/reset-password` to Supabase *Redirect URLs*.
