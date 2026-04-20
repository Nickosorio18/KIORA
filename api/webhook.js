/* ═══════════════════════════════════════════════════════
   KYŌRA — Vercel Edge Function: Webhook de Lemon Squeezy
   Recibe eventos de suscripción y actualiza la tabla profiles
   en Supabase vía service role (bypassa RLS).

   Variables de entorno requeridas:
     LS_WEBHOOK_SECRET       — Secret configurado en LS Dashboard
     LS_VARIANT_ESENCIAL     — Variant ID → mapeo a plan
     LS_VARIANT_PREMIUM
     LS_VARIANT_ELITE
     VITE_SUPABASE_URL
     SUPABASE_SERVICE_ROLE_KEY — NUNCA exponer al browser
   ═══════════════════════════════════════════════════════ */

export const config = { runtime: 'edge' }

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

function variantToPlan(variantId) {
  const id = String(variantId)
  if (id === String(process.env.LS_VARIANT_PREMIUM)) return 'premium'
  if (id === String(process.env.LS_VARIANT_ELITE))   return 'elite'
  if (id === String(process.env.LS_VARIANT_ESENCIAL)) return 'esencial'
  return null
}

// HMAC-SHA256 usando Web Crypto (disponible en Edge runtime)
async function verifySignature(rawBody, signature) {
  const secret = process.env.LS_WEBHOOK_SECRET
  if (!secret || !signature) return false
  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody))
    const computed = Array.from(new Uint8Array(sigBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    // Comparación en tiempo constante (previene timing attacks)
    if (computed.length !== signature.length) return false
    let diff = 0
    for (let i = 0; i < computed.length; i++) {
      diff |= computed.charCodeAt(i) ^ signature.charCodeAt(i)
    }
    return diff === 0
  } catch {
    return false
  }
}

async function upsertProfile(userId, updates) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify({ id: userId, ...updates }),
  })
  if (!res.ok) {
    const err = await res.text()
    console.error('[webhook] Supabase upsert error:', err)
  }
  return res.ok
}

async function patchProfile(userId, updates) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(updates),
    }
  )
  return res.ok
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  // Leer body como texto (necesario para verificar HMAC antes de parsear)
  const rawBody = await req.text()
  const signature = req.headers.get('x-signature') || ''

  if (!await verifySignature(rawBody, signature)) {
    console.error('[webhook] Firma inválida')
    return new Response(JSON.stringify({ error: 'Firma inválida' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let payload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return new Response(JSON.stringify({ error: 'Body inválido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const event      = req.headers.get('x-event-name') || payload.meta?.event_name
  const data       = payload.data
  const customData = payload.meta?.custom_data || {}
  const userId     = customData.user_id

  // Sin user_id no podemos hacer nada — responder 200 para que LS no reintente
  if (!userId) {
    console.warn('[webhook] Evento sin user_id:', event)
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const attrs          = data?.attributes || {}
  const lsCustomerId   = String(attrs.customer_id || '')
  const lsSubscriptionId = String(data?.id || '')
  const variantId      = attrs.variant_id
  const plan           = variantToPlan(variantId)
  const status         = attrs.status || 'active'

  try {
    switch (event) {
      case 'subscription_created':
      case 'subscription_updated':
        if (!plan) {
          console.warn('[webhook] Variant sin mapeo:', variantId)
          break
        }
        await upsertProfile(userId, {
          plan,
          ls_customer_id:     lsCustomerId,
          ls_subscription_id: lsSubscriptionId,
          subscription_status: status,
        })
        break

      case 'subscription_cancelled':
        // Mantener el plan hasta que expire (LS envía expired después)
        await patchProfile(userId, { subscription_status: 'cancelled' })
        break

      case 'subscription_expired':
      case 'subscription_unpaused':
        if (event === 'subscription_expired') {
          await upsertProfile(userId, {
            plan: 'esencial',
            subscription_status: 'expired',
          })
        }
        break

      case 'subscription_payment_success':
        // Reactivar si estaba pausado/vencido
        if (plan) {
          await patchProfile(userId, {
            plan,
            subscription_status: 'active',
          })
        }
        break

      default:
        // Evento no manejado — ignorar silenciosamente
        break
    }
  } catch (err) {
    console.error('[webhook] Error procesando evento:', event, err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
