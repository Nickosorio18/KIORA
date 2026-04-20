import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, Link } from "react-router-dom";
import { useUser } from "@context/UserContext";
import Disclaimer from "@components/shared/Disclaimer";

/* ═══════════════════════════════════════════════════════
   KYŌRA — Sistema de Onboarding
   Captura de perfil en 5 pasos para alimentar al agente IA
   ═══════════════════════════════════════════════════════ */

const TOTAL_STEPS = 5;

/* ── SVG Icons (Lucide-style) ── */
const Ico = ({ d, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{typeof d === "string" ? <path d={d} /> : d}</svg>
);

const GOALS = [
  { id: "lose", label: "Perder grasa", desc: "Reducir porcentaje de grasa corporal", icon: <Ico d={<><polyline points="7 13 12 18 17 13"/><line x1="12" y1="6" x2="12" y2="18"/></>} /> },
  { id: "gain", label: "Ganar músculo", desc: "Aumentar masa muscular magra", icon: <Ico d={<><polyline points="17 11 12 6 7 11"/><line x1="12" y1="18" x2="12" y2="6"/></>} /> },
  { id: "both", label: "Recomposición", desc: "Perder grasa y ganar músculo", icon: <Ico d={<><polyline points="7 4 12 9 17 4"/><polyline points="17 20 12 15 7 20"/><line x1="12" y1="9" x2="12" y2="15"/></>} /> },
  { id: "health", label: "Comer mejor", desc: "Mejorar hábitos sin meta de peso", icon: <Ico d={<><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></>} /> },
  { id: "energy", label: "Más energía", desc: "Optimizar rendimiento y vitalidad", icon: <Ico d={<><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>} /> },
  { id: "maintain", label: "Mantenerme", desc: "Conservar mi estado actual", icon: <Ico d={<><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></>} /> },
];

const RESTRICTIONS = [
  "Sin gluten", "Sin lactosa", "Vegetariano", "Vegano",
  "Sin mariscos", "Sin frutos secos", "Bajo en sodio", "Keto",
  "Sin cerdo", "Sin azúcar añadida", "Halal", "Kosher",
];

const ACTIVITY_LEVELS = [
  { id: "sedentary", label: "Sedentario", desc: "Trabajo de escritorio, poco movimiento", icon: <Ico d={<><path d="M5 11a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z"/><path d="M12 11V5"/><path d="M9 5h6"/></>} /> },
  { id: "light", label: "Ligero", desc: "1–2 días de ejercicio por semana", icon: <Ico d={<><circle cx="12" cy="5" r="1.5"/><path d="M13.5 20V14l2-2"/><path d="M10.5 20V14l-2-2"/><path d="M10 10l2 2 2-2"/></>} /> },
  { id: "moderate", label: "Moderado", desc: "3–4 días en gimnasio o deporte", icon: <Ico d={<><circle cx="12" cy="4" r="1.5"/><path d="M7 21l3-6"/><path d="M17 21l-3-6"/><path d="M12 15l-3-5 1-3"/><path d="M15 7l-3 8"/></>} /> },
  { id: "high", label: "Activo", desc: "5–6 días, entrenamiento intenso", icon: <Ico d={<><path d="M14.4 14.4L9.6 9.6"/><path d="M18.657 5.343a8 8 0 1 1-13.314 0"/><path d="M9.6 9.6L4 8"/><path d="M14.4 14.4L20 16"/></>} /> },
  { id: "athlete", label: "Atleta", desc: "Doble sesión, competencia activa", icon: <Ico d={<><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 9 6.5 9 9"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 15 6.5 15 9"/><path d="M8 9h8"/><path d="M12 9v8"/><path d="M8 17h8"/><path d="M7 21l1-4"/><path d="M17 21l-1-4"/></>} /> },
];

const CUISINES = [
  "Mexicana", "Mediterránea", "Japonesa", "Italiana",
  "Peruana", "Coreana", "Americana", "India",
  "Colombiana", "Árabe", "Tailandesa", "Argentina",
];

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Jost:ital,wght@0,200;0,300;0,400;0,500;0,600;1,300&display=swap');

:root {
  --gold: #C8A96E;
  --gold-light: #E8D5A3;
  --gold-glow: rgba(200,169,110,.12);
  --charcoal: #1A1A1E;
  --charcoal-soft: #2A2A30;
  --cream: #FAF8F5;
  --cream-dark: #F2EDE5;
  --green: #7A9E7E;
  --green-light: #EDF3EE;
  --text-dark: #1A1A2E;
  --text-muted: #6B6B80;
  --text-light: #9A9189;
  --border: rgba(200,169,110,.15);
  --font-display: 'Playfair Display', Georgia, serif;
  --font-body: 'Jost', system-ui, sans-serif;
}
* { margin:0; padding:0; box-sizing:border-box; }

.onb {
  font-family: var(--font-body);
  background: var(--cream);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  color: var(--text-dark);
  overflow: hidden;
  position: relative;
}
.onb::before {
  content: '';
  position: fixed;
  top: -160px; right: -160px;
  width: 500px; height: 500px;
  background: radial-gradient(circle, rgba(200,169,110,.07) 0%, transparent 65%);
  pointer-events: none;
  z-index: 0;
}
.onb::after {
  content: '';
  position: fixed;
  bottom: -100px; left: -80px;
  width: 320px; height: 320px;
  background: radial-gradient(circle, rgba(200,169,110,.04) 0%, transparent 65%);
  pointer-events: none;
  z-index: 0;
}
.onb-head, .onb-progress, .onb-content, .onb-footer { position: relative; z-index: 1; }

/* ── Header ── */
.onb-head {
  padding: 1.2rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}
.onb-logo {
  font-family: var(--font-display);
  font-size: 1.3rem;
  font-weight: 500;
  letter-spacing: .3em;
  color: var(--charcoal);
  text-decoration: none;
}
.onb-logo .ac { color: var(--gold); font-weight: 700; }
.onb-skip {
  font-size: .7rem;
  font-weight: 400;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--text-light);
  background: none;
  border: none;
  cursor: pointer;
  transition: color .3s;
  font-family: var(--font-body);
}
.onb-skip:hover { color: var(--gold); }

