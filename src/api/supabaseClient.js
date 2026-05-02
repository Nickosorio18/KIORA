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

// Custom storage: respects the "Recordarme" preference set at login.
// When remember=true (default): localStorage → persists across browser restarts.
// When remember=false: sessionStorage → cleared when tab/browser closes.
const rememberStorage = {
  getItem: (key) => {
    const remember = localStorage.getItem('kyora_remember') !== 'false';
    return remember ? localStorage.getItem(key) : sessionStorage.getItem(key);
  },
  setItem: (key, value) => {
    const remember = localStorage.getItem('kyora_remember') !== 'false';
    if (remember) {
      localStorage.setItem(key, value);
      sessionStorage.removeItem(key);
    } else {
      sessionStorage.setItem(key, value);
      localStorage.removeItem(key);
    }
  },
  removeItem: (key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: rememberStorage,
  },
})
