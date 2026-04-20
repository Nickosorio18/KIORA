import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useUser } from '@context/UserContext'

/* ═══════════════════════════════════════════════════════
   KYŌRA — SubscriptionSuccess
   Landing page después de completar el checkout en LS.
   Refresca el plan desde Supabase y redirige al dashboard.
   ═══════════════════════════════════════════════════════ */

const css = `
.ss-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--cream,#FAF8F5);padding:2rem;font-family:var(--font-b,'Jost',sans-serif)}
@keyframes ssIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes ssPulse{0%,100%{opacity:1}50%{opacity:.5}}
.ss-card{background:#fff;border:1px solid rgba(200,169,110,.2);border-radius:10px;padding:3rem 2.5rem;max-width:460px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(26,26,46,.08);animation:ssIn .5s cubic-bezier(.22,1,.36,1) both}
.ss-icon{width:72px;height:72px;border-radius:18px;background:linear-gradient(135deg,#C8A96E,#E8D5A3);display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;box-shadow:0 8px 28px rgba(200,169,110,.3)}
.ss-eyebrow{font-size:.6rem;font-weight:500;letter-spacing:.2em;text-transform:uppercase;color:#C8A96E;margin-bottom:.6rem}
.ss-title{font-family:var(--font-d,'Playfair Display',serif);font-size:1.9rem;font-weight:600;color:#1A1A2E;line-height:1.2;margin-bottom:.75rem;letter-spacing:-.015em}
.ss-title em{font-style:italic;color:#C8A96E}
.ss-body{font-size:.92rem;font-weight:300;color:#6B6B80;line-height:1.65;margin-bottom:2rem}
.ss-progress{display:flex;align-items:center;gap:.6rem;justify-content:center;margin-bottom:2rem;font-size:.78rem;font-weight:400;color:#9A9189}
.ss-dot{width:8px;height:8px;border-radius:50%;background:#C8A96E;animation:ssPulse 1.4s ease-in-out infinite}
.ss-btn{display:inline-flex;align-items:center;gap:.5rem;background:#1A1A2E;color:#E8D5A3;border:none;border-radius:3px;font-family:var(--font-b,'Jost',sans-serif);font-size:.78rem;font-weight:500;letter-spacing:.12em;text-transform:uppercase;padding:.9rem 1.8rem;cursor:pointer;transition:letter-spacing .25s,background .2s}
.ss-btn:hover{background:#000;letter-spacing:.16em}
.ss-counter{margin-top:1.2rem;font-size:.72rem;font-weight:300;color:#C8C0B8}
`

export default function SubscriptionSuccess() {
  const navigate = useNavigate()
  const { refreshPlan } = useUser()
  const [countdown, setCountdown] = useState(5)
  const [planRefreshed, setPlanRefreshed] = useState(false)
  const didRefresh = useRef(false)

  // Refrescar plan desde Supabase al montar (webhook ya debería haber disparado)
  useEffect(() => {
    if (didRefresh.current) return
    didRefresh.current = true
    const timeout = setTimeout(async () => {
      await refreshPlan()
      setPlanRefreshed(true)
    }, 800)
    return () => clearTimeout(timeout)
  }, [refreshPlan])

  // Countdown y redirect automático
  useEffect(() => {
    if (countdown <= 0) {
      navigate('/app/dashboard', { replace: true })
      return
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown, navigate])

  return (
    <>
      <Helmet>
        <title>¡Suscripción activada! — KYŌRA</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <style>{css}</style>

      <div className="ss-wrap">
        <div className="ss-card">
          <div className="ss-icon">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E"
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <div className="ss-eyebrow">Pago confirmado</div>
          <h1 className="ss-title">¡Bienvenido a tu nuevo <em>plan</em>!</h1>
          <p className="ss-body">
            Tu suscripción ya está activa. KYŌRA tiene todo lo que necesita para darte
            la experiencia completa que elegiste — planes, rutinas y coaching sin límites.
          </p>

          {!planRefreshed ? (
            <div className="ss-progress">
              <div className="ss-dot" />
              Activando tu plan…
            </div>
          ) : (
            <div className="ss-progress" style={{ color: '#7A9E7E' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Plan activado
            </div>
          )}

          <button className="ss-btn" onClick={() => navigate('/app/dashboard', { replace: true })}>
            Ir al dashboard
          </button>

          <p className="ss-counter">Redirigiendo en {countdown}s…</p>
        </div>
      </div>
    </>
  )
}
