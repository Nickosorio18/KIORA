import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useUser } from "@context/UserContext";
import { useAuth } from "@context/AuthContext";
import { useFamily, MAX_FAMILY_MEMBERS } from "@context/FamilyContext";
import { usePlan } from "@hooks/usePlan";
import { PLANS, planMeets } from "@config/plans";

async function callCheckout(planId, accessToken) {
  const res = await fetch('/api/create-checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ planId }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error al crear checkout')
  return data.checkoutUrl
}

async function callCustomerPortal(accessToken) {
  const res = await fetch('/api/customer-portal', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}` },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error al abrir portal')
  return data.portalUrl
}

/* ═══════════════════════════════════════════════════════
   KYŌRA — CuentaPage
   Perfil editable + plan actual + datos de cuenta.
   ═══════════════════════════════════════════════════════ */

/* ── Static data (mirrored from KyoraOnboarding) ── */
const GOALS = [
  { id: "lose",     label: "Perder grasa" },
  { id: "gain",     label: "Ganar músculo" },
  { id: "both",     label: "Recomposición" },
  { id: "health",   label: "Comer mejor" },
  { id: "energy",   label: "Más energía" },
  { id: "maintain", label: "Mantenerme" },
];

const ACTIVITY_LEVELS = [
  { id: "sedentary", label: "Sedentario",  desc: "Trabajo de escritorio" },
  { id: "light",     label: "Ligero",      desc: "1–2 días/semana" },
  { id: "moderate",  label: "Moderado",    desc: "3–4 días/semana" },
  { id: "high",      label: "Activo",      desc: "5–6 días intensos" },
  { id: "athlete",   label: "Atleta",      desc: "Doble sesión / competencia" },
];

const RESTRICTIONS = [
  "Sin gluten", "Sin lactosa", "Vegetariano", "Vegano",
  "Sin mariscos", "Sin frutos secos", "Bajo en sodio", "Keto",
  "Sin cerdo", "Sin azúcar añadida", "Halal", "Kosher",
];

const CUISINES = [
  "Mexicana", "Mediterránea", "Japonesa", "Italiana",
  "Peruana", "Coreana", "Americana", "India",
  "Colombiana", "Árabe", "Tailandesa", "Argentina",
];

// Fuente de verdad visual para la card "Mi plan".
// Mantener sincronizado con: src/config/plans.js · src/api/agentPrompt.js · CLAUDE.md
const PLAN_FEATURES = [
  // ── Esencial ──────────────────────────────────────────
  { label: "Planes semanales completos",  detail: "Menú 7 días con recetas y lista de compras",          minPlan: "esencial" },
  { label: "Descarga en PDF",             detail: "Exporta tu plan con macros y recetas",                 minPlan: "esencial" },
  { label: "Análisis de progreso",        detail: "Tendencias, adherencia y logros semanales",            minPlan: "esencial" },
  { label: "Mi Despensa",                 detail: "Recetas personalizadas con lo que tienes en casa",     minPlan: "esencial" },
  // ── Premium ───────────────────────────────────────────
  { label: "Rutina de entrenamiento",     detail: "Plan de ejercicio semanal integrado con tu nutrición", minPlan: "premium" },
  { label: "Historial de 8 semanas",      detail: "Revisa, compara y restaura cualquier plan anterior",   minPlan: "premium" },
  { label: "Plan familiar",               detail: "Hasta 2 perfiles adicionales en tu cuenta",            minPlan: "premium" },
  { label: "Acceso prioritario",          detail: "Primero en probar las nuevas funciones de KYŌRA",      minPlan: "premium" },
  // ── Élite ─────────────────────────────────────────────
  { label: "Consulta con nutriólogo",     detail: "Videollamada mensual con profesional certificado",     minPlan: "elite" },
];

/* ── Icons ── */
const Ico = ({ d, size = 16, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>{d}</svg>
);
const ICO = {
  check:  <Ico d={<polyline points="20 6 9 17 4 12"/>} />,
  lock:   <Ico d={<><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>} />,
  logout: <Ico d={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>} size={18} />,
  arrow:  <Ico d={<><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>} />,
  mail:   <Ico d={<><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>} size={18} />,
  user:   <Ico d={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>} size={18} />,
  users:  <Ico d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>} size={18} />,
  plus:   <Ico d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>} />,
  edit:   <Ico d={<><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></>} />,
  trash:  <Ico d={<><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></>} />,
};

/* ── Styles ── */
const css = `
.ct-wrap{max-width:1000px;margin:0 auto;padding:2.5rem 1.5rem 5rem;font-family:var(--font-b)}

@keyframes ctIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes ctFade{from{opacity:0}to{opacity:1}}

/* Header */
.ct-head{margin-bottom:2rem;animation:ctIn .4s cubic-bezier(.22,1,.36,1) both}
.ct-eyebrow{font-size:.6rem;font-weight:500;letter-spacing:.22em;text-transform:uppercase;color:var(--gold);margin-bottom:.6rem}
.ct-title{font-family:var(--font-d);font-size:2rem;font-weight:400;color:var(--charcoal);line-height:1.15;letter-spacing:-.01em;margin-bottom:.4rem}
.ct-title em{font-style:italic;color:var(--gold);font-weight:500}
.ct-sub{font-size:.92rem;font-weight:300;color:var(--text-muted);line-height:1.55;max-width:520px}

/* Cards */
.ct-card{background:var(--white);border:1px solid var(--border);border-radius:8px;padding:1.6rem;margin-bottom:1rem;animation:ctIn .45s cubic-bezier(.22,1,.36,1) both}
.ct-card:nth-child(2){animation-delay:.04s}
.ct-card:nth-child(3){animation-delay:.08s}
.ct-card:nth-child(4){animation-delay:.12s}
.ct-card:nth-child(5){animation-delay:.16s}

.ct-card-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.4rem;padding-bottom:1rem;border-bottom:1px solid var(--border)}
.ct-card-title{font-family:var(--font-d);font-size:1.1rem;font-weight:600;color:var(--text-dark)}
.ct-card-sub{font-size:.75rem;font-weight:300;color:var(--text-light);margin-top:2px}