/* ── Progress ── */
.onb-progress {
  padding: .6rem 2rem 0;
  flex-shrink: 0;
}

/* Step dots */
.onb-dots {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  margin-bottom: .7rem;
}
.onb-dot-wrap { display: flex; align-items: center; }
.onb-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: rgba(200,169,110,.18);
  border: 1.5px solid rgba(200,169,110,.25);
  transition: all .4s cubic-bezier(.22,1,.36,1);
  flex-shrink: 0;
}
.onb-dot.done {
  background: var(--gold);
  border-color: var(--gold);
}
.onb-dot.active {
  background: var(--gold);
  border-color: var(--gold);
  width: 10px; height: 10px;
  box-shadow: 0 0 0 3px rgba(200,169,110,.18);
}
.onb-dot-line {
  width: 36px; height: 1.5px;
  background: rgba(200,169,110,.15);
  transition: background .4s;
}
.onb-dot-line.done { background: var(--gold); }

.onb-step-label {
  display: flex;
  justify-content: space-between;
  font-size: .6rem;
  font-weight: 400;
  letter-spacing: .15em;
  text-transform: uppercase;
  color: var(--text-light);
}

/* ── Content Area ── */
.onb-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  overflow-y: auto;
}

.onb-step {
  width: 100%;
  max-width: 560px;
  animation: stepIn .5s cubic-bezier(.22,1,.36,1) both;
}
@keyframes stepIn {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

.onb-step-head {
  margin-bottom: 2rem;
}
.onb-step-num {
  font-size: .6rem;
  font-weight: 400;
  letter-spacing: .2em;
  text-transform: uppercase;
  color: var(--gold);
  margin-bottom: .6rem;
  display: flex;
  align-items: center;
  gap: .6rem;
}
.onb-step-num::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(200,169,110,.15);
}
.onb-step h2 {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 400;
  color: var(--charcoal);
  line-height: 1.2;
  margin-bottom: .5rem;
}
.onb-step h2 em {
  font-style: italic;
  color: var(--gold);
}
.onb-step-desc {
  font-size: .88rem;
  font-weight: 300;
  color: var(--text-muted);
  line-height: 1.6;
}

/* ── Form Inputs ── */
.onb-field {
  margin-bottom: 1.4rem;
}
.onb-label {
  display: block;
  font-size: .62rem;
  font-weight: 500;
  letter-spacing: .15em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: .5rem;
}
.onb-input {
  width: 100%;
  padding: .9rem 1.1rem;
  border: 1.5px solid var(--border);
  border-radius: 3px;
  background: white;
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 300;
  color: var(--text-dark);
  outline: none;
  transition: border-color .3s, box-shadow .3s;
}
.onb-input:focus {
  border-color: var(--gold);
  box-shadow: 0 0 0 3px var(--gold-glow);
}
.onb-input::placeholder { color: var(--text-light); font-weight: 300; }

