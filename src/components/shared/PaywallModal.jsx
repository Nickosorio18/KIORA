import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PLAN_BY_ID } from "@config/plans";
import { useAuth } from "@context/AuthContext";

/* ═══════════════════════════════════════════════════════
   KYŌRA — PaywallModal
   Modal consistente que aparece cuando un usuario intenta
   usar una feature por encima de su plan. NO es un upsell
   agresivo — copy editorial, foco en valor, no en presión.
   ═══════════════════════════════════════════════════════ */

const css = `
.pw-overlay{position:fixed;inset:0;background:rgba(26,26,30,.55);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:2000;animation:pwFade .2s ease;padding:20px}
@keyframes pwFade{from{opacity:0}to{opacity:1}}
.pw-box{background:#FAF8F5;border:1px solid rgba(200,169,110,.2);border-radius:8px;width:440px;max-width:100%;max-height:90vh;overflow-y:auto;padding:36px 32px 28px;box-shadow:0 24px 60px rgba(26,26,46,.18);animation:pwSlide .25s cubic-bezier(.22,1,.36,1);position:relative}
@keyframes pwSlide{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
.pw-close{position:absolute;top:14px;right:14px;width:30px;height:30px;border:none;background:transparent;cursor:pointer;color:#9A9189;display:flex;align-items:center;justify-content:center;border-radius:6px;transition:background .15s}
.pw-close:hover{background:rgba(200,169,110,.08);color:#1A1A2E}
.pw-icon{width:54px;height:54px;border-radius:14px;background:linear-gradient(135deg,#C8A96E,#E8D5A3);display:flex;align-items:center;justify-content:center;margin-bottom:18px;color:#1A1A2E;box-shadow:0 6px 22px rgba(200,169,110,.25)}
.pw-eyebrow{font-size:.62rem;font-weight:500;letter-spacing:.18em;text-transform:uppercase;color:#C8A96E;margin-bottom:.5rem}
.pw-title{font-family:'Playfair Display',Georgia,serif;font-size:1.5rem;font-weight:600;color:#1A1A2E;line-height:1.2;margin-bottom:.7rem;letter-spacing:-.005em}
.pw-body{font-size:.92rem;font-weight:300;color:#6B6B80;line-height:1.6;margin-bottom:1.5rem}
.pw-plan-card{background:#FFF;border:1px solid rgba(200,169,110,.18);border-radius:6px;padding:1rem 1.2rem;display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem}
.pw-plan-info{display:flex;flex-direction:column;gap:2px}
.pw-plan-name{font-family:'Playfair Display',Georgia,serif;font-size:1.05rem;font-weight:600;color:#1A1A2E}
.pw-plan-tag{font-size:.72rem;font-weight:300;color:#9A9189;letter-spacing:.02em}
.pw-plan-price{font-family:'Playfair Display',Georgia,serif;font-size:1.4rem;font-weight:600;color:#1A1A2E;display:flex;align-items:baseline;gap:2px}
.pw-plan-price .pw-currency{font-size:.7rem;font-weight:400;color:#9A9189}
.pw-plan-price .pw-mo{font-size:.62rem;font-weight:400;color:#9A9189;letter-spacing:.05em;margin-left:3px}
.pw-actions{display:flex;flex-direction:column;gap:.5rem}
.pw-cta{padding:.85rem 1.2rem;background:#1A1A2E;color:#E8D5A3;border:none;border-radius:3px;font-family:'Jost',system-ui,sans-serif;font-size:.78rem;font-weight:500;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;transition:letter-spacing .25s,background .2s}
.pw-cta:hover{background:#000;letter-spacing:.16em}
.pw-secondary{padding:.7rem 1.2rem;background:transparent;border:none;font-family:'Jost',system-ui,sans-serif;font-size:.72rem;font-weight:300;color:#9A9189;cursor:pointer;letter-spacing:.04em;transition:color .2s}
.pw-secondary:hover{color:#1A1A2E}
.pw-footnote{margin-top:1rem;font-size:.7rem;font-weight:300;color:#9A9189;text-align:center;line-height:1.5}
`;

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {{ title: string, body: string, ctaPlan: string }} props.copy
 *   — viene de FEATURES.X.paywallCopy
 */
export default function PaywallModal({ open, onClose, copy }) {
  const navigate = useNavigate();
  const { session } = useAuth();
  const boxRef = useRef(null);
  const previouslyFocused = useRef(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement;
    boxRef.current?.querySelector("button")?.focus({ preventScroll: true });
    const onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open || !copy) return null;

  const targetPlan = PLAN_BY_ID[copy.ctaPlan] || PLAN_BY_ID.esencial;

  const handleUpgrade = async () => {
    if (!session?.access_token) {
      onClose();
      navigate('/#pricing');
      return;
    }
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ planId: targetPlan.id }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        onClose();
        window.location.href = data.checkoutUrl;
      } else {
        navigate('/#pricing');
      }
    } catch {
      navigate('/#pricing');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <>
      <style>{css}</style>
      <div className="pw-overlay" onClick={onClose} role="presentation">
        <div
          className="pw-box"
          ref={boxRef}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="pw-title"
        >
          <button className="pw-close" onClick={onClose} aria-label="Cerrar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          <div className="pw-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l2.39 7.36H22l-6.18 4.49L18.21 21 12 16.51 5.79 21l2.39-7.15L2 9.36h7.61z"/>
            </svg>
          </div>

          <div className="pw-eyebrow">Plan {targetPlan.label}</div>
          <h2 id="pw-title" className="pw-title">{copy.title}</h2>
          <p className="pw-body">{copy.body}</p>

          <div className="pw-plan-card">
            <div className="pw-plan-info">
              <span className="pw-plan-name">{targetPlan.label}</span>
              <span className="pw-plan-tag">{targetPlan.tagline}</span>
            </div>
            <div className="pw-plan-price">
              <span className="pw-currency">$</span>
              {targetPlan.priceUSD}
              <span className="pw-mo">/mes</span>
            </div>
          </div>

          <div className="pw-actions">
            <button className="pw-cta" onClick={handleUpgrade} disabled={checkoutLoading}>
              {checkoutLoading ? 'Redirigiendo…' : `Suscribirme a ${targetPlan.label}`}
            </button>
            <button className="pw-secondary" onClick={() => { onClose(); navigate('/#pricing'); }}>
              Ver todos los planes
            </button>
          </div>

          <p className="pw-footnote">
            Cancela en cualquier momento — sin compromiso.
          </p>
        </div>
      </div>
    </>
  );
}
