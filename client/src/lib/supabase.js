import { createClient } from '@supabase/supabase-js';
import { LOKAL } from './api.js';

// Isi dari Supabase → Project Settings → API. Publishable/anon key memang untuk klien publik (data dilindungi RLS).
// Kosong = tanpa akun, data cuma di browser.
const SUPABASE_URL = '';
const SUPABASE_KEY = '';

/** Login pakai nama; Supabase butuh email, jadi nama@domain ini (bukan email asli). */
export const DOMAIN_EMAIL = '@duitku.app';

export const db = LOKAL && SUPABASE_URL ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

/** Nama akun yang sedang login, atau null. */
export function namaDariSesi(sesi) {
  return sesi?.user?.email?.replace(DOMAIN_EMAIL, '') ?? null;
}