.onb-field-hint {
  font-size: .8rem;
  color: var(--text-light);
  margin: -.25rem 0 .6rem;
  line-height: 1.4;
}
.onb-sex-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: .75rem;
}
.onb-sex-btn {
  padding: .85rem 1rem;
  border: 1.5px solid var(--border);
  border-radius: 3px;
  background: white;
  font-family: var(--font-body);
  font-size: .95rem;
  font-weight: 400;
  color: var(--text-dark);
  cursor: pointer;
  transition: border-color .25s, box-shadow .25s, background .25s;
}
.onb-sex-btn:hover {
  border-color: rgba(200,169,110,.4);
}
.onb-sex-btn.selected {
  border-color: var(--gold);
  background: var(--gold-glow);
  font-weight: 500;
  box-shadow: 0 0 0 3px rgba(200,169,110,.1);
}

.onb-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.onb-row-3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
}

.onb-suffix {
  position: relative;
}
.onb-suffix .onb-input {
  padding-right: 3rem;
}
.onb-suffix-text {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: .78rem;
  color: var(--text-light);
  font-weight: 300;
  pointer-events: none;
}

/* ── Selection Cards (Goals & Activity) ── */
.onb-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: .7rem;
}
.onb-card {
  padding: 1.2rem 1rem;
  background: white;
  border: 1.5px solid var(--border);
  border-radius: 3px;
  cursor: pointer;
  transition: all .3s;
  text-align: center;
  position: relative;
  overflow: hidden;
}
.onb-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: var(--gold);
  transform: scaleX(0);
  transition: transform .3s;
}
.onb-card:hover {
  border-color: rgba(200,169,110,.35);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(26,26,46,.05);
}
.onb-card.selected {
  border-color: var(--gold);
  background: linear-gradient(160deg, rgba(200,169,110,.09) 0%, rgba(200,169,110,.03) 100%);
  box-shadow: 0 0 0 1px rgba(200,169,110,.15);
}
.onb-card.selected::before { transform: scaleX(1); }

/* Icon container */
.onb-card-icon {
  width: 40px; height: 40px;
  border-radius: 10px;
  background: rgba(200,169,110,.08);
  border: 1px solid rgba(200,169,110,.15);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto .7rem;
  color: var(--gold);
  transition: background .25s, border-color .25s;
}
.onb-card:hover .onb-card-icon {
  background: rgba(200,169,110,.12);
  border-color: rgba(200,169,110,.25);
}
.onb-card.selected .onb-card-icon {
  background: var(--charcoal);
  border-color: var(--charcoal);
  color: var(--gold-light);
}
.onb-card-label {
  font-family: var(--font-display);
  font-size: .92rem;
  font-weight: 600;
  color: var(--charcoal);
  margin-bottom: .2rem;
}
.onb-card-desc {
  font-size: .68rem;
  color: var(--text-light);
  font-weight: 300;
  line-height: 1.4;
}

/* Activity cards — horizontal */
.onb-cards-h {
  display: flex;
  flex-direction: column;
  gap: .5rem;
}
.onb-card-h {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.2rem;
  background: white;
  border: 1.5px solid var(--border);
  border-radius: 3px;
  cursor: pointer;
  transition: all .3s;
  position: relative;
  overflow: hidden;
}
.onb-card-h::before {
  content: '';
  position: absolute;
  top: 0; left: 0; bottom: 0;
  width: 2px;
  background: var(--gold);
  transform: scaleY(0);
  transition: transform .3s;
}
.onb-card-h:hover {
  border-color: rgba(200,169,110,.35);
  transform: translateX(3px);
  box-shadow: 0 4px 16px rgba(26,26,46,.04);
}
.onb-card-h.selected {
  border-color: var(--gold);
  background: linear-gradient(90deg, rgba(200,169,110,.08) 0%, transparent 80%);
  box-shadow: 0 0 0 1px rgba(200,169,110,.1);
}
.onb-card-h.selected::before { transform: scaleY(1); }

