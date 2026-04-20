/* ═══════════════════════════════════════════════════════
   KYŌRA — Vercel Edge Function: Portal de cliente LS
   Devuelve la URL del customer portal de Lemon Squeezy
   para que el usuario gestione su suscripción (cancelar,
   cambiar método de pago, ver historial de facturas).

   Variables de entorno requeridas:
     LS_API_KEY
     VITE_SUPABASE_URL
     VITE_SUPABASE_ANON_KEY
     SUPABASE_SERVICE_ROLE_KEY
   ═══════════════════════════════════════════════════════ */

export const config = { runtime: 'edge' }

const LS_API         = 'https://api.lemonsqueezy.com/v1'
const SUPABASE_URL   = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON  = process.env.VITE_SUPABASE_ANON_KEY
const SUPABASE_SVC   = process.env.SUPABASE_SERVICE_ROLE_KEY

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  ...(process.env.PRODUCTION_URL ? [process.env.PRODUCTION_URL] : []),
]

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

async function verifySupabaseToken(token) {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { 'Authorization': `Bearer ${token}`, 'apikey': SUPABASE_ANON },
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

async function getProfile(userId) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=ls_subscription_id,subscription_status`,
      {
        headers: {
          'apikey': SUPABASE_SVC,
          'Authorization': `Bearer ${SUPABASE_SVC}`,
        },
      }
    )
    if (!res.ok) return null
    const rows = await res.json()
    return rows?.[0] || null
  } catch {
    return null
  }
}

export default async function handler(req) {
  const origin = req.headers.get('origin') || ''

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) })
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  // Verificar sesión
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'No autorizado.' }),
      { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } }
    )
  }

  const token = authHeader.slice(7)
  const user = await verifySupabaseToken(token)
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Sesión inválida.' }),
      { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } }
    )
  }

  const profile = await getProfile(user.id)
  if (!profile?.ls_subscription_id) {
    return new Response(
      JSON.stringify({ error: 'Sin suscripción activa.' }),
      { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } }
    )
  }

  const apiKey = process.env.LS_API_KEY
  const lsRes = await fetch(
    `${LS_API}/subscriptions/${profile.ls_subscription_id}`,
    {
      headers: {
        'Accept': 'application/vnd.api+json',
        'Authorization': `Bearer ${apiKey}`,
      },
    }
  )

  if (!lsRes.ok) {
    console.error('[customer-portal] LS error:', await lsRes.text())
    return new Response(
      JSON.stringify({ error: 'No se pudo obtener el portal.' }),
      { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } }
    )
  }

  const lsData = await lsRes.json()
  const portalUrl = lsData.data?.attributes?.urls?.customer_portal

  return new Response(
    JSON.stringify({ portalUrl }),
    { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } }
  )
}
