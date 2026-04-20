/* ═══════════════════════════════════════════════════════
   KYŌRA — Vercel Edge Function: Crear checkout Lemon Squeezy
   Recibe { planId } del browser, devuelve { checkoutUrl }.
   Mapea planId → variantId en el servidor (nunca expuesto al cliente).

   Variables de entorno requeridas:
     LS_API_KEY            — API key de Lemon Squeezy
     LS_STORE_ID           — ID numérico de tu store en LS
     LS_VARIANT_ESENCIAL   — Variant ID del plan Esencial
     LS_VARIANT_PREMIUM    — Variant ID del plan Premium
     LS_VARIANT_ELITE      — Variant ID del plan Élite
     VITE_SUPABASE_URL     — URL de Supabase
     VITE_SUPABASE_ANON_KEY — Anon key de Supabase
     PRODUCTION_URL        — URL de producción (para redirect_url)
   ═══════════════════════════════════════════════════════ */

export const config = { runtime: 'edge' }

const LS_API = 'https://api.lemonsqueezy.com/v1'
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

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

function variantForPlan(planId) {
  const map = {
    esencial: process.env.LS_VARIANT_ESENCIAL,
    premium:  process.env.LS_VARIANT_PREMIUM,
    elite:    process.env.LS_VARIANT_ELITE,
  }
  return map[planId] || null
}

async function verifySupabaseToken(token) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { 'Authorization': `Bearer ${token}`, 'apikey': SUPABASE_ANON_KEY },
    })
    if (!res.ok) return null
    return res.json()
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

  // Verificar sesión de Supabase
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'No autorizado — sesión requerida.' }),
      { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } }
    )
  }

  const token = authHeader.slice(7)
  const user = await verifySupabaseToken(token)
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Sesión inválida o expirada.' }),
      { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } }
    )
  }

  let planId
  try {
    const body = await req.json()
    planId = body.planId
  } catch {
    return new Response(
      JSON.stringify({ error: 'Body inválido.' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } }
    )
  }

  const variantId = variantForPlan(planId)
  if (!variantId) {
    return new Response(
      JSON.stringify({ error: 'Plan inválido.' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } }
    )
  }

  const apiKey  = process.env.LS_API_KEY
  const storeId = process.env.LS_STORE_ID
  if (!apiKey || !storeId) {
    return new Response(
      JSON.stringify({ error: 'Pagos no configurados en el servidor.' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } }
    )
  }

  const baseUrl = process.env.PRODUCTION_URL || 'http://localhost:5173'

  const lsRes = await fetch(`${LS_API}/checkouts`, {
    method: 'POST',
    headers: {
      'Accept':        'application/vnd.api+json',
      'Content-Type':  'application/vnd.api+json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          checkout_options: { embed: false, dark: false },
          checkout_data: {
            email: user.email,
            custom: { user_id: user.id, plan_id: planId },
          },
          product_options: {
            redirect_url: `${baseUrl}/app/subscription/success`,
            receipt_link_url: `${baseUrl}/app/dashboard`,
          },
          expires_at: null,
        },
        relationships: {
          store:   { data: { type: 'stores',   id: String(storeId) } },
          variant: { data: { type: 'variants', id: String(variantId) } },
        },
      },
    }),
  })

  if (!lsRes.ok) {
    const errText = await lsRes.text()
    console.error('[create-checkout] Lemon Squeezy error:', errText)
    return new Response(
      JSON.stringify({ error: 'Error al crear sesión de pago.' }),
      { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } }
    )
  }

  const lsData = await lsRes.json()
  const checkoutUrl = lsData.data?.attributes?.url

  return new Response(
    JSON.stringify({ checkoutUrl }),
    { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } }
  )
}