.onb-card-h-icon {
  width: 36px; height: 36px;
  border-radius: 8px;
  background: rgba(200,169,110,.08);
  border: 1px solid rgba(200,169,110,.12);
  display: flex; align-items: center; justify-content: center;
  color: var(--gold);
  flex-shrink: 0;
  transition: background .25s, border-color .25s;
}
.onb-card-h.selected .onb-card-h-icon {
  background: var(--charcoal);
  border-color: var(--charcoal);
  color: var(--gold-light);
}
.onb-card-h-text { flex: 1; }
.onb-card-h-label {
  font-family: var(--font-display);
  font-size: .9rem;
  font-weight: 600;
  color: var(--charcoal);
}
.onb-card-h-desc {
  font-size: .7rem;
  color: var(--text-light);
  font-weight: 300;
}

/* ── Chips (Restrictions & Cuisines) ── */
.onb-chips {
  display: flex;
  flex-wrap: wrap;
  gap: .5rem;
}
.onb-chip {
  padding: .5rem 1rem;
  background: white;
  border: 1.5px solid var(--border);
  border-radius: 100px;
  font-family: var(--font-body);
  font-size: .8rem;
  font-weight: 300;
  color: var(--text-dark);
  cursor: pointer;
  transition: all .25s;
}
.onb-chip:hover {
  border-color: rgba(200,169,110,.35);
}
.onb-chip.selected {
  background: var(--charcoal);
  border-color: var(--charcoal);
  color: var(--gold-light);
}

.onb-chip-section {
  margin-bottom: 1.8rem;
}
.onb-chip-title {
  font-size: .65rem;
  font-weight: 500;
  letter-spacing: .15em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: .6rem;
}

.onb-optional {
  font-size: .7rem;
  color: var(--text-light);
  font-weight: 300;
  font-style: italic;
  margin-top: .3rem;
}

/* ── Footer / Nav ── */
.onb-footer {
  padding: 1.2rem 2rem 1.8rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}
.onb-back {
  padding: .7rem 1.6rem;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 2px;
  font-family: var(--font-body);
  font-size: .72rem;
  font-weight: 400;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--text-muted);
  cursor: pointer;
  transition: all .3s;
}
.onb-back:hover { border-color: var(--gold); color: var(--text-dark); }
.onb-back:disabled { opacity: 0; pointer-events: none; }

.onb-next {
  padding: .7rem 2rem;
  background: var(--charcoal);
  border: none;
  border-radius: 2px;
  font-family: var(--font-body);
  font-size: .72rem;
  font-weight: 500;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--gold-light);
  cursor: pointer;
  transition: all .3s;
}
.onb-next:hover { background: var(--charcoal-soft); transform: translateY(-1px); box-shadow: 0 4px 16px rgba(26,26,46,.1); }
.onb-next:disabled { opacity: .3; cursor: not-allowed; transform: none; box-shadow: none; }

/* ── Completion ── */
@keyframes completePulse {
  0%   { box-shadow: 0 0 0 0 rgba(200,169,110,.35), 0 8px 30px rgba(26,26,46,.15); }
  70%  { box-shadow: 0 0 0 18px rgba(200,169,110,0), 0 8px 30px rgba(26,26,46,.15); }
  100% { box-shadow: 0 0 0 0 rgba(200,169,110,0), 0 8px 30px rgba(26,26,46,.15); }
}
@keyframes checkDraw {
  from { stroke-dashoffset: 30; opacity: 0; }
  to   { stroke-dashoffset: 0; opacity: 1; }
}

