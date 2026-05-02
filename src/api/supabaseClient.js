/* ═══════════════════════════════════════════════════════
   KYŌRA — Supabase Client
   Instancia única compartida en toda la app.
   Variables requeridas en .env:
     VITE_SUPABASE_URL
     VITE_SUPABASE_ANON_KEY
   ═══════════════════════════════════════════════════════ */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan variables de entorno de Supabase. Agrega VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu .env'
  )
}

// Session always persists in localStorage (most reliable).
// The "Recordarme" preference is stored separately: if false, AuthContext
// signs the user out on fresh browser open (detected via sessionStorage flag).
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})