/* Form grid */
.ct-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:.9rem 1.2rem;margin-bottom:1.2rem}
.ct-grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:.9rem}
.ct-field{display:flex;flex-direction:column;gap:.35rem}
.ct-field.full{grid-column:1/-1}
.ct-label{font-size:.6rem;font-weight:500;letter-spacing:.18em;text-transform:uppercase;color:var(--text-light)}
.ct-input,.ct-select{background:var(--cream);border:1px solid var(--border);border-radius:4px;font-family:var(--font-b);font-size:.88rem;font-weight:300;color:var(--text-dark);padding:.7rem .85rem;transition:border-color .18s,background .18s;width:100%;outline:none}
.ct-input:focus,.ct-select:focus{border-color:var(--gold);background:var(--white)}
.ct-select{cursor:pointer;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239A9189' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right .85rem center;padding-right:2rem}

/* Chips */
.ct-chips{display:flex;flex-wrap:wrap;gap:.45rem;margin-bottom:1.2rem}
.ct-chip{background:var(--cream);border:1px solid var(--border);border-radius:20px;font-family:var(--font-b);font-size:.72rem;font-weight:400;color:var(--text-muted);padding:.4rem .85rem;cursor:pointer;transition:all .15s}
.ct-chip:hover{border-color:rgba(200,169,110,.35);color:var(--text-dark)}
.ct-chip.on{background:rgba(200,169,110,.1);border-color:var(--gold);color:var(--charcoal);font-weight:500}

/* Save row */
.ct-save-row{display:flex;align-items:center;gap:1rem;justify-content:flex-end;margin-top:.4rem}
.ct-save-btn{display:inline-flex;align-items:center;gap:.5rem;background:var(--charcoal);color:var(--gold-light);border:none;border-radius:3px;font-family:var(--font-b);font-size:.72rem;font-weight:500;letter-spacing:.1em;text-transform:uppercase;padding:.75rem 1.4rem;cursor:pointer;transition:letter-spacing .25s,background .2s}
.ct-save-btn:hover{background:#000;letter-spacing:.14em}
.ct-save-btn:disabled{opacity:.45;cursor:not-allowed}
.ct-saved{font-size:.75rem;font-weight:400;color:var(--green,#7A9E7E);display:flex;align-items:center;gap:.4rem;animation:ctFade .25s}

/* Section divider */
.ct-divider{height:1px;background:var(--border);margin:1.2rem 0}
.ct-sub-label{font-size:.6rem;font-weight:500;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);margin-bottom:.7rem}

/* Plan card */
.ct-plan-badge{display:inline-flex;align-items:center;gap:.5rem;padding:.35rem .85rem;border-radius:20px;font-size:.7rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;margin-bottom:1.2rem}
.ct-features{display:flex;flex-direction:column;gap:0;border:1px solid var(--border);border-radius:6px;overflow:hidden;margin-bottom:1.2rem}
.ct-feature-row{display:flex;align-items:center;gap:.85rem;padding:.75rem 1rem;border-bottom:1px solid var(--border);transition:background .15s}
.ct-feature-row:last-child{border-bottom:none}
.ct-feature-row:hover{background:var(--cream)}
.ct-feature-ico{width:22px;height:22px;border-radius:5px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.ct-feature-ico.on{background:rgba(122,158,126,.12);color:#7A9E7E}
.ct-feature-ico.off{background:rgba(154,145,137,.08);color:#C8C0B8}
.ct-feature-info{flex:1;min-width:0}
.ct-feature-name{font-size:.82rem;font-weight:400;color:var(--text-dark);line-height:1.3}
.ct-feature-detail{font-size:.68rem;font-weight:300;color:var(--text-light);line-height:1.4;margin-top:1px}
.ct-feature-tag{font-size:.6rem;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);background:rgba(200,169,110,.08);border:1px solid rgba(200,169,110,.15);border-radius:10px;padding:1px 7px;flex-shrink:0}
.ct-upgrade-btn{display:inline-flex;align-items:center;gap:.5rem;background:var(--charcoal);color:var(--gold-light);border:none;border-radius:3px;font-family:var(--font-b);font-size:.72rem;font-weight:500;letter-spacing:.1em;text-transform:uppercase;padding:.75rem 1.4rem;cursor:pointer;transition:letter-spacing .25s,background .2s}
.ct-upgrade-btn:hover{background:#000;letter-spacing:.14em}
.ct-upgrade-btn:disabled{opacity:.5;cursor:not-allowed}
.ct-upgrade-row{display:flex;flex-wrap:wrap;gap:.6rem;margin-top:.4rem}
.ct-portal-btn{display:inline-flex;align-items:center;gap:.5rem;background:transparent;border:1px solid var(--border);border-radius:3px;font-family:var(--font-b);font-size:.72rem;font-weight:400;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted);padding:.75rem 1.4rem;cursor:pointer;transition:all .2s}
.ct-portal-btn:hover{border-color:var(--gold);color:var(--charcoal)}
.ct-portal-btn:disabled{opacity:.5;cursor:not-allowed}
.ct-messages-row{display:flex;align-items:center;justify-content:space-between;padding:.85rem 1rem;background:var(--cream);border:1px solid var(--border);border-radius:6px;margin-bottom:1.2rem}
.ct-messages-left{font-size:.82rem;font-weight:400;color:var(--text-dark)}
.ct-messages-val{font-family:var(--font-d);font-size:1rem;font-weight:600;color:var(--charcoal)}
.ct-messages-note{font-size:.68rem;font-weight:300;color:var(--text-light);margin-top:1px}

/* Account rows */
.ct-account-rows{display:flex;flex-direction:column;gap:.5rem}
.ct-account-row{display:flex;align-items:center;gap:.9rem;padding:.9rem 1rem;background:var(--cream);border:1px solid var(--border);border-radius:6px}
.ct-account-row-ico{width:32px;height:32px;border-radius:8px;background:var(--white);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;color:var(--gold);flex-shrink:0}
.ct-account-row-info{flex:1;min-width:0}
.ct-account-row-label{font-size:.6rem;font-weight:500;letter-spacing:.15em;text-transform:uppercase;color:var(--text-light);margin-bottom:2px}
.ct-account-row-val{font-size:.88rem;font-weight:400;color:var(--text-dark);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ct-logout-btn{display:inline-flex;align-items:center;gap:.5rem;background:transparent;border:1px solid rgba(201,112,112,.25);border-radius:3px;font-family:var(--font-b);font-size:.72rem;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:#C97070;padding:.75rem 1.3rem;cursor:pointer;transition:all .2s;margin-top:1rem}
.ct-logout-btn:hover{background:#FAEFEF;border-color:#C97070}

/* ── Family members ── */
.ct-family-lock{display:flex;align-items:center;gap:1rem;padding:1.1rem 1.2rem;background:var(--cream);border:1px dashed var(--border);border-radius:6px;margin-bottom:1rem}
.ct-family-lock-ico{width:38px;height:38px;border-radius:8px;background:rgba(200,169,110,.1);color:var(--gold);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.ct-family-lock-text{flex:1}
.ct-family-lock-title{font-size:.82rem;font-weight:500;color:var(--text-dark);margin-bottom:2px}
.ct-family-lock-sub{font-size:.72rem;font-weight:300;color:var(--text-light);line-height:1.4}
.ct-family-lock-cta{background:var(--charcoal);color:var(--gold-light);border:none;border-radius:3px;font-family:var(--font-b);font-size:.68rem;font-weight:500;letter-spacing:.1em;text-transform:uppercase;padding:.6rem 1rem;cursor:pointer;flex-shrink:0;transition:background .2s}
.ct-family-lock-cta:hover{background:#000}

.ct-member-list{display:flex;flex-direction:column;gap:.7rem;margin-bottom:1rem}
.ct-member-card{display:flex;align-items:center;gap:.85rem;padding:.9rem 1rem;background:var(--cream);border:1px solid var(--border);border-radius:6px}
.ct-member-avatar{width:36px;height:36px;border-radius:50%;background:rgba(122,158,126,.7);color:#fff;display:flex;align-items:center;justify-content:center;font-size:.88rem;font-weight:600;flex-shrink:0}
.ct-member-info{flex:1;min-width:0}
.ct-member-name{font-size:.88rem;font-weight:500;color:var(--text-dark);line-height:1.3}
.ct-member-meta{font-size:.7rem;font-weight:300;color:var(--text-light);margin-top:1px}
.ct-member-actions{display:flex;gap:.4rem;flex-shrink:0}
.ct-member-btn{background:none;border:1px solid var(--border);border-radius:4px;padding:.4rem .55rem;cursor:pointer;color:var(--text-light);transition:all .15s;display:flex;align-items:center;justify-content:center}
.ct-member-btn:hover{border-color:var(--gold);color:var(--gold)}
.ct-member-btn.danger:hover{border-color:#C97070;color:#C97070}

.ct-add-member-btn{display:inline-flex;align-items:center;gap:.5rem;background:transparent;border:1px solid var(--border);border-radius:3px;font-family:var(--font-b);font-size:.72rem;font-weight:400;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted);padding:.65rem 1.2rem;cursor:pointer;transition:all .2s}
.ct-add-member-btn:hover{border-color:var(--gold);color:var(--gold)}
.ct-family-empty{font-size:.82rem;font-weight:300;color:var(--text-light);padding:.6rem 0;margin-bottom:.8rem}

/* ── Family member modal ── */
.fam-overlay{position:fixed;inset:0;background:rgba(26,26,30,.45);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:200;animation:ctFade .2s}
.fam-modal{background:var(--white);border:1px solid var(--border);border-radius:8px;width:500px;max-width:94vw;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(26,26,46,.12);animation:ctIn .22s cubic-bezier(.22,1,.36,1)}
.fam-modal-head{display:flex;justify-content:space-between;align-items:center;padding:1.2rem 1.4rem;border-bottom:1px solid var(--border);position:sticky;top:0;background:var(--white);z-index:1}
.fam-modal-title{font-family:var(--font-d);font-size:1.05rem;font-weight:600;color:var(--text-dark)}
.fam-modal-close{background:none;border:none;font-size:1.2rem;color:var(--text-light);cursor:pointer;padding:0 .25rem;line-height:1}
.fam-modal-close:hover{color:var(--text-dark)}
.fam-modal-body{padding:1.3rem 1.4rem;display:flex;flex-direction:column;gap:.9rem}
.fam-modal-section{font-size:.58rem;font-weight:500;letter-spacing:.2em;text-transform:uppercase;color:var(--gold);margin-bottom:-.2rem;margin-top:.4rem}
.fam-modal-foot{display:flex;justify-content:flex-end;gap:.8rem;padding:1rem 1.4rem;border-top:1px solid var(--border);position:sticky;bottom:0;background:var(--white)}

/* Responsive */
@media(max-width:640px){
  .ct-wrap{padding:1.5rem 1rem 4rem}
  .ct-title{font-size:1.65rem}
  .ct-grid{grid-template-columns:1fr}
  .ct-grid-3{grid-template-columns:1fr}
  .ct-field.full{grid-column:1}
}
`;

/* ════════════════════════════════════════ */

const EMPTY_MEMBER = { nombre: "", edad: "", sexo: "", peso: "", altura: "", objetivo: "", actividad: "", restricciones: [], cocinas: [] };

export default function CuentaPage() {
  const navigate  = useNavigate();
  const { profile, updateProfile } = useUser();
  const { session, signOut }        = useAuth();
  const plan = usePlan();
  const { members: familyMembers, addMember, updateMember, removeMember, canAddMember } = useFamily();

  /* Draft state — one object for the whole profile */
  const [draft, setDraft] = useState(() => ({ ...(profile || {}) }));
  const [saved, setSaved] = useState(null); // "perfil" | "prefs"

  /* Checkout / portal loading state */
  const [checkoutLoading, setCheckoutLoading] = useState(null); // planId being processed
  const [portalLoading, setPortalLoading] = useState(false);

  /* Family member modal state */
  const [memberModal, setMemberModal] = useState(false);       // open/close
  const [editingMemberId, setEditingMemberId] = useState(null); // null = new
  const [memberDraft, setMemberDraft] = useState(EMPTY_MEMBER);
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);

  const email          = session?.user?.email || "—";
  const currentPlan    = PLANS.find(p => p.id === (profile?.plan || "esencial")) || PLANS[0];
  const isUnlimitedMsg = true; // Todos los planes KYŌRA incluyen mensajes ilimitados

  function upd(field, val) {
    setDraft(d => ({ ...d, [field]: val }));
  }

  function toggleChip(field, val) {
    setDraft(d => {
      const arr = Array.isArray(d[field]) ? d[field] : [];
      return { ...d, [field]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] };
    });
  }

  function isDirty(fields) {
    return fields.some(f => {
      const a = draft[f]; const b = profile?.[f];
      if (Array.isArray(a) || Array.isArray(b))
        return JSON.stringify(a ?? []) !== JSON.stringify(b ?? []);
      return (a ?? "") !== (b ?? "");
    });
  }

  function saveSection(key, fields) {
    const partial = Object.fromEntries(fields.map(f => [f, draft[f]]));
    updateProfile(partial);
    setSaved(key);
    setTimeout(() => setSaved(null), 2500);
  }

  async function handleLogout() {
    await signOut();
    navigate("/");
  }

  async function handleUpgrade(planId) {
    setCheckoutLoading(planId);
    try {
      const url = await callCheckout(planId, session?.access_token);
      if (url) window.location.href = url;
    } catch (err) {
      console.error('[upgrade]', err);
      alert('Ocurrió un error al iniciar el pago. Intenta de nuevo.');
    } finally {
      setCheckoutLoading(null);
    }
  }

  async function handleManageSubscription() {
    setPortalLoading(true);
    try {
      const url = await callCustomerPortal(session?.access_token);
      if (url) window.open(url, '_blank', 'noopener');
    } catch (err) {
      console.error('[portal]', err);
      alert('No se pudo abrir el portal. Intenta de nuevo.');
    } finally {
      setPortalLoading(false);
    }
  }

  /* ── Family member helpers ── */
  function openAddMember() {
    setEditingMemberId(null);
    setMemberDraft(EMPTY_MEMBER);
    setMemberModal(true);
  }
  function openEditMember(m) {
    setEditingMemberId(m.id);
    setMemberDraft({ ...EMPTY_MEMBER, ...m });
    setMemberModal(true);
  }
  function closeMemberModal() {
    setMemberModal(false);
    setEditingMemberId(null);
    setMemberDraft(EMPTY_MEMBER);
  }
  function updMember(field, val) {
    setMemberDraft(d => ({ ...d, [field]: val }));
  }
  function toggleMemberChip(field, val) {
    setMemberDraft(d => {
      const arr = Array.isArray(d[field]) ? d[field] : [];
      return { ...d, [field]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] };
    });
  }
  function saveMember(e) {
    e.preventDefault();
    if (!memberDraft.nombre?.trim()) return;
    if (editingMemberId) {
      updateMember(editingMemberId, memberDraft);
    } else {
      addMember(memberDraft);
    }
    closeMemberModal();
  }

  const goalLabel = useCallback((id) => {
    return GOALS.find(g => g.id === id)?.label || id || "—";
  }, []);

  const profileFields = ["nombre", "edad", "sexo", "peso", "altura", "objetivo", "actividad"];
  const prefFields    = ["restricciones", "cocinas"];

  return (
    <>
      <Helmet>
        <title>Mi Cuenta — KYŌRA</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <style>{css}</style>

      <div className="ct-wrap">
        {/* ── Header ── */}
        <div className="ct-head">
          <div className="ct-eyebrow">Mi Cuenta</div>
          <h1 className="ct-title">Tu <em>perfil</em> en KYŌRA</h1>
          <p className="ct-sub">
            Mantén tus datos actualizados para que KYŌRA siga generando planes precisos y personalizados para ti.
          </p>
        </div>

        {/* ═══════════════════════════════════════
            Card 1 — Datos personales
        ════════════════════════════════════════ */}
        <div className="ct-card">
          <div className="ct-card-head">
            <div>
              <div className="ct-card-title">Datos personales</div>
              <div className="ct-card-sub">Nombre, medidas y objetivos</div>
            </div>
          </div>

          {/* Nombre + Edad */}
          <div className="ct-grid">
            <div className="ct-field full">
              <label className="ct-label">Nombre</label>
              <input className="ct-input" type="text" value={draft.nombre || ""}
                placeholder="Tu nombre" onChange={e => upd("nombre", e.target.value)} />
            </div>
            <div className="ct-field">
              <label className="ct-label">Edad</label>
              <input className="ct-input" type="number" min="10" max="100"
                value={draft.edad || ""} placeholder="30" onChange={e => upd("edad", e.target.value)} />
            </div>
            <div className="ct-field">
              <label className="ct-label">Sexo</label>
              <select className="ct-select" value={draft.sexo || ""}
                onChange={e => upd("sexo", e.target.value)}>
                <option value="">Seleccionar</option>
                <option value="hombre">Hombre</option>
                <option value="mujer">Mujer</option>
                <option value="otro">Prefiero no decir</option>
              </select>
            </div>
            <div className="ct-field">
              <label className="ct-label">Peso (kg)</label>
              <input className="ct-input" type="number" min="30" max="300" step="0.5"
                value={draft.peso || ""} placeholder="75" onChange={e => upd("peso", e.target.value)} />
            </div>
            <div className="ct-field">
              <label className="ct-label">Altura (cm)</label>
              <input className="ct-input" type="number" min="100" max="250"
                value={draft.altura || ""} placeholder="172" onChange={e => upd("altura", e.target.value)} />
            </div>
          </div>

          <div className="ct-divider" />
          <div className="ct-sub-label">Objetivo y actividad</div>

          <div className="ct-grid">
            <div className="ct-field">
              <label className="ct-label">Objetivo principal</label>
              <select className="ct-select" value={draft.objetivo || ""}
                onChange={e => upd("objetivo", e.target.value)}>
                <option value="">Seleccionar</option>
                {GOALS.map(g => (
                  <option key={g.id} value={g.id}>{g.label}</option>
                ))}
              </select>
            </div>
            <div className="ct-field">
              <label className="ct-label">Nivel de actividad</label>
              <select className="ct-select" value={draft.actividad || ""}
                onChange={e => upd("actividad", e.target.value)}>
                <option value="">Seleccionar</option>
                {ACTIVITY_LEVELS.map(a => (
                  <option key={a.id} value={a.id}>{a.label} — {a.desc}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="ct-save-row">
            {saved === "perfil" && (
              <span className="ct-saved">{ICO.check} Cambios guardados</span>
            )}
            <button
              className="ct-save-btn"
              disabled={!isDirty(profileFields)}
              onClick={() => saveSection("perfil", profileFields)}
            >
              Guardar cambios
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════
            Card 2 — Preferencias alimentarias
        ════════════════════════════════════════ */}
        <div className="ct-card">
          <div className="ct-card-head">
            <div>
              <div className="ct-card-title">Preferencias alimentarias</div>
              <div className="ct-card-sub">Restricciones y cocinas favoritas</div>
            </div>
          </div>

          <div className="ct-sub-label">Restricciones dietéticas</div>
          <div className="ct-chips">
            {RESTRICTIONS.map(r => (
              <button
                key={r}
                className={`ct-chip${(draft.restricciones || []).includes(r) ? " on" : ""}`}
                onClick={() => toggleChip("restricciones", r)}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="ct-divider" />
          <div className="ct-sub-label">Cocinas favoritas</div>
          <div className="ct-chips">
            {CUISINES.map(c => (
              <button
                key={c}
                className={`ct-chip${(draft.cocinas || []).includes(c) ? " on" : ""}`}
                onClick={() => toggleChip("cocinas", c)}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="ct-save-row">
            {saved === "prefs" && (
              <span className="ct-saved">{ICO.check} Cambios guardados</span>
            )}
            <button
              className="ct-save-btn"
              disabled={!isDirty(prefFields)}
              onClick={() => saveSection("prefs", prefFields)}
            >
              Guardar cambios
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════
            Card 3 — Perfiles de familia
        ════════════════════════════════════════ */}
        <div className="ct-card">
          <div className="ct-card-head">
            <div>
              <div className="ct-card-title">Perfiles de familia</div>
              <div className="ct-card-sub">
                Hasta {MAX_FAMILY_MEMBERS} perfiles adicionales en tu cuenta — Plan Premium
              </div>
            </div>
            {ICO.users}
          </div>

          {!plan.isPremiumOrAbove ? (
            /* Paywall */
            <div className="ct-family-lock">
              <div className="ct-family-lock-ico">{ICO.lock}</div>
              <div className="ct-family-lock-text">
                <div className="ct-family-lock-title">Disponible en Plan Premium</div>
                <div className="ct-family-lock-sub">
                  Agrega hasta 2 perfiles adicionales. Cada uno tiene su propio plan de alimentación y rutina personalizada.
                </div>
              </div>
              <button
                className="ct-family-lock-cta"
                disabled={checkoutLoading === "premium"}
                onClick={() => handleUpgrade("premium")}
              >
                {checkoutLoading === "premium" ? "…" : "Suscribirme"}
              </button>
            </div>
          ) : (
            /* Lista de miembros */
            <>
              {familyMembers.length === 0 && (
                <p className="ct-family-empty">
                  Aún no has agregado perfiles familiares. Puedes añadir hasta {MAX_FAMILY_MEMBERS}.
                </p>
              )}
              {familyMembers.length > 0 && (
                <div className="ct-member-list">
                  {familyMembers.map((m) => (
                    <div className="ct-member-card" key={m.id}>
                      <div className="ct-member-avatar">
                        {(m.nombre?.[0] || "?").toUpperCase()}
                      </div>
                      <div className="ct-member-info">
                        <div className="ct-member-name">{m.nombre || "Sin nombre"}</div>
                        <div className="ct-member-meta">
                          {[m.edad && `${m.edad} años`, goalLabel(m.objetivo)].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      <div className="ct-member-actions">
                        <button
                          className="ct-member-btn"
                          title="Editar"
                          onClick={() => openEditMember(m)}
                        >
                          {ICO.edit}
                        </button>
                        <button
                          className="ct-member-btn danger"
                          title="Eliminar"
                          onClick={() => setConfirmRemoveId(m.id)}
                        >
                          {ICO.trash}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {canAddMember && (
                <button className="ct-add-member-btn" onClick={openAddMember}>
                  {ICO.plus} Agregar perfil familiar
                </button>
              )}
              {!canAddMember && (
                <p style={{ fontSize: ".75rem", color: "var(--text-light)", fontWeight: 300 }}>
                  Has alcanzado el límite de {MAX_FAMILY_MEMBERS} perfiles adicionales.
                </p>
              )}
            </>
          )}
        </div>

        {/* ═══════════════════════════════════════
            Card 4 — Plan actual
        ════════════════════════════════════════ */}
        <div className="ct-card">
          <div className="ct-card-head">
            <div>
              <div className="ct-card-title">Mi plan</div>
              <div className="ct-card-sub">Funcionalidades incluidas en tu suscripción</div>
            </div>
          </div>

          {/* Plan badge */}
          <div
            className="ct-plan-badge"
            style={{
              background: `${currentPlan.color}18`,
              border: `1px solid ${currentPlan.color}40`,
              color: currentPlan.color,
            }}
          >
            {currentPlan.label}
            {currentPlan.priceUSD > 0 && (
              <span style={{ fontWeight: 300, letterSpacing: 0 }}>
                · {currentPlan.priceLocal?.MX ?? `$${currentPlan.priceUSD} USD`} / mes
              </span>
            )}
          </div>

          {/* Messages row */}
          <div className="ct-messages-row">
            <div className="ct-messages-left">
              <div style={{ fontSize: ".6rem", fontWeight: 500, letterSpacing: ".15em", textTransform: "uppercase", color: "var(--text-light)", marginBottom: 2 }}>
                Mensajes con KYŌRA
              </div>
              {isUnlimitedMsg
                ? <div className="ct-messages-val">Ilimitados ✓</div>
                : <><div className="ct-messages-val">20 / mes</div>
                   <div className="ct-messages-note">Pasa a Starter para mensajes ilimitados</div></>
              }
            </div>
          </div>

          {/* Feature list */}
          <div className="ct-features">
            {PLAN_FEATURES.map(f => {
              const has = planMeets(profile?.plan || "esencial", f.minPlan);
              const planData = PLANS.find(p => p.id === f.minPlan);
              return (
                <div className="ct-feature-row" key={f.label}>
                  <div className={`ct-feature-ico ${has ? "on" : "off"}`}>
                    {has ? ICO.check : ICO.lock}
                  </div>
                  <div className="ct-feature-info">
                    <div className="ct-feature-name"
                      style={has ? {} : { color: "var(--text-light)" }}>
                      {f.label}
                    </div>
                    <div className="ct-feature-detail">{f.detail}</div>
                  </div>
                  {!has && planData && (
                    <span className="ct-feature-tag">{planData.label}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Acciones de suscripción */}
          <div className="ct-upgrade-row">
            {/* Upgrade a planes superiores */}
            {PLANS.filter(p => p.order > currentPlan.order).map(p => (
              <button
                key={p.id}
                className="ct-upgrade-btn"
                disabled={checkoutLoading === p.id}
                onClick={() => handleUpgrade(p.id)}
              >
                {checkoutLoading === p.id ? 'Redirigiendo…' : `Pasarme a ${p.label}`} {ICO.arrow}
              </button>
            ))}
            {/* Gestionar suscripción activa (Premium o Elite) */}
            {planMeets(profile?.plan || "esencial", "premium") && (
              <button
                className="ct-portal-btn"
                disabled={portalLoading}
                onClick={handleManageSubscription}
              >
                {portalLoading ? 'Abriendo…' : 'Gestionar suscripción'}
              </button>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════
            Card 4 — Cuenta
        ════════════════════════════════════════ */}
        <div className="ct-card">
          <div className="ct-card-head">
            <div>
              <div className="ct-card-title">Tu cuenta</div>
              <div className="ct-card-sub">Datos de acceso</div>
            </div>
          </div>

          <div className="ct-account-rows">
            <div className="ct-account-row">
              <div className="ct-account-row-ico">{ICO.mail}</div>
              <div className="ct-account-row-info">
                <div className="ct-account-row-label">Correo electrónico</div>
                <div className="ct-account-row-val">{email}</div>
              </div>
            </div>
            <div className="ct-account-row">
              <div className="ct-account-row-ico">{ICO.user}</div>
              <div className="ct-account-row-info">
                <div className="ct-account-row-label">ID de usuario</div>
                <div className="ct-account-row-val" style={{ fontSize: ".75rem", color: "var(--text-light)" }}>
                  {session?.user?.id?.slice(0, 18) || "—"}…
                </div>
              </div>
            </div>
          </div>

          <button className="ct-logout-btn" onClick={handleLogout}>
            {ICO.logout} Cerrar sesión
          </button>
        </div>
      </div>

      {/* ═══ Agregar / Editar miembro ═══ */}
      {memberModal && (
        <div className="fam-overlay" onClick={closeMemberModal}>
          <form className="fam-modal" onClick={e => e.stopPropagation()} onSubmit={saveMember}>
            <div className="fam-modal-head">
              <span className="fam-modal-title">
                {editingMemberId ? "Editar perfil" : "Agregar perfil familiar"}
              </span>
              <button type="button" className="fam-modal-close" onClick={closeMemberModal}>×</button>
            </div>
            <div className="fam-modal-body">
              <div className="fam-modal-section">Datos básicos</div>
              <div className="ct-grid">
                <div className="ct-field full">
                  <label className="ct-label">Nombre *</label>
                  <input className="ct-input" type="text" autoFocus required
                    value={memberDraft.nombre} onChange={e => updMember("nombre", e.target.value)}
                    placeholder="Nombre del familiar" />
                </div>
                <div className="ct-field">
                  <label className="ct-label">Edad</label>
                  <input className="ct-input" type="number" min="1" max="120"
                    value={memberDraft.edad} onChange={e => updMember("edad", e.target.value)}
                    placeholder="30" />
                </div>
                <div className="ct-field">
                  <label className="ct-label">Sexo</label>
                  <select className="ct-select" value={memberDraft.sexo} onChange={e => updMember("sexo", e.target.value)}>
                    <option value="">Seleccionar</option>
                    <option value="hombre">Hombre</option>
                    <option value="mujer">Mujer</option>
                    <option value="otro">Prefiero no decir</option>
                  </select>
                </div>
                <div className="ct-field">
                  <label className="ct-label">Peso (kg)</label>
                  <input className="ct-input" type="number" min="10" max="300" step="0.5"
                    value={memberDraft.peso} onChange={e => updMember("peso", e.target.value)}
                    placeholder="70" />
                </div>
                <div className="ct-field">
                  <label className="ct-label">Altura (cm)</label>
                  <input className="ct-input" type="number" min="50" max="250"
                    value={memberDraft.altura} onChange={e => updMember("altura", e.target.value)}
                    placeholder="170" />
                </div>
              </div>

              <div className="fam-modal-section">Objetivo y actividad</div>
              <div className="ct-grid">
                <div className="ct-field">
                  <label className="ct-label">Objetivo</label>
                  <select className="ct-select" value={memberDraft.objetivo} onChange={e => updMember("objetivo", e.target.value)}>
                    <option value="">Seleccionar</option>
                    {GOALS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
                  </select>
                </div>
                <div className="ct-field">
                  <label className="ct-label">Nivel de actividad</label>
                  <select className="ct-select" value={memberDraft.actividad} onChange={e => updMember("actividad", e.target.value)}>
                    <option value="">Seleccionar</option>
                    {ACTIVITY_LEVELS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="fam-modal-section">Restricciones</div>
              <div className="ct-chips">
                {RESTRICTIONS.map(r => (
                  <button key={r} type="button"
                    className={`ct-chip${(memberDraft.restricciones || []).includes(r) ? " on" : ""}`}
                    onClick={() => toggleMemberChip("restricciones", r)}>{r}</button>
                ))}
              </div>

              <div className="fam-modal-section">Cocinas favoritas</div>
              <div className="ct-chips">
                {CUISINES.map(c => (
                  <button key={c} type="button"
                    className={`ct-chip${(memberDraft.cocinas || []).includes(c) ? " on" : ""}`}
                    onClick={() => toggleMemberChip("cocinas", c)}>{c}</button>
                ))}
              </div>
            </div>
            <div className="fam-modal-foot">
              <button type="button" className="ct-logout-btn" style={{ marginTop: 0, border: "1px solid var(--border)", color: "var(--text-muted)" }} onClick={closeMemberModal}>
                Cancelar
              </button>
              <button type="submit" className="ct-save-btn" disabled={!memberDraft.nombre?.trim()}>
                {editingMemberId ? "Guardar cambios" : "Agregar perfil"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ═══ Confirm eliminar miembro ═══ */}
      {confirmRemoveId && (
        <div className="fam-overlay" onClick={() => setConfirmRemoveId(null)}>
          <div className="fam-modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="fam-modal-head">
              <span className="fam-modal-title">¿Eliminar este perfil?</span>
              <button type="button" className="fam-modal-close" onClick={() => setConfirmRemoveId(null)}>×</button>
            </div>
            <div className="fam-modal-body" style={{ fontSize: ".85rem", fontWeight: 300, color: "var(--text-muted)", lineHeight: 1.6 }}>
              El perfil se eliminará permanentemente. Los planes generados para este perfil se mantendrán en el historial de la cuenta.
            </div>
            <div className="fam-modal-foot">
              <button type="button" className="ct-logout-btn" style={{ marginTop: 0, border: "1px solid var(--border)", color: "var(--text-muted)" }} onClick={() => setConfirmRemoveId(null)}>
                Cancelar
              </button>
              <button type="button" className="ct-save-btn"
                style={{ background: "#C84A4A" }}
                onClick={() => { removeMember(confirmRemoveId); setConfirmRemoveId(null); }}>
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