.onb-complete {
  text-align: center;
  animation: stepIn .6s cubic-bezier(.22,1,.36,1) both;
}
.onb-complete-icon {
  width: 76px; height: 76px;
  border-radius: 50%;
  background: var(--charcoal);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 1.6rem;
  position: relative;
  animation: completePulse 1.2s ease-out .4s both;
}
.onb-complete-icon::after {
  content: '';
  position: absolute; inset: -1px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(200,169,110,.3) 0%, transparent 55%);
}
.onb-complete-icon svg {
  position: relative; z-index: 1;
  color: var(--gold-light);
  stroke-dasharray: 30;
  animation: checkDraw .5s cubic-bezier(.22,1,.36,1) .3s both;
}
.onb-complete h2 {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 400;
  color: var(--charcoal);
  margin-bottom: .5rem;
}
.onb-complete h2 em { font-style: italic; color: var(--gold); }
.onb-complete p {
  font-size: .88rem;
  font-weight: 300;
  color: var(--text-muted);
  line-height: 1.65;
  max-width: 380px;
  margin: 0 auto 2rem;
}
.onb-complete-btn {
  display: inline-flex; align-items: center; gap: .5rem;
  padding: .9rem 2.5rem;
  background: var(--charcoal);
  border: none; border-radius: 2px;
  font-family: var(--font-body);
  font-size: .72rem; font-weight: 500;
  letter-spacing: .15em; text-transform: uppercase;
  color: var(--gold-light);
  cursor: pointer; transition: all .3s;
  position: relative; overflow: hidden;
}
.onb-complete-btn::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(200,169,110,.1) 0%, transparent 60%);
  opacity: 0; transition: opacity .25s;
}
.onb-complete-btn:hover { background: #000; transform: translateY(-1px); box-shadow: 0 8px 28px rgba(26,26,46,.15); }
.onb-complete-btn:hover::after { opacity: 1; }

.onb-profile-summary {
  background: white;
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 1.3rem 1.5rem;
  max-width: 400px;
  margin: 0 auto 2rem;
  text-align: left;
  box-shadow: 0 4px 20px rgba(26,26,46,.04);
}
.onb-ps-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: .8rem;
  padding: .45rem 0;
  border-bottom: 1px solid rgba(200,169,110,.07);
  font-size: .8rem;
}
.onb-ps-row:last-child { border-bottom: none; }
.onb-ps-key { color: var(--text-light); font-weight: 300; white-space: nowrap; }
.onb-ps-val { color: var(--charcoal); font-weight: 500; text-align: right; }

