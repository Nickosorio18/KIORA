import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useActiveProfile } from "@hooks/useActiveProfile";
import { usePantry } from "@context/PantryContext";
import { useMeals } from "@context/MealsContext";
import { useExercise } from "@context/ExerciseContext";
import { useWeeklyPlan } from "@context/WeeklyPlanContext";
import { buildSystemPrompt } from "@api/agentPrompt";
import { streamMessage as streamAnthropicMessage } from "@api/anthropicClient";
import { useAgentHistory } from "@hooks/useAgentHistory";
import { useMidnightRefresh } from "@hooks/useMidnightRefresh";
import { extractMeals } from "@utils/parseMeals";
import { extractExercises } from "@utils/parseExercises";
import { generatePlanPDF } from "@utils/generatePlanPDF";
import { DISCLAIMER_TEXT } from "@components/shared/Disclaimer";
import PaywallModal from "@components/shared/PaywallModal";
import { usePlan } from "@hooks/usePlan";
import { useAgentUsage } from "@hooks/useAgentUsage";
import { FEATURES } from "@config/plans";

/* ── SVG Icons (Lucide-style) ── */
const Ico = ({ d, size = 16, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>{typeof d === "string" ? <path d={d} /> : d}</svg>
);
const ICO = {
  lock: <Ico size={26} d={<><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>} />,
  chat: <Ico d={<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>} />,
  pantryTab: <Ico d={<><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></>} />,
  user: <Ico d={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>} />,
  utensils: <Ico d={<><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></>} />,
  dumbbell: <Ico d={<><path d="M14.4 14.4L9.6 9.6"/><path d="M18.657 5.343a8 8 0 1 1-13.314 0"/><path d="M9.6 9.6L4 8"/><path d="M14.4 14.4L20 16"/></>} />,
  run: <Ico d={<><circle cx="12" cy="4" r="1.5"/><path d="M7 21l3-6"/><path d="M17 21l-3-6"/><path d="M12 15l-3-5 1-3"/><path d="M15 7l-3 8"/></>} />,
  stretch: <Ico d={<><circle cx="12" cy="4" r="1.5"/><path d="M7 21l5-8 5 8"/><path d="M5 11l7 1 7-1"/></>} />,
  bolt: <Ico d={<><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>} />,
  check: <Ico size={14} d={<><polyline points="20 6 9 17 4 12"/></>} />,
  avocado: <Ico d={<><path d="M12 2C8 2 4 6 4 12s4 10 8 10 8-4 8-10S16 2 12 2z"/><circle cx="12" cy="14" r="3"/></>} />,
  // Quick action icons
  clipboard: <Ico size={18} d={<><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 14h6"/><path d="M9 18h6"/><path d="M9 10h6"/></>} />,
  sunrise: <Ico size={18} d={<><path d="M12 2v4"/><path d="M4.93 10.93l2.83 2.83"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="M19.07 10.93l-2.83 2.83"/><path d="M12 18a6 6 0 0 0-6-6"/><path d="M12 18a6 6 0 0 1 6-6"/><line x1="2" y1="22" x2="22" y2="22"/></>} />,
  leaf: <Ico size={18} d={<><path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 20 2 20 2s-2.9 4.5-4.9 10.1A7 7 0 0 1 11 20z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></>} />,
  shoppingBag: <Ico size={18} d={<><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></>} />,
  // Plan-aware icons
  barChart: <Ico size={18} d={<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>} />,
  sliders: <Ico size={18} d={<><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></>} />,
  sparkle: <Ico size={18} d={<><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/><path d="M5 3l.75 2.25L8 6l-2.25.75L5 9l-.75-2.25L2 6l2.25-.75z"/><path d="M19 13l.75 2.25L22 16l-2.25.75L19 19l-.75-2.25L16 16l2.25-.75z"/></>} />,
  target: <Ico size={18} d={<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>} />,
};

/* ═══════════════════════════════════════════════════════
   KYŌRA — Agente de Nutrición Inteligente (v2)
   Motor: Claude API (Anthropic) — vía @api/anthropicClient
   System prompt: @api/agentPrompt
   Feature: Mi Despensa — ingredientes reales del usuario
   ═══════════════════════════════════════════════════════ */

// ── Default Data ─────────────────────────────────────
const GUEST_PROFILE = {
  nombre: "Invitado",
  edad: "No especificada",
  peso: "No especificado",
  altura: "No especificada",
  objetivo: "No especificado",
  restricciones: "Ninguna",
  actividad: "No especificada",
  preferencias: "Sin preferencias específicas",
};

// ── Welcome Builder ──────────────────────────────────
// Genera el primer mensaje del agente basado en el perfil y la despensa.
// Se muestra como si fuera una respuesta normal del asistente y pasa por
// el renderizador de markdown (soporta **bold** e *italic*).
const GOAL_LABELS = {
  lose: "perder grasa", gain: "ganar músculo", both: "recomposición corporal",
  health: "comer mejor", energy: "tener más energía", maintain: "mantener tu estado actual",
};

function buildWelcomeMessage(profile, totalIngredients) {
  const rawName = (profile?.nombre || "").trim();
  const firstName = rawName ? rawName.split(" ")[0] : "";
  const hasRealName = firstName && firstName !== "Invitado" && firstName !== "Usuario";

  const greeting = hasRealName ? `Hola ${firstName}` : "Hola";

  const rawObj = profile?.objetivo?.trim();
  const objetivo =
    rawObj && rawObj !== "No especificado"
      ? (GOAL_LABELS[rawObj] || rawObj)
      : null;

  const objectiveLine = objetivo
    ? `Recuerdo que tu objetivo es **${objetivo.toLowerCase()}** — lo tendré presente en todo lo que te sugiera.`
    : null;

  const pantryLine =
    totalIngredients > 0
      ? `Tengo presentes los **${totalIngredients} ingredientes** que registraste en tu despensa, así que puedo armarte recetas con lo que ya tienes en casa.`
      : null;

  let body;
  if (objectiveLine && pantryLine) {
    body = `${objectiveLine}\n\n${pantryLine}\n\n¿Por dónde empezamos? Puedo darte un **plan semanal**, una **receta para hoy** o ajustes a lo que ya estás comiendo.`;
  } else if (objectiveLine) {
    body = `${objectiveLine}\n\n¿Por dónde empezamos? Puedo darte un **plan semanal**, una **receta para hoy** o ideas de snacks saludables.`;
  } else if (pantryLine) {
    body = `Soy tu coach nutricional. ${pantryLine}\n\n¿Qué te gustaría cocinar hoy?`;
  } else {
    body = `Soy tu coach nutricional. Puedo ayudarte con **planes de alimentación personalizados**, recetas, dudas de nutrición y rutinas básicas de ejercicio.\n\n¿Qué te gustaría mejorar primero?`;
  }

  return `${greeting}, qué bueno verte. ${body}`;
}

// ── Markdown → Elegant HTML Renderer ─────────────────
function renderMarkdown(text) {
  if (!text) return "";
  let html = text;

  // Escape HTML
  html = html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Headings (convert # to bold styled — in case agent still uses them)
  html = html.replace(/^### (.+)$/gm, '<span class="r-h3">$1</span>');
  html = html.replace(/^## (.+)$/gm, '<span class="r-h2">$1</span>');
  html = html.replace(/^# (.+)$/gm, '<span class="r-h1">$1</span>');

  // Horizontal rules (--- or ***)
  html = html.replace(/^(-{3,}|\*{3,})$/gm, '<span class="r-hr"></span>');

  // Bold + Italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="r-bold">$1</strong>');
  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em class="r-italic">$1</em>');

  // Checkmarks and X marks — style them
  html = html.replace(/✓/g, '<span class="r-check">✓</span>');
  html = html.replace(/✗/g, '<span class="r-cross">✗</span>');

  // Numbered lists: lines starting with "1." "2." etc
  html = html.replace(/^(\d+)\.\s+(.+)$/gm, '<div class="r-oli"><span class="r-num">$1</span><span>$2</span></div>');

  // Bullet lists: lines starting with "- " or "• "
  html = html.replace(/^[-•]\s+(.+)$/gm, '<div class="r-li"><span class="r-bullet"></span><span>$1</span></div>');

  // Inline code
  html = html.replace(/`(.+?)`/g, '<code class="r-code">$1</code>');

  // Paragraphs: double newlines
  html = html.replace(/\n\n/g, '</p><p class="r-p">');

  // Single newlines inside content (not after block elements)
  html = html.replace(/\n/g, "<br>");

  // Wrap in paragraph
  html = '<p class="r-p">' + html + "</p>";

  // Clean up empty paragraphs
  html = html.replace(/<p class="r-p"><\/p>/g, "");
  html = html.replace(/<p class="r-p"><br>/g, '<p class="r-p">');

  return html;
}

// ── Styles ───────────────────────────────────────────
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Jost:ital,wght@0,200;0,300;0,400;0,500;0,600;1,300&display=swap');

:root {
  --gold: #C8A96E;
  --gold-light: #E8D5A3;
  --gold-glow: rgba(200,169,110,.15);
  --charcoal: #1A1A2E;
  --charcoal-mid: #2D2D44;
  --cream: #FAF8F5;
  --green-soft: #7A9E7E;
  --green-muted: rgba(122,158,126,.12);
  --red-soft: #C97070;
  --red-muted: rgba(201,112,112,.1);
  --text-primary: #1A1A2E;
  --text-secondary: #6B6B80;
  --text-light: #9999AA;
  --border: rgba(200,169,110,.2);
  --shadow-sm: 0 1px 3px rgba(26,26,46,.06);
  --shadow-md: 0 4px 20px rgba(26,26,46,.08);
  --shadow-lg: 0 12px 40px rgba(26,26,46,.12);
  --radius: 16px;
  --radius-sm: 10px;
  --radius-xs: 6px;
}
* { margin:0; padding:0; box-sizing:border-box; }

.k-app {
  font-family:'Jost',sans-serif;
  background:var(--cream);
  flex:1;height:100%;
  display:flex;
  flex-direction:column;
  color:var(--text-primary);
  overflow:hidden;
  position:relative;
}
.k-app::before {
  content:'';position:absolute;top:-120px;right:-120px;width:400px;height:400px;
  background:radial-gradient(circle,var(--gold-glow) 0%,transparent 70%);pointer-events:none;z-index:0;
}

/* Header */
.k-head {
  padding:14px 20px;display:flex;align-items:center;justify-content:space-between;
  border-bottom:1px solid var(--border);background:rgba(250,248,245,.92);
  backdrop-filter:blur(20px);z-index:10;flex-shrink:0;
}
.k-logo { font-family:'Playfair Display',serif;font-size:24px;font-weight:700;letter-spacing:4px;color:var(--charcoal); }
.k-logo .ac { color:var(--gold); }
.k-head-r { display:flex;align-items:center;gap:8px; }
.k-badge { font-size:9px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:var(--gold);background:var(--gold-glow);padding:3px 8px;border-radius:20px;border:1px solid rgba(200,169,110,.25); }
.k-btn-icon {
  width:34px;height:34px;border-radius:50%;border:1.5px solid var(--border);background:white;
  display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;font-size:15px;
}
.k-btn-icon:hover { border-color:var(--gold);background:var(--gold-glow);transform:scale(1.06); }
.k-btn-icon.active { border-color:var(--gold);background:var(--gold);color:white; }

/* Tabs (bottom nav for panels) */
.k-tabs {
  display:flex;gap:0;border-bottom:1px solid var(--border);background:white;flex-shrink:0;z-index:5;
}
.k-tab {
  flex:1;padding:10px 4px;text-align:center;font-size:11px;font-weight:600;
  letter-spacing:.5px;color:var(--text-light);cursor:pointer;transition:all .2s;
  border-bottom:2px solid transparent;background:transparent;border-top:none;border-left:none;border-right:none;
}
.k-tab:hover { color:var(--text-secondary); }
.k-tab.active { color:var(--gold);border-bottom-color:var(--gold); }
.k-tab-icon { font-size:16px;display:block;margin-bottom:2px; }

/* Messages */
.k-msgs {
  flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:16px;z-index:1;scroll-behavior:smooth;
}
.k-msgs::-webkit-scrollbar { width:4px; }
.k-msgs::-webkit-scrollbar-thumb { background:var(--border);border-radius:4px; }

.msg { max-width:82%;animation:msgIn .35s cubic-bezier(.22,1,.36,1) both; }
@keyframes msgIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
.msg-u { align-self:flex-end; }
.msg-a { align-self:flex-start; }
.msg-lbl { font-size:9px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px;display:flex;align-items:center;gap:5px; }
.msg-u .msg-lbl { color:var(--text-light);justify-content:flex-end; }
.msg-a .msg-lbl { color:var(--gold); }
.msg-lbl .dot { width:5px;height:5px;border-radius:50%;background:var(--green-soft); }
.msg-bbl { padding:14px 18px;line-height:1.5;font-size:14px;word-wrap:break-word; }
.msg-u .msg-bbl { background:var(--charcoal);color:var(--cream);border-radius:var(--radius) var(--radius-xs) var(--radius) var(--radius);box-shadow:var(--shadow-sm);white-space:pre-wrap; }
.msg-a .msg-bbl { background:white;color:var(--text-primary);border-radius:var(--radius-xs) var(--radius) var(--radius) var(--radius);border:1px solid var(--border);box-shadow:var(--shadow-sm); }

/* ── Rich Content Styles ── */
.msg-a .msg-bbl .r-p { margin:0 0 6px; }
.msg-a .msg-bbl .r-p:last-child { margin-bottom:0; }

.r-h1 { display:block;font-family:'Playfair Display',serif;font-size:17px;font-weight:700;color:var(--charcoal);margin:10px 0 4px;padding-bottom:4px;border-bottom:1px solid var(--border); }
.r-h2 { display:block;font-family:'Playfair Display',serif;font-size:15.5px;font-weight:700;color:var(--charcoal);margin:8px 0 3px; }
.r-h3 { display:block;font-weight:600;color:var(--gold);margin:8px 0 2px;text-transform:uppercase;letter-spacing:1px;font-size:10px; }
.r-p:first-child .r-h1,.r-p:first-child .r-h2,.r-p:first-child .r-h3 { margin-top:0; }

.r-bold { color:var(--charcoal);font-weight:600; }
.r-italic { color:var(--text-secondary);font-style:italic;font-size:13px; }

.r-hr { display:block;height:1px;background:var(--border);margin:10px 0;border:none; }

.r-li { display:flex;align-items:flex-start;gap:8px;padding:1px 0; }
.r-bullet { width:5px;height:5px;min-width:5px;border-radius:50%;background:var(--gold);margin-top:6px; }

.r-oli { display:flex;align-items:flex-start;gap:8px;padding:1px 0; }
.r-num { min-width:18px;width:18px;height:18px;border-radius:50%;background:var(--gold-glow);color:var(--gold);font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;margin-top:1px;border:1px solid rgba(200,169,110,.25); }

.r-check { display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:50%;background:var(--green-muted);color:var(--green-soft);font-size:10px;font-weight:700;margin:0 2px;vertical-align:middle;border:1px solid rgba(122,158,126,.3); }
.r-cross { display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:50%;background:var(--red-muted);color:var(--red-soft);font-size:10px;font-weight:700;margin:0 2px;vertical-align:middle;border:1px solid rgba(201,112,112,.2); }

.r-code { background:var(--cream-warm,#F5F0EB);padding:1px 6px;border-radius:4px;font-family:'DM Mono',monospace;font-size:12.5px;color:var(--charcoal-mid); }

.typing { align-self:flex-start;display:flex;gap:4px;padding:14px 20px;background:white;border:1px solid var(--border);border-radius:var(--radius-xs) var(--radius) var(--radius) var(--radius);animation:msgIn .3s ease both; }
.typing-d { width:6px;height:6px;border-radius:50%;background:var(--gold);animation:tp 1.4s ease-in-out infinite; }
.typing-d:nth-child(2){animation-delay:.15s}.typing-d:nth-child(3){animation-delay:.3s}
@keyframes tp { 0%,60%,100%{opacity:.25;transform:scale(.85)} 30%{opacity:1;transform:scale(1.1)} }

.err-msg { align-self:flex-start;padding:10px 14px;background:#FFF5F5;border:1px solid #FECACA;border-radius:var(--radius-sm);color:#B91C1C;font-size:13px;max-width:82%;animation:msgIn .3s ease both; }

/* Input */
.k-input { padding:14px 20px 16px;border-top:1px solid var(--border);background:rgba(250,248,245,.95);backdrop-filter:blur(20px);z-index:10;flex-shrink:0; }
.k-input-wrap { display:flex;align-items:flex-end;gap:8px;background:white;border:1.5px solid var(--border);border-radius:var(--radius);padding:5px 5px 5px 16px;transition:border-color .2s,box-shadow .2s; }
.k-input-wrap:focus-within { border-color:var(--gold);box-shadow:0 0 0 4px var(--gold-glow); }
.k-input-wrap textarea { flex:1;border:none;outline:none;resize:none;font-family:'Jost',sans-serif;font-size:14px;line-height:1.5;color:var(--text-primary);background:transparent;padding:7px 0;max-height:100px;overflow-y:auto; }
.k-input-wrap textarea::placeholder { color:var(--text-light); }
.send-btn { width:38px;height:38px;border-radius:10px;border:none;background:var(--charcoal);color:var(--gold-light);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;flex-shrink:0; }
.send-btn:hover:not(:disabled){background:var(--charcoal-mid);transform:scale(1.05)}
.send-btn:disabled{opacity:.3;cursor:not-allowed}
.k-hint { font-size:10px;color:var(--text-light);text-align:center;margin-top:8px;line-height:1.5;max-width:560px;margin-left:auto;margin-right:auto;font-weight:300; }

/* ── PANTRY PANEL ── */
.k-pantry { flex:1;overflow-y:auto;padding:20px;z-index:1; }
.k-pantry-hdr { margin-bottom:20px; }
.k-pantry-hdr h2 { font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:var(--charcoal);margin-bottom:2px; }
.k-pantry-hdr p { font-size:12px;color:var(--text-secondary);line-height:1.5; }

.k-loc { margin-bottom:20px;background:white;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;box-shadow:var(--shadow-sm); }
.k-loc-head { padding:12px 16px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;transition:background .15s; }
.k-loc-head:hover { background:var(--gold-glow); }
.k-loc-left { display:flex;align-items:center;gap:10px; }
.k-loc-icon { font-size:22px; }
.k-loc-name { font-weight:600;font-size:14px;color:var(--charcoal); }
.k-loc-count { font-size:11px;color:var(--text-light);font-weight:500; }
.k-loc-chevron { font-size:12px;color:var(--text-light);transition:transform .2s; }
.k-loc-chevron.open { transform:rotate(180deg); }

.k-loc-body { padding:0 16px 14px;display:none; }
.k-loc-body.open { display:block; }

.k-chips { display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px; }
.k-chip {
  display:flex;align-items:center;gap:4px;padding:5px 10px;background:var(--green-muted);
  border:1px solid rgba(122,158,126,.2);border-radius:20px;font-size:12.5px;color:var(--charcoal);
  animation:msgIn .2s ease both;
}
.k-chip-x {
  width:16px;height:16px;border-radius:50%;border:none;background:rgba(0,0,0,.08);
  color:var(--text-light);font-size:11px;cursor:pointer;display:flex;align-items:center;
  justify-content:center;transition:all .15s;line-height:1;padding:0;
}
.k-chip-x:hover { background:var(--red-muted);color:var(--red-soft); }

.k-add-row { display:flex;gap:6px; }
.k-add-input {
  flex:1;padding:8px 12px;border:1.5px solid var(--border);border-radius:var(--radius-xs);
  font-family:'Jost',sans-serif;font-size:13px;outline:none;transition:border-color .2s;
  background:var(--cream);
}
.k-add-input:focus { border-color:var(--gold); }
.k-add-input::placeholder { color:var(--text-light); }
.k-add-btn {
  padding:8px 14px;background:var(--charcoal);color:var(--gold-light);border:none;
  border-radius:var(--radius-xs);font-size:12px;font-weight:600;cursor:pointer;
  transition:background .2s;white-space:nowrap;
}
.k-add-btn:hover { background:var(--charcoal-mid); }

.k-pantry-tip {
  margin-top:8px;padding:14px 16px;background:var(--gold-glow);border:1px solid rgba(200,169,110,.2);
  border-radius:var(--radius-sm);font-size:12.5px;color:var(--charcoal-mid);line-height:1.6;
}
.k-pantry-tip strong { color:var(--gold); }

/* ── PROFILE PANEL ── */
.k-overlay { position:fixed;inset:0;background:rgba(26,26,46,.4);backdrop-filter:blur(4px);z-index:1000;animation:fadeIn .2s ease; }
@keyframes fadeIn { from{opacity:0} to{opacity:1} }
.k-panel {
  position:fixed;top:0;right:0;width:340px;max-width:90vw;height:100vh;background:var(--cream);
  border-left:1px solid var(--border);box-shadow:var(--shadow-lg);z-index:1001;padding:24px 20px;
  overflow-y:auto;animation:slideIn .3s cubic-bezier(.22,1,.36,1);will-change:transform;
}
@keyframes slideIn { from{transform:translateX(100%)} to{transform:translateX(0)} }
.k-panel h2 { font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:var(--charcoal);margin-bottom:2px; }
.k-panel .sub { font-size:11px;color:var(--text-light);margin-bottom:20px; }
.k-field { margin-bottom:14px; }
.k-field label { display:block;font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--text-secondary);margin-bottom:4px; }
.k-field input,.k-field select { width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:var(--radius-xs);background:white;font-family:'Jost',sans-serif;font-size:13.5px;color:var(--text-primary);outline:none;transition:border-color .2s; }
.k-field input:focus,.k-field select:focus { border-color:var(--gold); }
.k-chips { display:flex;flex-wrap:wrap;gap:6px; }
.k-chip { padding:6px 11px;background:white;border:1.5px solid var(--border);border-radius:999px;font-family:'Jost',sans-serif;font-size:11.5px;font-weight:400;color:var(--text-secondary);cursor:pointer;transition:all .2s; }
.k-chip:hover { border-color:var(--gold);color:var(--charcoal); }
.k-chip.selected { background:var(--charcoal);border-color:var(--charcoal);color:var(--gold-light);font-weight:500; }
.k-panel-acts { display:flex;gap:8px;margin-top:20px; }
.btn-sv { flex:1;padding:11px;background:var(--charcoal);color:var(--gold-light);border:none;border-radius:var(--radius-xs);font-family:'Jost',sans-serif;font-size:12px;font-weight:600;letter-spacing:.5px;cursor:pointer;transition:background .2s; }
.btn-sv:hover{background:var(--charcoal-mid)}
.btn-cl { padding:11px 14px;background:transparent;color:var(--text-secondary);border:1.5px solid var(--border);border-radius:var(--radius-xs);font-family:'Jost',sans-serif;font-size:12px;cursor:pointer; }

/* Welcome */
@keyframes welcomeIn {
  from { opacity:0; transform:translateY(16px); }
  to   { opacity:1; transform:translateY(0); }
}
.k-welcome {
  flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
  padding:32px 24px;text-align:center;z-index:1;
  animation:welcomeIn .5s cubic-bezier(.22,1,.36,1) both;
}

/* Decorative eyebrow */
.k-w-eyebrow {
  display:inline-flex;align-items:center;gap:6px;
  font-size:9px;font-weight:600;letter-spacing:2px;text-transform:uppercase;
  color:var(--gold);margin-bottom:16px;
}
.k-w-eyebrow::before,.k-w-eyebrow::after {
  content:'';width:20px;height:1px;background:var(--gold);opacity:.4;
}

.k-w-icon {
  width:64px;height:64px;border-radius:20px;
  background:var(--charcoal);
  display:flex;align-items:center;justify-content:center;
  margin-bottom:20px;
  box-shadow:0 8px 32px rgba(26,26,46,.18), 0 0 0 1px rgba(200,169,110,.12);
  position:relative;
}
.k-w-icon::after {
  content:'';
  position:absolute;inset:-1px;
  border-radius:21px;
  background:linear-gradient(135deg,rgba(200,169,110,.2) 0%,transparent 60%);
}
.k-w-icon svg { width:26px;height:26px;color:var(--gold-light);position:relative;z-index:1; }

.k-w-t {
  font-family:'Playfair Display',serif;
  font-size:28px;font-weight:400;
  color:var(--charcoal);margin-bottom:8px;
  line-height:1.15;
  letter-spacing:-.01em;
}
.k-w-t em { font-style:italic;color:var(--gold); }
.k-w-s {
  font-size:13px;font-weight:300;
  color:var(--text-secondary);
  max-width:340px;line-height:1.7;
  margin-bottom:28px;
}

/* Quick action grid */
.k-qas { display:grid;grid-template-columns:1fr 1fr;gap:8px;max-width:460px;width:100%; }
.k-qa {
  display:flex;align-items:flex-start;gap:10px;padding:13px 15px;
  background:white;
  border:1px solid rgba(200,169,110,.14);
  border-radius:10px;
  font-family:'Jost',sans-serif;cursor:pointer;
  transition:all .2s cubic-bezier(.4,0,.2,1);
  text-align:left;
  position:relative;
  overflow:hidden;
}
.k-qa::before {
  content:'';
  position:absolute;inset:0;
  background:linear-gradient(135deg,rgba(200,169,110,.06) 0%,transparent 55%);
  opacity:0;transition:opacity .2s;
}
.k-qa:hover {
  border-color:rgba(200,169,110,.35);
  box-shadow:0 4px 20px rgba(200,169,110,.1);
  transform:translateY(-1px);
}
.k-qa:hover::before { opacity:1; }
.k-qa:active { transform:scale(.98) translateY(0); }
.k-qa-icon {
  flex-shrink:0;width:30px;height:30px;
  display:flex;align-items:center;justify-content:center;
  background:var(--charcoal);border-radius:8px;
  position:relative;z-index:1;
}
.k-qa-icon svg { width:15px;height:15px;color:var(--gold-light); }
.k-qa-body { position:relative;z-index:1;display:flex;flex-direction:column;gap:3px; }
.k-qa-label {
  display:block;
  font-size:9px;font-weight:600;letter-spacing:1.2px;text-transform:uppercase;
  color:var(--gold);
}
.k-qa-text {
  display:block;
  font-size:12px;color:var(--text-primary);line-height:1.4;font-weight:400;
}
@media(max-width:480px){
  .k-qas{grid-template-columns:1fr}
}

/* Suggestions row (above input, first turn only) */
.k-suggestions {
  display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:10px 20px 0;
  z-index:2;flex-shrink:0;animation:msgIn .4s ease both;
}
.k-suggestions-label {
  font-size:9px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;
  color:var(--text-light);padding:10px 20px 6px;flex-shrink:0;z-index:2;
}
@media(max-width:480px){
  .k-suggestions{grid-template-columns:1fr}
}

/* ── Mobile overrides (≤600px) ── */
@media(max-width:600px){
  .k-head{padding:10px 14px}
  .k-logo{font-size:0;letter-spacing:0}
  .k-logo .ac{font-size:0}
  .k-badge{display:none}
  .k-msgs{padding:12px;flex:1;min-height:0}
  .msg{max-width:90%}
  .k-input{padding:10px 12px 12px}
  .k-qas{grid-template-columns:1fr}
  /* Suggestions: scroll horizontal para no tapar el historial */
  .k-suggestions{
    display:flex;flex-direction:row;flex-wrap:nowrap;
    overflow-x:auto;gap:8px;padding:8px 12px 0;
    scrollbar-width:none;-webkit-overflow-scrolling:touch;
  }
  .k-suggestions::-webkit-scrollbar{display:none}
  .k-suggestions .k-qa{
    flex-shrink:0;width:200px;padding:10px 12px;
  }
  .k-suggestions-label{padding:8px 12px 4px}
  .k-toast{bottom:86px}
  .k-toast.visible{bottom:86px}
  .k-panel{width:100%;max-width:100%;border-left:none;border-top:1px solid var(--border)}
  .msg-bbl{padding:11px 14px;font-size:13.5px}
}

/* ── Meal Action Card (agent → dashboard) ── */
.meal-action-card {
  margin-top:8px;background:white;border:1.5px solid rgba(200,169,110,.25);border-radius:var(--radius-sm);
  overflow:hidden;animation:msgIn .35s cubic-bezier(.22,1,.36,1) both;
  box-shadow:0 2px 12px rgba(200,169,110,.08);
}
.meal-action-head {
  display:flex;align-items:center;gap:8px;padding:10px 14px;
  background:linear-gradient(135deg,rgba(200,169,110,.06),rgba(200,169,110,.02));
  border-bottom:1px solid rgba(200,169,110,.12);
}
.meal-action-icon { font-size:16px; }
.meal-action-title { font-size:11px;font-weight:600;letter-spacing:.5px;color:var(--charcoal);text-transform:uppercase; }
.meal-action-list { padding:8px 14px; }
.meal-action-item {
  display:flex;align-items:center;gap:8px;padding:5px 0;
  border-bottom:1px solid rgba(200,169,110,.06);font-size:13px;
}
.meal-action-item:last-child { border-bottom:none; }
.meal-action-label {
  font-size:9px;font-weight:600;letter-spacing:1px;text-transform:uppercase;
  color:var(--gold);min-width:65px;
}
.meal-action-name { flex:1;color:var(--text-primary);font-weight:400; }
.meal-action-meta { font-size:11px;color:var(--text-light);white-space:nowrap; }
.meal-action-btn {
  display:block;width:100%;padding:10px;background:var(--charcoal);color:var(--gold-light);
  border:none;font-family:'Jost',sans-serif;font-size:12px;font-weight:600;
  letter-spacing:.5px;cursor:pointer;transition:all .2s;text-align:center;
}
.meal-action-btn:hover { background:var(--charcoal-mid); }
.meal-action-buttons { display:flex;flex-direction:column; }
.meal-action-done {
  padding:10px;text-align:center;font-size:12px;font-weight:500;
  color:var(--green-soft);background:var(--green-muted);letter-spacing:.3px;
}
.meal-action-pdf {
  display:block;width:100%;padding:8px;background:transparent;color:var(--text-secondary);
  border:none;border-top:1px solid rgba(200,169,110,.1);font-family:'Jost',sans-serif;
  font-size:11px;font-weight:500;letter-spacing:.3px;cursor:pointer;transition:all .2s;text-align:center;
}
.meal-action-pdf:hover { background:var(--gold-glow);color:var(--gold); }

/* ── Exercise Action Card (agent → dashboard) ── */
.exercise-action-card {
  margin-top:8px;background:white;border:1.5px solid rgba(155,142,196,.25);border-radius:var(--radius-sm);
  overflow:hidden;animation:msgIn .35s cubic-bezier(.22,1,.36,1) both;
  box-shadow:0 2px 12px rgba(155,142,196,.08);
}
.exercise-action-head {
  display:flex;align-items:center;gap:8px;padding:10px 14px;
  background:linear-gradient(135deg,rgba(155,142,196,.08),rgba(155,142,196,.02));
  border-bottom:1px solid rgba(155,142,196,.12);
}
.exercise-action-icon { font-size:16px; }
.exercise-action-title { font-size:11px;font-weight:600;letter-spacing:.5px;color:var(--charcoal);text-transform:uppercase; }
.exercise-action-list { padding:8px 14px; }
.exercise-action-item {
  display:flex;align-items:center;gap:8px;padding:5px 0;
  border-bottom:1px solid rgba(155,142,196,.06);font-size:13px;
}
.exercise-action-item:last-child { border-bottom:none; }
.exercise-action-type { font-size:14px;min-width:22px;text-align:center; }
.exercise-action-name { flex:1;color:var(--text-primary);font-weight:400; }
.exercise-action-meta { font-size:11px;color:var(--text-light);white-space:nowrap; }
.exercise-action-buttons { display:flex;flex-direction:column; }
.exercise-action-btn {
  display:block;width:100%;padding:10px;background:#9B8EC4;color:white;
  border:none;font-family:'Jost',sans-serif;font-size:12px;font-weight:600;
  letter-spacing:.5px;cursor:pointer;transition:all .2s;text-align:center;
}
.exercise-action-btn:hover { background:#8A7DB3; }
.exercise-action-done {
  padding:10px;text-align:center;font-size:12px;font-weight:500;
  color:#7A9E7E;background:rgba(122,158,126,.08);letter-spacing:.3px;
}

/* ── Toast notification ── */
.k-toast {
  position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);
  background:var(--charcoal);color:var(--gold-light);padding:12px 24px;
  border-radius:8px;font-family:'Jost',sans-serif;font-size:13px;font-weight:500;
  letter-spacing:.3px;box-shadow:0 8px 30px rgba(26,26,46,.2);
  opacity:0;transition:all .35s cubic-bezier(.22,1,.36,1);
  z-index:999;pointer-events:none;display:flex;align-items:center;gap:8px;
}
.k-toast.visible { opacity:1;transform:translateX(-50%) translateY(0); }
`;

// ── Component ────────────────────────────────────────
export default function KyoraAgent() {
  const { profileForAgent } = useActiveProfile();
  const plan = usePlan();
  const usage = useAgentUsage();

  // Despensa solo para contexto del agente (sistem prompt + conteo en hint).
  // El CRUD vive en /app/pantry del sidebar, no aquí.
  const { asObject: pantry, totalCount, LOCATIONS: PANTRY_LOCATIONS } = usePantry();
  const { isCurrentWeek, currentPlan } = useWeeklyPlan();
  const todayStr = useMidnightRefresh();

  // Build today's plan context for the agent system prompt.
  // Includes meals, exercises, macro targets and progress so the agent
  // can answer "what should I eat today" without asking the user to repeat info.
  const todayContext = useMemo(() => {
    if (!isCurrentWeek || !currentPlan) return null;

    const dayEntry = (currentPlan.days || []).find((d) => d.date === todayStr);
    if (!dayEntry) return null;

    const exEntry = (currentPlan.exerciseRoutine || []).find((d) => d.date === todayStr);
    const doneMealsSet = new Set(currentPlan.doneMealIds || []);
    const doneExSet = new Set(currentPlan.doneExerciseIds || []);

    const meals = (dayEntry.meals || []).map((m) => ({
      label: m.label,
      name: m.name,
      time: m.time || "",
      calories: m.calories || 0,
      protein: m.protein || 0,
      done: doneMealsSet.has(m.id),
    }));

    const exercises = (exEntry?.exercises || []).map((e) => ({
      name: e.name,
      sets: e.sets || 0,
      reps: e.reps || 0,
      weight: e.weight || 0,
      duration: e.duration || 0,
      type: e.type || "strength",
      muscle: e.muscle || "",
      done: doneExSet.has(e.id),
    }));

    const doneMeals = meals.filter((m) => m.done);
    const doneCalories = doneMeals.reduce((s, m) => s + m.calories, 0);
    const doneProtein = doneMeals.reduce((s, m) => s + m.protein, 0);

    return {
      date: todayStr,
      meals,
      exercises,
      macroTargets: currentPlan.profileSnapshot || null,
      doneCalories,
      doneProtein,
    };
  }, [isCurrentWeek, currentPlan, todayStr]);

  const hasTodayPlan = !!todayContext;
  const { addMeal } = useMeals();
  const { addExercise } = useExercise();
  const { messages, setMessages, clearHistory } = useAgentHistory();

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [registeredMsgs, setRegisteredMsgs] = useState(new Set()); // indices of messages whose meals were registered
  const [registeredExMsgs, setRegisteredExMsgs] = useState(new Set()); // indices of messages whose exercises were registered
  const [toast, setToast] = useState(null); // { text, visible }
  // Paywall state — guarda el copy de la feature bloqueada (FEATURES.X.paywallCopy)
  // Cuando es null, el modal está cerrado.
  const [paywallCopy, setPaywallCopy] = useState(null);
  const toastTimer = useRef(null);
  const endRef = useRef(null);
  const taRef = useRef(null);
  const welcomeSeedRef = useRef(false);

  // Perfil efectivo para el agente: usa el del contexto si existe, si no, invitado
  const profile = profileForAgent || GUEST_PROFILE;
  const totalIngredients = totalCount;

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { if (taRef.current) { taRef.current.style.height = "auto"; taRef.current.style.height = taRef.current.scrollHeight + "px"; } }, [input]);

  // Seed: si no hay historial al montar (o tras "Nueva conversación"), insertar
  // un mensaje de bienvenida personalizado como primer turno del asistente.
  useEffect(() => {
    if (welcomeSeedRef.current) return;
    if (messages.length > 0) {
      welcomeSeedRef.current = true;
      return;
    }
    const welcome = buildWelcomeMessage(profile, totalIngredients);
    setMessages([{ role: "assistant", content: welcome }]);
    welcomeSeedRef.current = true;
  }, [messages.length, profile, totalIngredients, setMessages]);

  // ── API Call (streaming) ──
  const streamingRef = useRef(false);

  async function sendMessage(text) {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;

    // Gate: límite mensual de mensajes (plan Gratis = 20/mes; demás = Infinity).
    // Este check vive aquí en vez de en el wrapper de la API para que el contador
    // refleje 1:1 lo que el usuario "envió" — los retries internos no cuentan.
    const monthlyLimit = plan.limitFor(FEATURES.AGENT_MESSAGES_PER_MONTH);
    if (Number.isFinite(monthlyLimit) && usage.count >= monthlyLimit) {
      setPaywallCopy(FEATURES.AGENT_MESSAGES_PER_MONTH.paywallCopy);
      return;
    }

    setInput("");
    const next = [...messages, { role: "user", content: userMsg }];
    setMessages(next);
    setLoading(true);
    streamingRef.current = true;
    usage.increment();

    // Add empty assistant message that we'll fill with tokens
    const placeholderIdx = next.length;
    setMessages([...next, { role: "assistant", content: "" }]);

    try {
      // Routing por plan: heurística simple — mensajes que disparan generación
      // de plan completo van a Sonnet (esencial+), conversación normal a Haiku.
      // Esto reduce costo ~3-5x sin sacrificar calidad donde más importa.
      const isPlanRequest = /\b(plan|semana|menú|menu|rutina|comprar|despensa)\b/i.test(userMsg);
      const taskType = isPlanRequest ? "plan_generation" : "chat";
      await streamAnthropicMessage({
        systemPrompt: buildSystemPrompt(
          profile,
          pantry,
          PANTRY_LOCATIONS,
          { id: plan.id, messagesUsed: usage.count },
          { hasActivePlanToday: hasTodayPlan },
          todayContext
        ),
        messages: next.filter((m) => m.role !== "error"),
        model: plan.modelFor(taskType),
        onToken: (token) => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[placeholderIdx];
            if (last && last.role === "assistant") {
              updated[placeholderIdx] = { ...last, content: last.content + token };
            }
            return updated;
          });
        },
      });
    } catch (err) {
      if (err.name === "AbortError") return;
      setMessages((p) => {
        // Remove empty placeholder if streaming failed before any content
        const cleaned = p[placeholderIdx]?.content ? p : p.filter((_, i) => i !== placeholderIdx);
        return [...cleaned, { role: "error", content: `Error: ${err.message}` }];
      });
    } finally {
      setLoading(false);
      streamingRef.current = false;
    }
  }

  function handleKey(e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }

  const showToast = useCallback((text) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ text, visible: true });
    toastTimer.current = setTimeout(() => setToast(t => t ? { ...t, visible: false } : null), 2500);
    setTimeout(() => setToast(null), 2900);
  }, []);

  const handleRegisterMeals = useCallback((msgIndex, meals) => {
    meals.forEach((m) => addMeal({ ...m, done: false }));
    setRegisteredMsgs((prev) => new Set(prev).add(msgIndex));
    showToast(`${meals.length} comida${meals.length > 1 ? "s" : ""} agregada${meals.length > 1 ? "s" : ""} al Dashboard`);
  }, [addMeal, showToast]);

  const handleRegisterExercises = useCallback((msgIndex, exercises) => {
    exercises.forEach((e) => addExercise({ ...e, done: false }));
    setRegisteredExMsgs((prev) => new Set(prev).add(msgIndex));
    showToast(`${exercises.length} ejercicio${exercises.length > 1 ? "s" : ""} agregado${exercises.length > 1 ? "s" : ""} al Dashboard`);
  }, [addExercise, showToast]);

  function handleNewConversation() {
    if (loading) return;
    // Sin conversación real (solo el welcome seeded) no hace falta confirmar
    const hasRealConversation = messages.some((m) => m.role === "user");
    if (!hasRealConversation || window.confirm("¿Empezar una nueva conversación? Se borrará el historial actual con KYŌRA.")) {
      welcomeSeedRef.current = false;
      setRegisteredMsgs(new Set());
      setRegisteredExMsgs(new Set());
      clearHistory();
    }
  }

  // hasRealConversation: true solo cuando el usuario ya escribió al menos un mensaje.
  // El welcome seeded no cuenta — si solo existe eso, todavía estamos en "primer turno".
  const hasRealConversation = messages.some((m) => m.role === "user");
  // showSuggestions: sugerencias visibles mientras el usuario aún no ha escrito nada.
  const showSuggestions = !hasRealConversation;

  // ── Sugerencias contextuales — 3 estados ──────────────
  // Estado 1: Plan activo esta semana → preguntas que complementan el plan
  // Estado 2: Despensa cargada pero sin plan → enfoque en ingredientes
  // Estado 3: Sin despensa ni plan → arranque desde cero
  const quickActions = hasTodayPlan
    ? [
        {
          icon: ICO.barChart,
          label: "Mi progreso hoy",
          text: "¿Cómo está mi progreso nutricional de hoy? Revisa mis macros y dime si voy bien.",
        },
        {
          icon: ICO.sliders,
          label: "Ajustar plan",
          text: "Quiero hacer un cambio en mi plan de hoy. Ayúdame a ajustar una comida.",
        },
        {
          icon: totalIngredients > 0 ? ICO.utensils : ICO.leaf,
          label: totalIngredients > 0 ? "Cocinar con lo que tengo" : "Snack inteligente",
          text: totalIngredients > 0
            ? "¿Qué puedo preparar con lo que tengo en casa para complementar mi plan de hoy?"
            : "Dame ideas de snack que encajen en mis macros de hoy sin salirme del plan.",
        },
        {
          icon: ICO.sparkle,
          label: "Motivación",
          text: "Dame un tip nutricional o de hábitos para aprovechar mejor mi plan esta semana.",
        },
      ]
    : totalIngredients > 0
    ? [
        {
          icon: ICO.utensils,
          label: "Cocinar hoy",
          text: "¿Qué puedo cocinar hoy con lo que tengo en mi despensa?",
        },
        {
          icon: ICO.clipboard,
          label: "Plan semanal",
          text: "Créame un plan de alimentación semanal usando los ingredientes de mi despensa.",
        },
        {
          icon: ICO.shoppingBag,
          label: "Lista de compras",
          text: "¿Qué me falta comprar para complementar mi despensa y comer mejor esta semana?",
        },
        {
          icon: ICO.bolt,
          label: "Receta rápida",
          text: "Dame una receta rápida y nutritiva para cenar con lo que tengo.",
        },
      ]
    : [
        {
          icon: ICO.clipboard,
          label: "Plan semanal",
          text: "Créame un plan de alimentación semanal personalizado para mi objetivo.",
        },
        {
          icon: ICO.sunrise,
          label: "Empezar hoy",
          text: "¿Qué debería comer hoy para avanzar hacia mi objetivo?",
        },
        {
          icon: ICO.leaf,
          label: "Snacks",
          text: "Dame opciones de snack saludable y alto en proteína para el día.",
        },
        {
          icon: ICO.bolt,
          label: "Receta rápida",
          text: "Dame una receta rápida, nutritiva y fácil de preparar para hoy.",
        },
      ];

  // Label contextual que aparece encima de las sugerencias
  const suggestionsLabel = hasTodayPlan
    ? "Con tu plan activo"
    : totalIngredients > 0
    ? "Con tu despensa"
    : "Sugerencias rápidas";

  return (
    <>
      <style>{styles}</style>
      <div className="k-app">
        {/* ── Header (compact — sidebar handles main nav) ── */}
        <header className="k-head">
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            <span className="k-badge">Agente IA</span>
          </div>
          <div className="k-head-r">
            {hasRealConversation && (
              <button className="k-btn-icon" onClick={handleNewConversation} title="Nueva conversación" disabled={loading}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
              </button>
            )}
          </div>
        </header>

        {/* ── CHAT VIEW (única vista; la despensa vive en /app/pantry) ── */}

            <div className="k-msgs">
              {messages.map((m, i) => {
                if (m.role === "error") return <div key={i} className="err-msg">{m.content}</div>;

                // Skip empty assistant placeholders (pre-stream) — typing indicator handles that state
                if (m.role === "assistant" && !m.content) return null;

                // Parse meals and exercises from assistant messages
                const isAssistant = m.role === "assistant";
                const mealsResult = isAssistant ? extractMeals(m.content) : { meals: [], cleanText: m.content };
                const exResult = isAssistant ? extractExercises(mealsResult.cleanText) : { exercises: [], cleanText: mealsResult.cleanText };
                const meals = mealsResult.meals;
                const exercises = exResult.exercises;
                const cleanText = exResult.cleanText;
                const hasMeals = meals.length > 0;
                const hasExercises = exercises.length > 0;
                const alreadyRegistered = registeredMsgs.has(i);
                const alreadyRegisteredEx = registeredExMsgs.has(i);

                return (
                  <div key={i} className={`msg msg-${isAssistant ? "a" : "u"}`}>
                    <div className="msg-lbl">
                      {isAssistant && <span className="dot" />}
                      {isAssistant ? "KYŌRA" : "Tú"}
                    </div>
                    {isAssistant
                      ? <div className="msg-bbl" dangerouslySetInnerHTML={{ __html: renderMarkdown(cleanText) }} />
                      : <div className="msg-bbl">{m.content}</div>
                    }
                    {hasMeals && (
                      <div className="meal-action-card">
                        <div className="meal-action-head">
                          <span className="meal-action-icon">{ICO.utensils}</span>
                          <span className="meal-action-title">{meals.length} comida{meals.length > 1 ? "s" : ""} sugerida{meals.length > 1 ? "s" : ""}</span>
                        </div>
                        <div className="meal-action-list">
                          {meals.map((ml, j) => (
                            <div className="meal-action-item" key={j}>
                              <span className="meal-action-label">{ml.label}</span>
                              <span className="meal-action-name">{ml.name}</span>
                              <span className="meal-action-meta">{ml.calories} kcal · {ml.protein}g prot</span>
                            </div>
                          ))}
                        </div>
                        <div className="meal-action-buttons">
                        {alreadyRegistered ? (
                          <div className="meal-action-done">✓ Agregadas a tu Dashboard</div>
                        ) : (
                          <>
                            {hasTodayPlan && (
                              <div style={{ padding:"7px 14px", fontSize:"11px", color:"var(--text-light)", background:"var(--gold-glow)", textAlign:"center", borderBottom:"1px solid rgba(200,169,110,.1)" }}>
                                Ya tienes tu plan activo hoy — esto se agregará como comida extra
                              </div>
                            )}
                            <button className="meal-action-btn" onClick={() => handleRegisterMeals(i, meals)}>
                              {hasTodayPlan ? "Agregar como comida extra →" : "Agregar al Dashboard →"}
                            </button>
                          </>
                        )}
                        <button
                          className="meal-action-pdf"
                          onClick={() => {
                            if (!plan.canDownloadPDF) {
                              setPaywallCopy(FEATURES.PDF_DOWNLOAD.paywallCopy);
                              return;
                            }
                            generatePlanPDF({ meals, userName: profile?.nombre || "Usuario", agentText: cleanText.slice(0, 500) });
                          }}
                        >
                          <Ico size={13} d={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></>} /> Descargar Plan{!plan.canDownloadPDF && <span style={{ marginLeft: 6, fontSize: ".58rem", letterSpacing: ".1em", color: "#C8A96E", textTransform: "uppercase", fontWeight: 500 }}>Esencial</span>}
                        </button>
                      </div>
                      </div>
                    )}
                    {hasExercises && (
                      <div className="exercise-action-card">
                        <div className="exercise-action-head">
                          <span className="exercise-action-icon">{ICO.dumbbell}</span>
                          <span className="exercise-action-title">{exercises.length} ejercicio{exercises.length > 1 ? "s" : ""} sugerido{exercises.length > 1 ? "s" : ""}</span>
                        </div>
                        <div className="exercise-action-list">
                          {exercises.map((ex, j) => (
                            <div className="exercise-action-item" key={j}>
                              <span className="exercise-action-type">{ex.type === "cardio" ? ICO.run : ex.type === "flexibility" ? ICO.stretch : ex.type === "hiit" ? ICO.bolt : ICO.dumbbell}</span>
                              <span className="exercise-action-name">{ex.name}</span>
                              <span className="exercise-action-meta">
                                {ex.type === "cardio" || ex.type === "flexibility"
                                  ? `${ex.duration} min`
                                  : `${ex.sets}×${ex.reps}${ex.weight > 0 ? ` · ${ex.weight}kg` : ""}`}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="exercise-action-buttons">
                          {alreadyRegisteredEx ? (
                            <div className="exercise-action-done">✓ Agregados a tu Dashboard</div>
                          ) : (
                            <button className="exercise-action-btn" onClick={() => handleRegisterExercises(i, exercises)}>
                              Agregar Rutina al Dashboard →
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {loading && !messages[messages.length - 1]?.content && <div className="typing"><div className="typing-d"/><div className="typing-d"/><div className="typing-d"/></div>}
              <div ref={endRef} />
            </div>

            {showSuggestions && (
              <>
                <div className="k-suggestions-label">{suggestionsLabel}</div>
                <div className="k-suggestions">
                  {quickActions.map((q, i) => (
                    <button key={i} className="k-qa" onClick={() => sendMessage(q.text)} disabled={loading}>
                      <span className="k-qa-icon">{q.icon}</span>
                      <span className="k-qa-body">
                        <span className="k-qa-label">{q.label}</span>
                        <span className="k-qa-text">{q.text}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="k-input">
              <div className="k-input-wrap">
                <textarea
                  ref={taRef} rows={1}
                  placeholder="Pregúntame qué cocinar con lo que tienes..."
                  value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey} disabled={loading}
                />
                <button className="send-btn" onClick={() => sendMessage()} disabled={!input.trim() || loading}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
              <div className="k-hint">
                <span aria-hidden="true" style={{ color: "var(--gold)", marginRight: "5px" }}>⚕</span>
                {DISCLAIMER_TEXT}
                {totalIngredients > 0 && <span style={{ display: "block", marginTop: "3px", color: "var(--gold)", fontSize: "9.5px", letterSpacing: ".05em" }}>{totalIngredients} ingredientes en tu despensa</span>}
                {plan.isFree && (() => {
                  const limit = plan.limitFor(FEATURES.AGENT_MESSAGES_PER_MONTH);
                  if (!Number.isFinite(limit)) return null;
                  const remaining = Math.max(0, limit - usage.count);
                  const lowFuel = remaining <= 5;
                  return (
                    <span style={{ display: "block", marginTop: "3px", color: lowFuel ? "#C97070" : "var(--text-light)", fontSize: "9.5px", letterSpacing: ".05em" }}>
                      {remaining} de {limit} mensajes este mes
                      {lowFuel && remaining > 0 && " — actualiza para conversaciones ilimitadas"}
                    </span>
                  );
                })()}
              </div>
            </div>

        {/* ── Toast ── */}
        {toast && <div className={`k-toast${toast.visible ? " visible" : ""}`}>{ICO.check} {toast.text}</div>}
        {/* ── Paywall Modal (feature gating) ── */}
        <PaywallModal
          open={!!paywallCopy}
          onClose={() => setPaywallCopy(null)}
          copy={paywallCopy}
        />
      </div>
    </>
  );
}
