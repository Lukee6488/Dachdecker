import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://zrwhovxmjqknsxvdubor.supabase.co";
const SERVICE_KEY  = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ?? "";

// Admin client mit Service Role Key – umgeht RLS.
// Nur für interne Sekretärinnen-Funktionen (Benutzer anlegen/löschen).
export const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