@media (max-width: 600px) {
  .onb-cards { grid-template-columns: 1fr 1fr; }
  .onb-row, .onb-row-3 { grid-template-columns: 1fr; }
  .onb-step h2 { font-size: 1.6rem; }
}
`;

const STEP_LABELS = ["Datos", "Objetivo", "Restricciones", "Actividad", "Preferencias"];

export default function KyoraOnboarding() {
  const navigate = useNavigate();
  const { profile: savedProfile, setProfile: saveProfileToContext } = useUser();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [profile, setProfile] = useState(() => savedProfile || {
    nombre: "",
    edad: "",
    sexo: "",
    peso: "",
    altura: "",
    objetivo: "",
    restricciones: [],
    actividad: "",
    cocinas: [],
  });

  // Key forces re-render for animation
  const [animKey, setAnimKey] = useState(0);
  function goTo(s) { setAnimKey(k => k + 1); setStep(s); }

  function upd(k, v) { setProfile(p => ({ ...p, [k]: v })); }
  function toggleList(k, val) {
    setProfile(p => ({
      ...p,
      [k]: p[k].includes(val) ? p[k].filter(x => x !== val) : [...p[k], val]
    }));
  }

  const canNext = () => {
    switch(step) {
      case 0: return profile.nombre.trim() && profile.sexo && profile.edad && profile.peso && profile.altura;
      case 1: return !!profile.objetivo;
      case 2: return true; // restrictions are optional
      case 3: return !!profile.actividad;
      case 4: return true; // cuisines optional
      default: return false;
    }
  };

  function handleNext() {
    if (step < TOTAL_STEPS - 1) goTo(step + 1);
    else {
      saveProfileToContext(profile);
      setDone(true);
    }
  }

  function handleBack() {
    if (step > 0) goTo(step - 1);
  }


  if (done) {
    const goalLabel = GOALS.find(g => g.id === profile.objetivo)?.label || profile.objetivo;
    const actLabel = ACTIVITY_LEVELS.find(a => a.id === profile.actividad)?.label || profile.actividad;
    return (
      <>
        <style>{styles}</style>
        <div className="onb">
          <div className="onb-head">
            <Link to="/" className="onb-logo">KY<span className="ac">Ō</span>RA</Link>
          </div>
          <div className="onb-progress"><div className="onb-bar"><div className="onb-bar-fill" style={{width:'100%'}} /></div></div>
          <div className="onb-content">
            <div className="onb-complete">
              <div className="onb-complete-icon">
                <Ico size={30} d={<><polyline points="20 6 9 17 4 12"/></>} />
              </div>
              <h2>Listo, <em>{profile.nombre.split(" ")[0]}</em></h2>
              <p>Tu perfil está completo. KYŌRA ahora puede crear planes 100% personalizados para ti.</p>
              <div className="onb-profile-summary">
                <div className="onb-ps-row"><span className="onb-ps-key">Sexo</span><span className="onb-ps-val">{profile.sexo === "hombre" ? "Hombre" : "Mujer"}</span></div>
                <div className="onb-ps-row"><span className="onb-ps-key">Edad</span><span className="onb-ps-val">{profile.edad} años</span></div>
                <div className="onb-ps-row"><span className="onb-ps-key">Peso</span><span className="onb-ps-val">{profile.peso} kg</span></div>
                <div className="onb-ps-row"><span className="onb-ps-key">Altura</span><span className="onb-ps-val">{profile.altura} cm</span></div>
                <div className="onb-ps-row"><span className="onb-ps-key">Objetivo</span><span className="onb-ps-val">{goalLabel}</span></div>
                <div className="onb-ps-row"><span className="onb-ps-key">Actividad</span><span className="onb-ps-val">{actLabel}</span></div>
                {profile.restricciones.length > 0 && (
                  <div className="onb-ps-row"><span className="onb-ps-key">Restricciones</span><span className="onb-ps-val">{profile.restricciones.join(", ")}</span></div>
                )}
                {profile.cocinas.length > 0 && (
                  <div className="onb-ps-row"><span className="onb-ps-key">Cocinas favoritas</span><span className="onb-ps-val">{profile.cocinas.join(", ")}</span></div>
                )}
              </div>

              {/* Medical disclaimer — primera vez que el usuario lo ve explícitamente */}
              <div style={{ maxWidth: "460px", margin: "0 auto 1.5rem" }}>
                <Disclaimer variant="banner" />
              </div>

              <button className="onb-complete-btn" onClick={() => { saveProfileToContext(profile); navigate('/app/dashboard'); }}>
                Ir a mi Dashboard
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Configura tu perfil — KYŌRA</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <style>{styles}</style>
      <div className="onb">
        {/* Header */}
        <div className="onb-head">
          <Link to="/" className="onb-logo">KY<span className="ac">Ō</span>RA</Link>
          <button className="onb-skip" onClick={() => { saveProfileToContext({ ...profile, nombre: profile.nombre || 'Invitado' }); setDone(true); }}>Omitir</button>
        </div>

        {/* Progress */}
        <div className="onb-progress">
          <div className="onb-dots">
            {STEP_LABELS.map((_, i) => (
              <div className="onb-dot-wrap" key={i}>
                <div className={`onb-dot${i < step ? " done" : i === step ? " active" : ""}`} />
                {i < STEP_LABELS.length - 1 && (
                  <div className={`onb-dot-line${i < step ? " done" : ""}`} />
                )}
              </div>
            ))}
          </div>
          <div className="onb-step-label">
            <span>Paso {step + 1} de {TOTAL_STEPS}</span>
            <span>{STEP_LABELS[step]}</span>
          </div>
        </div>

        {/* Content */}
        <div className="onb-content">
          {/* ── Step 1: Basic Data ── */}
          {step === 0 && (
            <div className="onb-step" key={animKey}>
              <div className="onb-step-head">
                <div className="onb-step-num">Paso 01</div>
                <h2>Cuéntanos <em>de ti</em></h2>
                <p className="onb-step-desc">Necesitamos algunos datos básicos para personalizar tu experiencia.</p>
              </div>
              <div className="onb-field">
                <label className="onb-label">Tu nombre</label>
                <input className="onb-input" type="text" placeholder="¿Cómo te llamas?" value={profile.nombre} onChange={e => upd("nombre", e.target.value)} autoFocus />
              </div>
              <div className="onb-field">
                <label className="onb-label">Sexo biológico</label>
                <p className="onb-field-hint">Para calcular tus metas calóricas con precisión.</p>
                <div className="onb-sex-row">
                  {[{ id: "hombre", label: "Hombre" }, { id: "mujer", label: "Mujer" }].map(s => (
                    <button key={s.id} type="button" className={`onb-sex-btn${profile.sexo === s.id ? " selected" : ""}`} onClick={() => upd("sexo", s.id)}>{s.label}</button>
                  ))}
                </div>
              </div>
              <div className="onb-row-3">
                <div className="onb-field">
                  <label className="onb-label">Edad</label>
                  <div className="onb-suffix">
                    <input className="onb-input" type="number" placeholder="30" value={profile.edad} onChange={e => upd("edad", e.target.value)} />
                    <span className="onb-suffix-text">años</span>
                  </div>
                </div>
                <div className="onb-field">
                  <label className="onb-label">Peso</label>
                  <div className="onb-suffix">
                    <input className="onb-input" type="number" placeholder="75" value={profile.peso} onChange={e => upd("peso", e.target.value)} />
                    <span className="onb-suffix-text">kg</span>
                  </div>
                </div>
                <div className="onb-field">
                  <label className="onb-label">Altura</label>
                  <div className="onb-suffix">
                    <input className="onb-input" type="number" placeholder="172" value={profile.altura} onChange={e => upd("altura", e.target.value)} />
                    <span className="onb-suffix-text">cm</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Goal ── */}
          {step === 1 && (
            <div className="onb-step" key={animKey}>
              <div className="onb-step-head">
                <div className="onb-step-num">Paso 02</div>
                <h2>¿Cuál es tu <em>objetivo?</em></h2>
                <p className="onb-step-desc">Selecciona lo que mejor describe lo que quieres lograr.</p>
              </div>
              <div className="onb-cards">
                {GOALS.map(g => (
                  <div key={g.id} className={`onb-card${profile.objetivo === g.id ? " selected" : ""}`} onClick={() => upd("objetivo", g.id)}>
                    <div className="onb-card-icon">{g.icon}</div>
                    <div className="onb-card-label">{g.label}</div>
                    <div className="onb-card-desc">{g.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 3: Restrictions ── */}
          {step === 2 && (
            <div className="onb-step" key={animKey}>
              <div className="onb-step-head">
                <div className="onb-step-num">Paso 03</div>
                <h2>¿Alguna <em>restricción?</em></h2>
                <p className="onb-step-desc">Selecciona las que apliquen. Esto nos ayuda a evitar ingredientes que no puedes o no quieres consumir.</p>
              </div>
              <div className="onb-chips">
                {RESTRICTIONS.map(r => (
                  <button key={r} className={`onb-chip${profile.restricciones.includes(r) ? " selected" : ""}`} onClick={() => toggleList("restricciones", r)}>
                    {r}
                  </button>
                ))}
              </div>
              <p className="onb-optional">Puedes omitir este paso si no tienes restricciones</p>
            </div>
          )}

          {/* ── Step 4: Activity Level ── */}
          {step === 3 && (
            <div className="onb-step" key={animKey}>
              <div className="onb-step-head">
                <div className="onb-step-num">Paso 04</div>
                <h2>Tu nivel de <em>actividad</em></h2>
                <p className="onb-step-desc">Esto nos permite calcular tus necesidades calóricas y de macronutrientes.</p>
              </div>
              <div className="onb-cards-h">
                {ACTIVITY_LEVELS.map(a => (
                  <div key={a.id} className={`onb-card-h${profile.actividad === a.id ? " selected" : ""}`} onClick={() => upd("actividad", a.id)}>
                    <div className="onb-card-h-icon">{a.icon}</div>
                    <div className="onb-card-h-text">
                      <div className="onb-card-h-label">{a.label}</div>
                      <div className="onb-card-h-desc">{a.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 5: Cuisine Preferences ── */}
          {step === 4 && (
            <div className="onb-step" key={animKey}>
              <div className="onb-step-head">
                <div className="onb-step-num">Paso 05</div>
                <h2>¿Qué cocinas <em>te encantan?</em></h2>
                <p className="onb-step-desc">Selecciona tus favoritas y KYŌRA creará recetas que realmente disfrutes.</p>
              </div>
              <div className="onb-chips">
                {CUISINES.map(c => (
                  <button key={c} className={`onb-chip${profile.cocinas.includes(c) ? " selected" : ""}`} onClick={() => toggleList("cocinas", c)}>
                    {c}
                  </button>
                ))}
              </div>
              <p className="onb-optional">Selecciona todas las que quieras o ninguna</p>
            </div>
          )}
        </div>

        {/* Footer Nav */}
        <div className="onb-footer">
          <button className="onb-back" onClick={handleBack} disabled={step === 0}>← Atrás</button>
          <button className="onb-next" onClick={handleNext} disabled={!canNext()}>
            {step === TOTAL_STEPS - 1 ? "Completar" : "Continuar →"}
          </button>
        </div>
      </div>
    </>
  );
}
