import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Public project values (safe in the browser: the anon key is a publishable key and
// all data is protected by Row Level Security). Env variables override them, which
// lets you point a build at another project without code changes.
const DEFAULT_SUPABASE_URL = 'https://nhdzqbembmwbowtmrnns.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oZHpxYmVtYm13Ym93dG1ybm5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ2NTMyOTAsImV4cCI6MjExMDIyOTI5MH0.k473wA_7HuI3gKnni53xgJ1fJAxFhopR9cbyPjSvsX8';

const url = import.meta.env.VITE_SUPABASE_URL?.trim() || DEFAULT_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
