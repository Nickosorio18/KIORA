/* ═══════════════════════════════════════════════════════
   KYŌRA — Vercel Edge Function: Proxy de Anthropic
   Protege la API key en el servidor. El cliente llama
   a /api/anthropic y esta función reenvía a Anthropic.

   Variables requeridas en Vercel:
     ANTHROPIC_API_KEY   — clave de Anthropic (solo servidor)
     VITE_SUPABASE_URL       — URL del proyecto Supabase
     VITE_SUPABASE_ANON_KEY  — anon key de Supabase
   ═══════════════════════════════════════════════════════ */

export const config = { runtime: 'edge' }

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  ...(process.env.PRODUCTION_URL ? [process.env.PRODUCTION_URL] : []),
]

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

async function verifySupabaseToken(token) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return false
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': SUPABASE_ANON_KEY,
      },
    })
    return res.ok
  } catch {
    return false
  }
}

export default async function handler(req) {
  const origin = req.headers.get('origin') || ''

  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) })
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  // ── Verificar sesión de Supabase ──
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: { message: 'No autorizado — sesión requerida.' } }),
      { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } }
    )
  }

  const token = authHeader.slice(7)
  const isValid = await verifySupabaseToken(token)
  if (!isValid) {
    return new Response(
      JSON.stringify({ error: { message: 'Sesión inválida o expirada.' } }),
      { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } }
    )
  }

  // ── Verificar API key ──
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: { message: 'API key de Anthropic no configurada en el servidor.' } }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } }
    )
  }

  let body
  try {
    body = await req.text()
  } catch {
    return new Response(
      JSON.stringify({ error: { message: 'Body inválido.' } }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } }
    )
  }

  const upstream = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body,
  })

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') || 'application/json',
      ...corsHeaders(origin),
    },
  })
}
