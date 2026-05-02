import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@context/AuthContext";
import { useUser } from "@context/UserContext";
import { useFamily } from "@context/FamilyContext";
import { usePlan } from "@hooks/usePlan";
import { clearAgentHistoryStorage } from "@hooks/useAgentHistory";
import { PLANS } from "@config/plans";

// Dev-only: permite cambiar de tier sin tocar localStorage ni consola.
// Vite define import.meta.env.DEV = true solo en `npm run dev`.
// En producción (build) esto es false y todo el bloque desaparece del bundle.
const IS_DEV = import.meta.env.DEV;

/* ═══════════════════════════════════════════════════════
   KYŌRA — Dashboard Layout (Sidebar compartido)
   Envuelve Dashboard, Agente y Despensa con la misma
   barra lateral para navegación persistente.
   ═══════════════════════════════════════════════════════ */

/* ── SVG Icons (Lucide-style, stroke-based) ── */
const Icon = ({ d, size = 18, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>{typeof d === "string" ? <path d={d} /> : d}</svg>
);

const ICONS = {
  dash: <Icon d={<><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></>} />,
  agent: <Icon d={<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 10h.01"/><path d="M12 10h.01"/><path d="M16 10h.01"/></>} />,
  pantry: <Icon d={<><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></>} />,
  plan: <Icon d={<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>} />,
  progress: <Icon d={<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>} />,
  logout: <Icon d={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>} />,
  user: <Icon d={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>} />,
  card: <Icon d={<><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></>} />,
};

const NAV_ITEMS = [
  { id: "dash", label: "Dashboard", path: "/app/dashboard" },
  { id: "agent", label: "Mi Agente", path: "/app/agent" },
  { id: "pantry", label: "Despensa", path: "/app/pantry" },
  { id: "plan", label: "Mi Semana", path: "/app/plan" },
  { id: "progress", label: "Progreso", path: "/app/progress" },
];

const layoutCss = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Jost:ital,wght@0,200;0,300;0,400;0,500;0,600;1,300&display=swap');

:root {
  --gold:#C8A96E;--gold-light:#E8D5A3;--gold-glow:rgba(200,169,110,.1);
  --charcoal:#1A1A1E;--charcoal-soft:#2A2A30;--charcoal-mid:#222228;
  --cream:#FAF8F5;--cream-dark:#F0EBE3;
  --green:#7A9E7E;--green-light:#EDF3EE;--green-glow:rgba(122,158,126,.1);
  --red-soft:#C97070;--red-light:#FAEFEF;
  --blue-soft:#7A8E9E;--blue-light:#EDF1F3;
  --text-dark:#1A1A2E;--text-muted:#6B6B80;--text-light:#9A9189;
  --border:rgba(200,169,110,.12);--border-strong:rgba(200,169,110,.2);
  --white:#FFF;
  --font-d:'Playfair Display',Georgia,serif;
  --font-b:'Jost',system-ui,sans-serif;
  --shadow-sm:0 1px 3px rgba(26,26,46,.04);
  --shadow-md:0 4px 20px rgba(26,26,46,.05);
  --radius:6px;
}
*{margin:0;padding:0;box-sizing:border-box}

.layout{font-family:var(--font-b);display:flex;height:100vh;background:var(--cream);color:var(--text-dark);overflow:hidden}

/* ═══ SIDEBAR ═══ */
.side{width:230px;background:var(--charcoal);display:flex;flex-direction:column;flex-shrink:0;padding:2rem 0}
.side-logo{font-family:var(--font-d);font-size:1.2rem;font-weight:500;letter-spacing:.3em;color:var(--white);padding:0 1.5rem;margin-bottom:2.5rem;border:none;display:block;text-decoration:none}
.side-logo .ac{color:var(--gold);font-weight:700}
.side-section-label{font-size:.52rem;font-weight:400;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.18);padding:0 1.5rem;margin-bottom:.6rem}

.side-nav{display:flex;flex-direction:column;gap:2px;margin-bottom:auto}
.side-item{display:flex;align-items:center;gap:.85rem;padding:.95rem 1.5rem;color:rgba(255,255,255,.4);font-size:.82rem;font-weight:300;letter-spacing:.03em;cursor:pointer;transition:all .25s;position:relative;border:none;background:none;width:100%;text-align:left;font-family:var(--font-b);border-left:2px solid transparent}
.side-item:hover{color:rgba(255,255,255,.65);background:rgba(255,255,255,.03)}
.side-item.active{color:var(--gold-light);background:rgba(200,169,110,.06);border-left-color:var(--gold)}
.side-item-icon{width:20px;display:flex;align-items:center;justify-content:center;opacity:.85;flex-shrink:0}
.side-item.active .side-item-icon{opacity:1}
.side-soon-badge{font-size:.5rem;background:rgba(200,169,110,.15);color:var(--gold-light);padding:1px 6px;border-radius:10px;margin-left:auto;letter-spacing:.05em}

.side-plan{margin:auto 1.2rem 0;padding:.8rem 1rem;background:rgba(200,169,110,.08);border:1px solid rgba(200,169,110,.12);border-radius:var(--radius)}
.side-plan-label{font-size:.58rem;font-weight:400;letter-spacing:.15em;text-transform:uppercase;color:rgba(200,169,110,.6);margin-bottom:.2rem}
.side-plan-name{font-family:var(--font-d);font-size:.95rem;font-weight:600;color:var(--gold-light)}

.side-profile-wrap{position:relative;margin-top:.8rem;border-top:1px solid rgba(255,255,255,.05)}
.side-profile{display:flex;align-items:center;gap:.7rem;padding:1rem 1.5rem;cursor:pointer;transition:background .2s;width:100%;background:none;border:none;text-align:left;font-family:var(--font-b);color:inherit}
.side-profile:hover,.side-profile[aria-expanded="true"]{background:rgba(255,255,255,.04)}
.side-avatar{width:32px;height:32px;border-radius:50%;background:var(--gold);display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:600;color:var(--charcoal);flex-shrink:0}
.side-profile-info{flex:1;min-width:0}
.side-profile-name{font-size:.78rem;font-weight:500;color:rgba(255,255,255,.7);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.side-profile-plan{font-size:.6rem;color:rgba(255,255,255,.3);font-weight:300}
.side-profile-chev{color:rgba(255,255,255,.35);transition:transform .2s;flex-shrink:0}
.side-profile[aria-expanded="true"] .side-profile-chev{transform:rotate(180deg);color:var(--gold-light)}

/* ═══ AVATAR DROPDOWN ═══ */
.avatar-menu{position:absolute;bottom:calc(100% + 6px);left:1rem;right:1rem;background:var(--charcoal-soft);border:1px solid rgba(200,169,110,.15);border-radius:6px;padding:.4rem;box-shadow:0 -8px 28px rgba(0,0,0,.4);animation:amSlide .15s ease-out;z-index:10}
@keyframes amSlide{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
.avatar-menu-head{padding:.7rem .8rem .85rem;border-bottom:1px solid rgba(255,255,255,.06);margin-bottom:.3rem}
.avatar-menu-head-name{font-family:var(--font-d);font-size:.92rem;font-weight:600;color:var(--gold-light);line-height:1.2;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.avatar-menu-head-plan{font-size:.62rem;font-weight:400;letter-spacing:.12em;text-transform:uppercase;color:rgba(200,169,110,.55)}
.avatar-menu-item{display:flex;align-items:center;gap:.7rem;width:100%;padding:.65rem .75rem;background:none;border:none;border-radius:4px;color:rgba(255,255,255,.75);font-family:var(--font-b);font-size:.78rem;font-weight:400;text-align:left;cursor:pointer;transition:all .15s}
.avatar-menu-item:hover{background:rgba(200,169,110,.08);color:var(--gold-light)}
.avatar-menu-item.danger{color:rgba(201,112,112,.8)}
.avatar-menu-item.danger:hover{background:rgba(201,112,112,.08);color:#E89090}
.avatar-menu-sep{height:1px;background:rgba(255,255,255,.06);margin:.3rem 0}
.avatar-menu-item-icon{width:16px;height:16px;display:flex;align-items:center;justify-content:center;opacity:.7;flex-shrink:0}

/* ═══ FAMILY PROFILE SWITCHER (dentro del dropdown) ═══ */
.family-switch-sep{height:1px;background:rgba(255,255,255,.06);margin:.3rem 0}
.family-switch-label{font-size:.55rem;font-weight:500;letter-spacing:.15em;text-transform:uppercase;color:rgba(200,169,110,.55);padding:.5rem .8rem .2rem;font-family:var(--font-b)}
.family-switch-item{display:flex;align-items:center;gap:.65rem;width:100%;padding:.55rem .75rem;background:none;border:none;border-radius:4px;color:rgba(255,255,255,.65);font-family:var(--font-b);font-size:.78rem;font-weight:400;text-align:left;cursor:pointer;transition:all .15s}
.family-switch-item:hover{background:rgba(200,169,110,.08);color:var(--gold-light)}
.family-switch-item.active-profile{background:rgba(200,169,110,.1);color:var(--gold-light)}
.family-switch-avatar{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:600;flex-shrink:0}
.family-switch-avatar.main{background:var(--gold);color:var(--charcoal)}
.family-switch-avatar.member{background:rgba(122,158,126,.7);color:#fff}
.family-switch-check{margin-left:auto;color:var(--gold);flex-shrink:0}
.family-add-btn{display:flex;align-items:center;gap:.65rem;width:100%;padding:.55rem .75rem;background:none;border:none;border-radius:4px;color:rgba(200,169,110,.5);font-family:var(--font-b);font-size:.75rem;font-weight:400;text-align:left;cursor:pointer;transition:all .15s;border:1px dashed rgba(200,169,110,.2);margin:.3rem .3rem 0}
.family-add-btn:hover{color:var(--gold-light);border-color:rgba(200,169,110,.4);background:rgba(200,169,110,.05)}

/* ═══ DEV-ONLY TIER SWITCHER ═══ */
.dev-switcher{margin:.3rem -.4rem -.4rem;padding:.6rem .8rem .7rem;background:repeating-linear-gradient(45deg,rgba(255,170,0,.04),rgba(255,170,0,.04) 6px,rgba(255,170,0,.07) 6px,rgba(255,170,0,.07) 12px);border-top:1px dashed rgba(255,170,0,.25);border-radius:0 0 4px 4px}
.dev-switcher-label{display:flex;align-items:center;gap:.4rem;font-size:.55rem;font-weight:500;letter-spacing:.15em;text-transform:uppercase;color:rgba(255,200,80,.85);margin-bottom:.5rem;font-family:ui-monospace,'SF Mono',Menlo,monospace}
.dev-switcher-badge{background:rgba(255,170,0,.2);color:#FFC850;padding:1px 5px;border-radius:3px;font-size:.52rem;font-weight:600;letter-spacing:.1em}
.dev-switcher-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:3px}
.dev-chip{padding:.35rem 0;background:rgba(0,0,0,.2);border:1px solid rgba(255,255,255,.05);border-radius:3px;color:rgba(255,255,255,.55);font-family:ui-monospace,'SF Mono',Menlo,monospace;font-size:.55rem;font-weight:500;letter-spacing:.05em;text-transform:uppercase;cursor:pointer;transition:all .15s;text-align:center}
.dev-chip:hover{background:rgba(255,170,0,.1);border-color:rgba(255,170,0,.3);color:#FFD070}
.dev-chip.active{background:rgba(255,170,0,.22);border-color:rgba(255,170,0,.5);color:#FFD070;box-shadow:inset 0 0 0 1px rgba(255,170,0,.25)}

/* ═══ MAIN CONTENT ═══ */
.layout-main{flex:1;overflow-y:auto;display:flex;flex-direction:column}

/* ═══ LOGOUT MODAL ═══ */
.logout-overlay{position:fixed;inset:0;background:rgba(26,26,30,.45);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:200;animation:loFadeIn .15s}
@keyframes loFadeIn{from{opacity:0}to{opacity:1}}
.logout-box{background:var(--white);border:1px solid var(--border);border-radius:var(--radius);width:380px;max-width:90vw;padding:2.2rem 2rem;text-align:center;box-shadow:0 20px 60px rgba(26,26,46,.12);animation:loSlideUp .2s ease-out}
@keyframes loSlideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.logout-icon{width:48px;height:48px;border-radius:50%;background:var(--red-light);border:1px solid rgba(201,112,112,.15);display:flex;align-items:center;justify-content:center;margin:0 auto 1.2rem;font-size:1.1rem;color:var(--red-soft)}
.logout-title{font-family:var(--font-d);font-size:1.2rem;font-weight:600;color:var(--charcoal);margin-bottom:.4rem}
.logout-desc{font-size:.82rem;font-weight:300;color:var(--text-muted);line-height:1.6;margin-bottom:1.8rem}
.logout-btns{display:flex;gap:.8rem;justify-content:center}
.logout-btn-cancel{padding:.65rem 1.5rem;background:transparent;border:1px solid var(--border);border-radius:3px;font-family:var(--font-b);font-size:.72rem;font-weight:400;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted);cursor:pointer;transition:all .2s}
.logout-btn-cancel:hover{border-color:var(--gold);color:var(--gold)}
.logout-btn-confirm{padding:.65rem 1.5rem;background:var(--red-soft);border:none;border-radius:3px;font-family:var(--font-b);font-size:.72rem;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:var(--white);cursor:pointer;transition:all .2s}
.logout-btn-confirm:hover{background:#B85C5C;transform:translateY(-1px)}

/* ═══ MOBILE HEADER ═══ */
.m-header{display:none;position:sticky;top:0;z-index:50;background:var(--charcoal);border-bottom:1px solid rgba(200,169,110,.08);height:54px;flex-shrink:0;align-items:center;justify-content:space-between;padding:0 1.1rem}
.m-logo{font-family:var(--font-d);font-size:1.1rem;font-weight:500;letter-spacing:.3em;color:var(--white);text-decoration:none}
.m-logo .ac{color:var(--gold);font-weight:700}
.m-avatar-wrap{position:relative;flex-shrink:0}
.m-avatar{width:34px;height:34px;border-radius:50%;background:var(--gold);display:flex;align-items:center;justify-content:center;font-size:.8rem;font-weight:600;color:var(--charcoal);cursor:pointer;border:none;flex-shrink:0;transition:opacity .2s}
.m-avatar:hover{opacity:.85}
.avatar-menu-mobile{bottom:auto;top:calc(100% + 8px);left:auto;right:0;width:240px;max-height:80vh;overflow-y:auto}

/* ═══ BOTTOM NAV ═══ */
.bottom-nav{display:none;position:fixed;bottom:0;left:0;right:0;background:var(--charcoal);border-top:1px solid rgba(200,169,110,.1);z-index:50;height:62px;align-items:stretch}
.bn-item{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.2rem;background:none;border:none;color:rgba(255,255,255,.35);cursor:pointer;padding:.3rem 0;font-family:var(--font-b);transition:color .2s;-webkit-tap-highlight-color:transparent}
.bn-item.active{color:var(--gold)}
.bn-item.active svg{opacity:1}
.bn-item svg{opacity:.7;transition:opacity .2s}
.bn-label{font-size:.42rem;letter-spacing:.1em;text-transform:uppercase;font-weight:400;line-height:1}

/* ═══ RESPONSIVE ═══ */
@media(max-width:900px){
  .side{width:60px;padding:1rem 0}
  .side-logo{font-size:0;padding:0;text-align:center;margin-bottom:1rem}
  .side-logo .ac{font-size:1.1rem}
  .side-section-label{display:none}
  .side-nav{margin-bottom:auto}
  .side-item{padding:.7rem 0;justify-content:center;font-size:0;border-left:none !important}
  .side-item-icon{width:auto}
  .side-soon-badge{display:none}
  .side-plan,.side-profile-info{display:none}
  .side-profile{justify-content:center;padding:.8rem 0}
}
@media(max-width:600px){
  .side{display:none !important}
  .m-header{display:flex}
  .bottom-nav{display:flex}
  .layout-main{padding-bottom:62px}
}
`;

export default function DashboardLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, session } = useAuth();
  const { profile, profileLoading, updateProfile } = useUser();
  const { members: familyMembers, activeMemberId, setActiveProfile } = useFamily();
  const plan = usePlan();
  const [showLogout, setShowLogout] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Click-outside + Esc cierran el dropdown del avatar
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e) => {
      const inDesktop = menuRef.current && menuRef.current.contains(e.target);
      const inMobile = mobileMenuRef.current && mobileMenuRef.current.contains(e.target);
      if (!inDesktop && !inMobile) setMenuOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setMenuOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const USER = useMemo(() => {
    const nombre = profile?.nombre || "Invitado";
    let dias = 1;
    const createdAt = session?.user?.created_at;
    if (createdAt) {
      const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
      dias = Math.max(1, diff + 1);
    }
    return { nombre, planLabel: plan.label, diasActivo: dias };
  }, [profile, session, plan.label]);

  // Determine active nav from current path
  const activeNav = useMemo(() => {
    const p = location.pathname;
    if (p.includes("/agent")) return "agent";
    if (p.includes("/pantry")) return "pantry";
    if (p.includes("/plan")) return "plan";
    if (p.includes("/progress")) return "progress";
    return "dash";
  }, [location.pathname]);

  async function handleLogout() {
    // Only clear the agent chat history (ephemeral). Meals, exercises, pantry,
    // and water stay in per-user localStorage so the dashboard is restored
    // intact when the user logs back in. The MealsProvider / ExerciseProvider
    // effects auto-reload based on the new userId.
    clearAgentHistoryStorage();
    await signOut();
    navigate("/");
  }

  // Loading state
  if (profileLoading) {
    return (
      <div style={{ fontFamily: "'Jost', system-ui, sans-serif", background: "#FAF8F5", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B6B80", fontSize: ".85rem", fontWeight: 300 }}>
        Cargando tu perfil...
      </div>
    );
  }

  return (
    <>
      <style>{layoutCss}</style>
      <div className="layout">
        {/* ═══ Sidebar ═══ */}
        <aside className="side">
          <Link to="/" className="side-logo">KY<span className="ac">Ō</span>RA</Link>
          <div className="side-section-label">Menú</div>
          <nav className="side-nav">
            {NAV_ITEMS.map(n => (
              <button
                key={n.id}
                className={`side-item${activeNav === n.id ? " active" : ""}`}
                onClick={() => { if (n.path) navigate(n.path); }}
                style={n.soon ? { opacity: .65 } : {}}
              >
                <span className="side-item-icon">{ICONS[n.id]}</span>
                {n.label}
                {n.soon && <span className="side-soon-badge">Pronto</span>}
              </button>
            ))}
          </nav>
          <div className="side-profile-wrap" ref={menuRef}>
            {menuOpen && (
              <div className="avatar-menu" role="menu">
                <div className="avatar-menu-head">
                  <div className="avatar-menu-head-name">{USER.nombre}</div>
                  <div className="avatar-menu-head-plan">Plan {USER.planLabel} · Día {USER.diasActivo}</div>
                </div>
                <button
                  className="avatar-menu-item"
                  role="menuitem"
                  onClick={() => { setMenuOpen(false); navigate("/app/cuenta"); }}
                >
                  <span className="avatar-menu-item-icon">{ICONS.user}</span>
                  Mi cuenta
                </button>
                <button
                  className="avatar-menu-item"
                  role="menuitem"
                  onClick={() => { setMenuOpen(false); navigate("/#pricing"); }}
                >
                  <span className="avatar-menu-item-icon">{ICONS.card}</span>
                  Plan y facturación
                </button>
                {/* Family profile switcher — solo para Premium+ con miembros */}
                {plan.isPremiumOrAbove && (familyMembers.length > 0 || plan.isPremiumOrAbove) && (
                  <>
                    <div className="family-switch-sep" />
                    <div className="family-switch-label">Cambiar perfil</div>
                    {/* Perfil principal */}
                    <button
                      className={`family-switch-item${!activeMemberId ? " active-profile" : ""}`}
                      onClick={() => { setActiveProfile(null); setMenuOpen(false); }}
                    >
                      <span className="family-switch-avatar main">
                        {(profile?.nombre?.[0] || "?").toUpperCase()}
                      </span>
                      {profile?.nombre || "Mi perfil"}
                      {!activeMemberId && (
                        <span className="family-switch-check">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </span>
                      )}
                    </button>
                    {/* Miembros de familia */}
                    {familyMembers.map((m) => (
                      <button
                        key={m.id}
                        className={`family-switch-item${activeMemberId === m.id ? " active-profile" : ""}`}
                        onClick={() => { setActiveProfile(m.id); setMenuOpen(false); }}
                      >
                        <span className="family-switch-avatar member">
                          {(m.nombre?.[0] || "?").toUpperCase()}
                        </span>
                        {m.nombre || "Familiar"}
                        {activeMemberId === m.id && (
                          <span className="family-switch-check">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          </span>
                        )}
                      </button>
                    ))}
                    {/* Agregar miembro */}
                    {familyMembers.length < 2 && (
                      <button
                        className="family-add-btn"
                        onClick={() => { setMenuOpen(false); navigate("/app/cuenta"); }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Agregar perfil familiar
                      </button>
                    )}
                  </>
                )}

                <div className="avatar-menu-sep" />
                <button
                  className="avatar-menu-item danger"
                  role="menuitem"
                  onClick={() => { setMenuOpen(false); setShowLogout(true); }}
                >
                  <span className="avatar-menu-item-icon">{ICONS.logout}</span>
                  Cerrar sesión
                </button>

                {/* Dev-only tier switcher — desaparece del bundle en producción */}
                {IS_DEV && profile && (
                  <div className="dev-switcher" role="group" aria-label="Dev tier switcher">
                    <div className="dev-switcher-label">
                      <span className="dev-switcher-badge">DEV</span>
                      Cambiar tier (solo local)
                    </div>
                    <div className="dev-switcher-grid">
                      {PLANS.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className={`dev-chip${profile.plan === p.id ? " active" : ""}`}
                          onClick={() => updateProfile({ plan: p.id })}
                          title={`Aplicar plan ${p.label}`}
                        >
                          {p.id}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <button
              className="side-profile"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              title="Opciones de cuenta"
            >
              <div className="side-avatar">{(USER.nombre?.[0] || "?").toUpperCase()}</div>
              <div className="side-profile-info">
                <div className="side-profile-name">{USER.nombre}</div>
                <div className="side-profile-plan">Plan {USER.planLabel}</div>
              </div>
              <span className="side-profile-chev">
                <Icon size={14} d={<polyline points="6 9 12 15 18 9" />} />
              </span>
            </button>
          </div>
        </aside>

        {/* ═══ Main Content (children) ═══ */}
        <div className="layout-main">
          {/* Mobile top header — visible only on ≤600px */}
          <header className="m-header">
            <Link to="/" className="m-logo">KY<span className="ac">Ō</span>RA</Link>
            <div className="m-avatar-wrap" ref={mobileMenuRef}>
              {menuOpen && (
                <div className="avatar-menu avatar-menu-mobile" role="menu">
                  <div className="avatar-menu-head">
                    <div className="avatar-menu-head-name">{USER.nombre}</div>
                    <div className="avatar-menu-head-plan">Plan {USER.planLabel} · Día {USER.diasActivo}</div>
                  </div>
                  <button className="avatar-menu-item" role="menuitem" onClick={() => { setMenuOpen(false); navigate("/app/cuenta"); }}>
                    <span className="avatar-menu-item-icon">{ICONS.user}</span>
                    Mi cuenta
                  </button>
                  <button className="avatar-menu-item" role="menuitem" onClick={() => { setMenuOpen(false); navigate("/#pricing"); }}>
                    <span className="avatar-menu-item-icon">{ICONS.card}</span>
                    Plan y facturación
                  </button>
                  <div className="avatar-menu-sep" />
                  <button className="avatar-menu-item danger" role="menuitem" onClick={() => { setMenuOpen(false); setShowLogout(true); }}>
                    <span className="avatar-menu-item-icon">{ICONS.logout}</span>
                    Cerrar sesión
                  </button>
                </div>
              )}
              <button
                className="m-avatar"
                onClick={() => setMenuOpen((o) => !o)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                title="Opciones de cuenta"
              >
                {(USER.nombre?.[0] || "?").toUpperCase()}
              </button>
            </div>
          </header>
          {children}
        </div>

        {/* ═══ Bottom Nav — visible only on ≤600px ═══ */}
        <nav className="bottom-nav" aria-label="Navegación principal">
          {NAV_ITEMS.map(n => (
            <button
              key={n.id}
              className={`bn-item${activeNav === n.id ? " active" : ""}`}
              onClick={() => navigate(n.path)}
              aria-label={n.label}
              aria-current={activeNav === n.id ? "page" : undefined}
            >
              {ICONS[n.id]}
              <span className="bn-label">{n.label}</span>
            </button>
          ))}
        </nav>

        {/* ═══ Logout Confirmation Modal ═══ */}
        {showLogout && (
          <div className="logout-overlay" onClick={() => setShowLogout(false)}>
            <div className="logout-box" onClick={(e) => e.stopPropagation()}>
              <div className="logout-icon">{ICONS.logout}</div>
              <div className="logout-title">¿Cerrar sesión?</div>
              <p className="logout-desc">Tu progreso está guardado. Podrás retomar donde lo dejaste cuando vuelvas.</p>
              <div className="logout-btns">
                <button className="logout-btn-cancel" onClick={() => setShowLogout(false)}>Cancelar</button>
                <button className="logout-btn-confirm" onClick={handleLogout}>Sí, cerrar sesión</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
