import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePantry } from "@context/PantryContext";
import { useWeeklyPlan, mondayOfThisWeek } from "@context/WeeklyPlanContext";
import { usePlan } from "@hooks/usePlan";
import { useMidnightRefresh } from "@hooks/useMidnightRefresh";
import { useActiveProfile } from "@hooks/useActiveProfile";
import { generateWeeklyPlan } from "@api/generateWeeklyPlan";
import { generateWeeklyPlanPDF } from "@utils/generatePlanPDF";
import { localDateISO } from "@utils/date";
import { FEATURES } from "@config/plans";
import PaywallModal from "@components/shared/PaywallModal";
import { buildSamplePlan } from "@data/samplePlan";

/* ═══════════════════════════════════════════════════════
   KYŌRA — Plan Page ("Mi Semana")
   Vista editorial semanal con alimentación + entrenamiento.
   Estados:
   1. Usuario puede generar Y tiene plan → PlanView normal
   2. Usuario puede generar Y NO tiene plan → EmptyState con CTA
   3. Usuario NO puede generar → SamplePlan con banner sticky
      (cualquier acción dispara paywall)
   4. Generando → loading con mensajes rotativos
   ═══════════════════════════════════════════════════════ */

/* ── Icons ── */
const Ico = ({ d, size = 18, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>{d}</svg>
);
const ICO = {
  calendar: <Ico d={<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>} />,
  shopping: <Ico d={<><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></>} />,
  chef: <Ico d={<><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/><line x1="6" y1="17" x2="18" y2="17"/></>} />,
  sparkle: <Ico d={<><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></>} />,
  check: <Ico d={<polyline points="20 6 9 17 4 12" />} />,
  refresh: <Ico d={<><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></>} />,
  down: <Ico d={<polyline points="6 9 12 15 18 9" />} />,
  x: <Ico d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>} />,
  dumbbell: <Ico d={<><path d="M6.5 6.5L3 10l3.5 3.5M17.5 17.5L21 14l-3.5-3.5M6.5 13.5l11-7M13.5 17.5l-7-11"/></>} />,
  run: <Ico d={<><circle cx="13" cy="4" r="2"/><path d="M4 22l5-6 5 3 2-8M14 11l4-1 2 4"/></>} />,
  bolt: <Ico d={<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />} />,
  stretch: <Ico d={<><circle cx="12" cy="5" r="2"/><path d="M12 7v6M9 10h6M7 20l5-7 5 7"/></>} />,
  lock: <Ico d={<><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>} />,
  download: <Ico d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>} />,
};

/* ── Styles ── */
const css = `
.pl-wrap{max-width:1000px;margin:0 auto;padding:2.5rem 1.5rem 4rem;font-family:var(--font-b)}

/* ── Entrance animations ── */
@keyframes plHeadIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
@keyframes plCardIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}

.pl-head{margin-bottom:2rem;animation:plHeadIn .45s cubic-bezier(.22,1,.36,1) both .04s}
.pl-eyebrow{font-size:.6rem;font-weight:500;letter-spacing:.22em;text-transform:uppercase;color:var(--gold);margin-bottom:.6rem}
.pl-title{font-family:var(--font-d);font-size:2rem;font-weight:400;color:var(--charcoal);line-height:1.15;letter-spacing:-.01em;margin-bottom:.4rem}
.pl-title em{font-style:italic;color:var(--gold);font-weight:500}
.pl-sub{font-size:.92rem;font-weight:300;color:var(--text-muted);line-height:1.55;max-width:620px}

/* ── Sample banner (sticky arriba del card) ── */
.pl-sample-banner{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:1rem;padding:1rem 1.3rem;background:linear-gradient(135deg,#FFF8EC,#FAF1DF);border:1px solid rgba(200,169,110,.35);border-radius:8px;margin-bottom:1rem;box-shadow:0 4px 20px rgba(200,169,110,.15);flex-wrap:wrap}
.pl-sample-ico{width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,var(--gold),var(--gold-light));color:var(--charcoal);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 12px rgba(200,169,110,.3)}
.pl-sample-text{flex:1;min-width:200px}
.pl-sample-title{font-family:var(--font-d);font-size:.98rem;font-weight:600;color:var(--charcoal);line-height:1.2;margin-bottom:2px}
.pl-sample-body{font-size:.78rem;font-weight:300;color:var(--text-muted);line-height:1.5}
.pl-sample-cta{background:var(--charcoal);color:var(--gold-light);border:none;border-radius:3px;font-family:var(--font-b);font-size:.68rem;font-weight:500;letter-spacing:.12em;text-transform:uppercase;padding:.7rem 1.1rem;cursor:pointer;transition:letter-spacing .25s,background .2s;flex-shrink:0}
.pl-sample-cta:hover{background:#000;letter-spacing:.16em}

/* ── Empty state ── */
.pl-empty{display:flex;flex-direction:column;gap:1rem;padding:3.5rem 2rem;background:var(--white);border:1px solid var(--border);border-radius:8px;text-align:center;align-items:center;animation:plCardIn .5s cubic-bezier(.22,1,.36,1) both .1s}
.pl-empty-ico{width:66px;height:66px;border-radius:16px;background:var(--charcoal);display:flex;align-items:center;justify-content:center;color:var(--gold-light);box-shadow:0 8px 28px rgba(26,26,46,.2), 0 0 0 1px rgba(200,169,110,.1);margin-bottom:.5rem;position:relative}
.pl-empty-ico::after{content:'';position:absolute;inset:-1px;border-radius:17px;background:linear-gradient(135deg,rgba(200,169,110,.18) 0%,transparent 55%)}
.pl-empty-title{font-family:var(--font-d);font-size:1.35rem;font-weight:600;color:var(--text-dark);margin-bottom:.3rem;letter-spacing:-.005em}
.pl-empty-body{font-size:.9rem;font-weight:300;color:var(--text-muted);line-height:1.6;max-width:440px;margin-bottom:1.5rem}
.pl-empty-bullets{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:.8rem;margin-bottom:1.8rem;width:100%;max-width:640px}
.pl-empty-bul{display:flex;gap:.6rem;align-items:flex-start;padding:.7rem .8rem;background:var(--cream);border:1px solid var(--border);border-radius:6px;text-align:left}
.pl-empty-bul-ico{color:var(--gold);flex-shrink:0;margin-top:2px}
.pl-empty-bul-text{font-size:.78rem;font-weight:400;color:var(--text-dark);line-height:1.45}
.pl-empty-bul-text small{display:block;font-size:.7rem;font-weight:300;color:var(--text-light);margin-top:2px}
.pl-generate-btn{display:inline-flex;align-items:center;gap:.6rem;background:var(--charcoal);color:var(--gold-light);border:none;border-radius:3px;font-family:var(--font-b);font-size:.78rem;font-weight:500;letter-spacing:.12em;text-transform:uppercase;padding:.95rem 1.8rem;cursor:pointer;transition:letter-spacing .25s,background .2s}
.pl-generate-btn:hover{background:#000;letter-spacing:.16em}
.pl-generate-btn:disabled{opacity:.55;cursor:not-allowed}

/* ── Loading state ── */
.pl-loading{padding:3rem 2rem;background:var(--white);border:1px solid var(--border);border-radius:8px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:1.2rem;min-height:320px;justify-content:center;animation:plCardIn .5s cubic-bezier(.22,1,.36,1) both .08s}
.pl-loading-orbit{width:64px;height:64px;position:relative;margin-bottom:.4rem}
.pl-loading-orbit::before{content:'';position:absolute;inset:0;border-radius:50%;border:1.5px solid rgba(200,169,110,.12)}
.pl-loading-orbit::after{content:'';position:absolute;inset:0;border-radius:50%;border:1.5px solid transparent;border-top-color:var(--gold);animation:plSpin .9s linear infinite}
@keyframes plSpin{to{transform:rotate(360deg)}}
.pl-loading-orbit-inner{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:32px;height:32px;border-radius:50%;background:var(--gold-glow);display:flex;align-items:center;justify-content:center}
.pl-loading-title{font-family:var(--font-d);font-size:1.2rem;font-weight:400;color:var(--charcoal)}
.pl-loading-step{font-size:.8rem;font-weight:300;color:var(--text-muted);min-height:1.2em;transition:opacity .3s;letter-spacing:.01em}
.pl-loading-hint{font-size:.68rem;font-weight:300;color:var(--text-light);letter-spacing:.05em;margin-top:.2rem}

/* ── Error state ── */
.pl-error{padding:1.2rem;background:#FAEFEF;border:1px solid rgba(201,112,112,.28);border-radius:8px;color:#8B3A3A;font-size:.88rem;font-weight:400;line-height:1.6;margin-bottom:1.2rem}
.pl-error b{color:#6B2A2A;font-weight:600}

/* ── Plan card ── */
.pl-card{background:var(--white);border:1px solid var(--border);border-radius:8px;padding:1.6rem;margin-bottom:1rem;animation:plCardIn .5s cubic-bezier(.22,1,.36,1) both .08s}
.pl-meta{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;margin-bottom:1.4rem;padding-bottom:1.2rem;border-bottom:1px solid var(--border);flex-wrap:wrap}
.pl-meta-left{flex:1;min-width:0}
.pl-plan-title{font-family:var(--font-d);font-size:1.45rem;font-weight:600;color:var(--text-dark);line-height:1.2;margin-bottom:.3rem;letter-spacing:-.005em}
.pl-plan-sub{font-size:.78rem;font-weight:300;color:var(--text-light);letter-spacing:.03em}
.pl-meta-actions{display:flex;gap:.5rem;flex-shrink:0;flex-wrap:wrap}
.pl-act-btn{display:inline-flex;align-items:center;gap:6px;background:var(--white);border:1px solid var(--border);border-radius:4px;font-family:var(--font-b);font-size:.7rem;font-weight:400;letter-spacing:.04em;color:var(--text-muted);padding:.55rem .9rem;cursor:pointer;transition:all .2s}
.pl-act-btn:hover{border-color:var(--gold);color:var(--charcoal)}
.pl-act-btn:disabled{opacity:.5;cursor:not-allowed}

/* Macros target */
.pl-target{display:grid;grid-template-columns:repeat(4,1fr);gap:.8rem;padding:1rem;background:var(--cream);border-radius:6px;margin-bottom:1.4rem}
.pl-target-cell{text-align:center}
.pl-target-label{font-size:.58rem;font-weight:500;letter-spacing:.15em;text-transform:uppercase;color:var(--text-light);margin-bottom:.3rem}
.pl-target-val{font-family:var(--font-d);font-size:1.2rem;font-weight:600;color:var(--text-dark);line-height:1}
.pl-target-unit{font-size:.7rem;font-weight:300;color:var(--text-light);margin-left:2px}

/* Tabs */
.pl-tabs{display:flex;gap:0;border-bottom:1px solid var(--border);margin-bottom:1.2rem;overflow-x:auto;scrollbar-width:none}
.pl-tabs::-webkit-scrollbar{display:none}
.pl-tab{
  flex:1;min-width:80px;padding:.65rem .4rem;
  background:none;border:none;border-bottom:2px solid transparent;
  font-family:var(--font-b);font-size:.72rem;font-weight:400;letter-spacing:.05em;
  color:var(--text-light);cursor:pointer;transition:color .18s,border-color .18s,background .18s;
  display:flex;flex-direction:column;gap:2px;align-items:center;
  position:relative;
}
.pl-tab:hover{color:var(--text-muted);background:rgba(200,169,110,.03)}
.pl-tab.active{color:var(--charcoal);border-bottom-color:var(--gold);background:rgba(200,169,110,.03)}
.pl-tab-day{font-weight:600;text-transform:uppercase;font-size:.6rem;letter-spacing:.16em}
.pl-tab.active .pl-tab-day{color:var(--gold)}
.pl-tab-date{font-size:.68rem;color:var(--text-light);font-weight:300}
.pl-tab.shopping{flex:0 0 auto;min-width:110px}
.pl-tab.shopping .pl-tab-day{font-size:.6rem}
.pl-tab-dot{width:4px;height:4px;border-radius:50%;background:var(--gold);display:none;margin-top:3px}
.pl-tab.has-progress .pl-tab-dot{display:block}

/* Day totals */
.pl-day-totals{display:flex;gap:1rem;flex-wrap:wrap;padding:.8rem 1rem;background:var(--gold-glow);border:1px solid rgba(200,169,110,.18);border-radius:6px;margin-bottom:1.2rem;align-items:center}
.pl-day-totals-label{font-size:.58rem;font-weight:500;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);margin-right:auto}
.pl-day-stat{display:flex;align-items:baseline;gap:3px;font-family:var(--font-b);font-size:.82rem;font-weight:500;color:var(--charcoal)}
.pl-day-stat small{font-size:.6rem;font-weight:400;color:var(--text-light);letter-spacing:.02em;margin-left:2px}

/* Section heading inside DayView */
.pl-section{margin-top:1.8rem}
.pl-section-head{display:flex;align-items:center;gap:.6rem;margin-bottom:.8rem}
.pl-section-head-ico{width:28px;height:28px;border-radius:6px;background:var(--gold-glow);color:var(--gold);display:flex;align-items:center;justify-content:center}
.pl-section-head-title{font-family:var(--font-d);font-size:1.05rem;font-weight:600;color:var(--text-dark)}
.pl-section-head-sub{font-size:.7rem;font-weight:300;color:var(--text-light);margin-left:auto}

/* Meals */
.pl-meal{border:1px solid var(--border);border-radius:6px;margin-bottom:.7rem;overflow:hidden;transition:all .2s;background:var(--white)}
.pl-meal.done{opacity:.68;background:var(--cream)}
.pl-meal-head{display:flex;align-items:center;gap:.9rem;padding:.9rem 1rem;cursor:pointer;transition:background .15s}
.pl-meal-head:hover{background:var(--cream)}
.pl-meal-label{font-size:.58rem;font-weight:500;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);min-width:68px;flex-shrink:0}
.pl-meal-info{flex:1;min-width:0}
.pl-meal-name{font-family:var(--font-d);font-size:1rem;font-weight:600;color:var(--text-dark);line-height:1.3;margin-bottom:2px}
.pl-meal-desc{font-size:.75rem;font-weight:300;color:var(--text-light);line-height:1.4;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden}
.pl-meal-macros{display:flex;gap:.6rem;font-size:.7rem;color:var(--text-muted);flex-shrink:0;align-items:baseline;font-weight:400}
.pl-meal-macros b{color:var(--charcoal);font-weight:600}
.pl-meal-chev{color:var(--text-light);flex-shrink:0;transition:transform .2s}
.pl-meal.open .pl-meal-chev{transform:rotate(180deg)}
.pl-meal-body{display:none;padding:0 1rem 1.1rem;border-top:1px solid var(--border)}
.pl-meal.open .pl-meal-body{display:block}
.pl-meal-sect{margin-top:1rem}
.pl-meal-sect h4{font-size:.6rem;font-weight:500;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);margin-bottom:.5rem}
.pl-meal-ing{list-style:none;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:.25rem .8rem}
.pl-meal-ing li{font-size:.78rem;color:var(--text-dark);font-weight:300;line-height:1.5;padding-left:14px;position:relative}
.pl-meal-ing li::before{content:"";position:absolute;left:3px;top:10px;width:4px;height:4px;background:var(--gold);border-radius:50%}
.pl-meal-recipe{font-family:'Cormorant Garamond',Georgia,serif;font-size:.98rem;font-weight:400;color:var(--text-dark);line-height:1.65;white-space:pre-line}
.pl-meal-done-btn{margin-top:.9rem;display:inline-flex;align-items:center;gap:5px;background:transparent;border:1px solid var(--border);border-radius:3px;font-family:var(--font-b);font-size:.65rem;font-weight:500;letter-spacing:.12em;text-transform:uppercase;color:var(--text-muted);padding:.5rem .9rem;cursor:pointer;transition:all .2s}
.pl-meal-done-btn:hover{border-color:var(--gold);color:var(--gold)}
.pl-meal.done .pl-meal-done-btn{background:var(--gold);color:var(--white);border-color:var(--gold)}

/* Exercises */
.pl-ex{border:1px solid var(--border);border-radius:6px;margin-bottom:.55rem;padding:.85rem 1rem;background:var(--white);display:flex;gap:.9rem;align-items:center;transition:all .2s}
.pl-ex.done{opacity:.65;background:var(--cream)}
.pl-ex-ico{width:32px;height:32px;border-radius:7px;background:var(--gold-glow);color:var(--gold);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.pl-ex-info{flex:1;min-width:0}
.pl-ex-name{font-family:var(--font-d);font-size:.92rem;font-weight:600;color:var(--text-dark);line-height:1.25;margin-bottom:2px}
.pl-ex-meta{font-size:.7rem;font-weight:300;color:var(--text-light);line-height:1.4}
.pl-ex-notes{font-size:.72rem;font-style:italic;color:var(--text-muted);margin-top:3px;line-height:1.4;font-family:'Cormorant Garamond',Georgia,serif;font-size:.85rem}
.pl-ex-done-btn{background:transparent;border:1px solid var(--border);border-radius:3px;font-family:var(--font-b);font-size:.6rem;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted);padding:.45rem .7rem;cursor:pointer;transition:all .2s;flex-shrink:0}
.pl-ex-done-btn:hover{border-color:var(--gold);color:var(--gold)}
.pl-ex.done .pl-ex-done-btn{background:var(--gold);color:var(--white);border-color:var(--gold)}

/* Exercise locked overlay */
.pl-ex-locked{position:relative;border:1px solid var(--border);border-radius:6px;padding:2.2rem 1.4rem;background:linear-gradient(135deg,#FFF,var(--cream));text-align:center;overflow:hidden}
.pl-ex-locked::before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 0%,rgba(255,255,255,.6) 100%);pointer-events:none}
.pl-ex-locked-content{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:.5rem}
.pl-ex-locked-ico{width:50px;height:50px;border-radius:12px;background:linear-gradient(135deg,var(--charcoal),var(--charcoal-soft));color:var(--gold-light);display:flex;align-items:center;justify-content:center;margin-bottom:.4rem}
.pl-ex-locked-title{font-family:var(--font-d);font-size:1.05rem;font-weight:600;color:var(--text-dark);margin-bottom:.2rem}
.pl-ex-locked-body{font-size:.82rem;font-weight:300;color:var(--text-muted);line-height:1.55;max-width:380px;margin-bottom:.9rem}
.pl-ex-locked-preview{display:flex;flex-direction:column;gap:.35rem;width:100%;max-width:380px;margin-bottom:1.2rem;filter:blur(3px);opacity:.6;pointer-events:none}
.pl-ex-locked-preview-row{display:flex;gap:.6rem;align-items:center;padding:.6rem;border:1px solid var(--border);border-radius:4px;background:var(--white)}
.pl-ex-locked-preview-ico{width:22px;height:22px;border-radius:4px;background:var(--gold-glow)}
.pl-ex-locked-preview-bar{height:8px;background:var(--border);border-radius:2px;flex:1}
.pl-ex-locked-cta{background:var(--charcoal);color:var(--gold-light);border:none;border-radius:3px;font-family:var(--font-b);font-size:.68rem;font-weight:500;letter-spacing:.12em;text-transform:uppercase;padding:.7rem 1.3rem;cursor:pointer;transition:letter-spacing .25s,background .2s}
.pl-ex-locked-cta:hover{background:#000;letter-spacing:.16em}

/* Shopping list */
.pl-shop-sect{margin-bottom:1.3rem}
.pl-shop-cat{font-family:var(--font-d);font-size:1rem;font-weight:600;color:var(--text-dark);margin-bottom:.7rem;padding-bottom:.4rem;border-bottom:1px solid var(--border)}
.pl-shop-list{list-style:none;display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:.3rem .8rem}
.pl-shop-item{display:flex;justify-content:space-between;align-items:baseline;gap:.8rem;padding:.4rem 0;font-size:.85rem;color:var(--text-dark);font-weight:400}
.pl-shop-item-qty{font-size:.72rem;color:var(--text-light);font-weight:300;letter-spacing:.02em}

/* Notes */
.pl-notes{margin-top:1.4rem;padding:1.2rem;background:var(--cream);border-left:3px solid var(--gold);border-radius:0 4px 4px 0;font-family:'Cormorant Garamond',Georgia,serif;font-size:1rem;font-weight:400;color:var(--text-dark);line-height:1.7;font-style:italic}

/* ── Active profile chip (arriba del plan) ── */
.pl-profile-chip{display:inline-flex;align-items:center;gap:.5rem;padding:.45rem .9rem;background:rgba(200,169,110,.08);border:1px solid rgba(200,169,110,.18);border-radius:20px;font-size:.7rem;font-weight:500;color:var(--charcoal);margin-bottom:1rem;letter-spacing:.03em}
.pl-profile-chip-dot{width:7px;height:7px;border-radius:50%;background:var(--gold)}
.pl-profile-chip-dot.family{background:#7A9E7E}

/* ── Plan history section ── */
.pl-history{margin-top:2.5rem}
.pl-history-head{display:flex;align-items:center;gap:.8rem;margin-bottom:1.2rem}
.pl-history-title{font-family:var(--font-d);font-size:1.2rem;font-weight:600;color:var(--text-dark)}
.pl-history-badge{font-size:.6rem;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);background:rgba(200,169,110,.1);border:1px solid rgba(200,169,110,.18);border-radius:10px;padding:2px 8px}
.pl-history-lock{padding:1.4rem;background:linear-gradient(135deg,#FFF,var(--cream));border:1px dashed var(--border);border-radius:8px;display:flex;align-items:center;gap:1rem;flex-wrap:wrap}
.pl-history-lock-ico{width:40px;height:40px;border-radius:10px;background:rgba(200,169,110,.08);color:var(--gold);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.pl-history-lock-text{flex:1;min-width:200px}
.pl-history-lock-title{font-family:var(--font-d);font-size:.95rem;font-weight:600;color:var(--text-dark);margin-bottom:2px}
.pl-history-lock-body{font-size:.78rem;font-weight:300;color:var(--text-muted);line-height:1.5}
.pl-history-lock-cta{background:var(--charcoal);color:var(--gold-light);border:none;border-radius:3px;font-family:var(--font-b);font-size:.68rem;font-weight:500;letter-spacing:.1em;text-transform:uppercase;padding:.65rem 1.1rem;cursor:pointer;flex-shrink:0;transition:background .2s}
.pl-history-lock-cta:hover{background:#000}
.pl-history-list{display:flex;flex-direction:column;gap:.7rem}
.pl-archive-card{background:var(--white);border:1px solid var(--border);border-radius:6px;padding:1rem 1.2rem;display:flex;align-items:center;gap:1rem;flex-wrap:wrap;transition:border-color .2s}
.pl-archive-card:hover{border-color:rgba(200,169,110,.3)}
.pl-archive-info{flex:1;min-width:0}
.pl-archive-title{font-family:var(--font-d);font-size:.95rem;font-weight:600;color:var(--text-dark);line-height:1.3;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pl-archive-meta{font-size:.7rem;font-weight:300;color:var(--text-light)}
.pl-archive-profile-tag{display:inline-block;margin-left:.5rem;padding:1px 7px;background:rgba(122,158,126,.1);color:#7A9E7E;border-radius:10px;font-size:.62rem;font-weight:500;letter-spacing:.05em;vertical-align:middle}
.pl-archive-actions{display:flex;gap:.4rem;flex-shrink:0}
.pl-archive-btn{display:inline-flex;align-items:center;gap:5px;background:var(--white);border:1px solid var(--border);border-radius:4px;font-family:var(--font-b);font-size:.65rem;font-weight:400;letter-spacing:.04em;color:var(--text-muted);padding:.45rem .75rem;cursor:pointer;transition:all .2s}
.pl-archive-btn:hover{border-color:var(--gold);color:var(--charcoal)}
.pl-history-empty{font-size:.82rem;font-weight:300;color:var(--text-light);padding:.5rem 0}

/* Responsive */
@media(max-width:640px){
  .pl-wrap{padding:1.2rem .9rem 4rem}
  .pl-title{font-size:1.5rem}
  .pl-sub{font-size:.84rem}
  .pl-target{grid-template-columns:repeat(2,1fr);gap:.5rem;padding:.7rem}
  .pl-target-val{font-size:1rem}
  .pl-meal-macros{display:none}
  .pl-meta{flex-direction:column;align-items:stretch;gap:.6rem}
  .pl-meta-actions{justify-content:flex-start;flex-wrap:wrap}
  .pl-act-btn{font-size:.62rem;padding:.45rem .75rem}
  .pl-sample-cta{width:100%}
  .pl-sample-banner{padding:.8rem 1rem;gap:.6rem}
  .pl-sample-text{min-width:0}
  .pl-history-lock{flex-direction:column;align-items:flex-start}
  /* Empty state */
  .pl-empty{padding:2rem 1.2rem}
  .pl-empty-title{font-size:1.1rem}
  .pl-empty-body{font-size:.82rem;max-width:100%}
  .pl-empty-bullets{grid-template-columns:1fr}
  .pl-generate-btn{width:100%;justify-content:center}
  /* Loading state */
  .pl-loading{padding:2rem 1.2rem;min-height:260px}
  .pl-loading-title{font-size:1rem}
  /* Plan card */
  .pl-card{padding:1rem .9rem}
  .pl-plan-title{font-size:1.2rem}
  .pl-tab{min-width:64px;padding:.5rem .25rem}
  .pl-tab-date{display:none}
  .pl-tab.shopping{min-width:88px}
  .pl-day-totals{gap:.6rem;padding:.65rem .8rem}
  .pl-day-stat{font-size:.75rem}
  .pl-section{margin-top:1.2rem}
  /* Meals */
  .pl-meal-head{gap:.6rem;padding:.75rem .8rem}
  .pl-meal-label{min-width:52px;font-size:.52rem}
  .pl-meal-name{font-size:.9rem}
  .pl-meal-ing{grid-template-columns:1fr}
  .pl-meal-body{padding:0 .8rem .9rem}
  /* Exercises */
  .pl-ex{padding:.7rem .8rem;gap:.6rem}
  .pl-ex-name{font-size:.85rem}
  /* Shopping */
  .pl-shop-list{grid-template-columns:1fr}
  /* History */
  .pl-history-lock-text{min-width:0}
  .pl-archive-card{padding:.8rem 1rem}
  .pl-archive-actions{flex-wrap:wrap}
}
`;

/* ── Loading messages (rotate every ~2.8s while generating) ── */
const LOADING_STEPS = [
  "Analizando tu perfil...",
  "Calculando tus macros ideales...",
  "Revisando tu despensa...",
  "Eligiendo recetas balanceadas...",
  "Armando tu lista de compras...",
  "Diseñando tu rutina de entrenamiento...",
  "Afinando los últimos detalles...",
];

const EX_ICONS = {
  strength: ICO.dumbbell,
  cardio: ICO.run,
  hiit: ICO.bolt,
  flexibility: ICO.stretch,
};

export default function PlanPage() {
  const navigate = useNavigate();
  const { profileForAgent, profileLoading, isFamilyMember, memberName, memberId } = useActiveProfile();
  const { asObject: pantry } = usePantry();
  const { currentPlan, archive, isCurrentWeek, savePlan, clearPlan, toggleMealDone, toggleExerciseDone, restoreFromArchive } = useWeeklyPlan();
  const plan = usePlan();

  const todayStr = useMidnightRefresh();

  const [loadingStep, setLoadingStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [expandedMeal, setExpandedMeal] = useState(null);
  const [paywallCopy, setPaywallCopy] = useState(null);
  const abortRef = useRef(null);

  // Plan a mostrar: el real del usuario si puede, sino sample
  const displayPlan = useMemo(() => {
    if (plan.canGenerateWeeklyPlan) return currentPlan;
    return buildSamplePlan();
  }, [plan.canGenerateWeeklyPlan, currentPlan]);

  const isSample = !!displayPlan?.isSample;

  // Rotar mensajes de loading
  useEffect(() => {
    if (!generating) { setLoadingStep(0); return; }
    const i = setInterval(() => setLoadingStep((s) => (s + 1) % LOADING_STEPS.length), 2800);
    return () => clearInterval(i);
  }, [generating]);

  // Auto-select today's tab. Re-runs when plan changes OR when day changes at midnight.
  useEffect(() => {
    if (!displayPlan) return;
    const idx = displayPlan.days.findIndex((d) => d.date === todayStr);
    setActiveTab(idx >= 0 ? idx : 0);
  }, [displayPlan?.id, todayStr]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleGenerate() {
    if (!plan.canGenerateWeeklyPlan) {
      setPaywallCopy(FEATURES.WEEKLY_PLAN_GENERATION.paywallCopy);
      return;
    }
    if (!profileForAgent) {
      setError("Completa tu perfil antes de generar un plan semanal.");
      return;
    }
    setError(null);
    setGenerating(true);
    abortRef.current = new AbortController();

    try {
      const result = await generateWeeklyPlan({
        profile: profileForAgent,
        pantry,
        weekStartDate: mondayOfThisWeek(),
        planId: plan.id,
        signal: abortRef.current.signal,
      });
      savePlan({ ...result, forProfileId: memberId, forProfileName: memberName });
      const todayIdx = (result.days || []).findIndex((d) => d.date === localDateISO());
      setActiveTab(todayIdx >= 0 ? todayIdx : 0);
      setExpandedMeal(null);
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.message || "No pude generar tu plan. Intenta de nuevo en un momento.");
      }
    } finally {
      setGenerating(false);
      abortRef.current = null;
    }
  }

  function handleCancel() {
    abortRef.current?.abort();
    setGenerating(false);
  }

  function handleRegenerate() {
    if (isSample) {
      setPaywallCopy(FEATURES.WEEKLY_PLAN_GENERATION.paywallCopy);
      return;
    }
    if (!window.confirm("¿Regenerar tu plan? El actual se archivará.")) return;
    handleGenerate();
  }

  function handleDownloadPDF() {
    generateWeeklyPlanPDF(displayPlan, profileForAgent?.nombre || "Usuario");
  }

  function handleDelete() {
    if (isSample) return;
    if (!window.confirm("¿Eliminar este plan? Puedes generar uno nuevo después.")) return;
    clearPlan();
    setActiveTab(0);
  }

  function handleExercisePaywall() {
    setPaywallCopy(FEATURES.WEEKLY_EXERCISE_ROUTINE.paywallCopy);
  }

  function handleGoPricing() {
    navigate("/#pricing");
  }

  // ── Render ──

  if (profileLoading) {
    return (
      <>
        <style>{css}</style>
        <div className="pl-wrap">
          <div className="pl-loading">
            <div className="pl-loading-orbit" />
            <div className="pl-loading-title">Cargando tu semana...</div>
          </div>
        </div>
      </>
    );
  }

  const showEmpty = !generating && !displayPlan && plan.canGenerateWeeklyPlan;
  const showPlan = !generating && !!displayPlan;

  return (
    <>
      <style>{css}</style>
      <div className="pl-wrap">
        {/* Header editorial */}
        <div className="pl-head">
          <div className="pl-eyebrow">Mi Semana</div>
          <h1 className="pl-title">
            Tu <em>semana</em>, pensada por KYŌRA
          </h1>
          <p className="pl-sub">
            Un plan completo de 7 días: alimentación balanceada, rutina de entrenamiento y lista de compras — todo en un solo lugar.
          </p>
        </div>

        {/* Perfil activo indicator */}
        {(isFamilyMember || memberName) && (
          <div className="pl-profile-chip">
            <span className={`pl-profile-chip-dot${isFamilyMember ? " family" : ""}`} />
            Generando para: <strong>{memberName}</strong>
          </div>
        )}

        {error && (
          <div className="pl-error">
            <b>Algo no salió bien. </b>{error}
          </div>
        )}

        {generating && (
          <div className="pl-loading">
            <div className="pl-loading-orbit">
              <div className="pl-loading-orbit-inner">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
              </div>
            </div>
            <div className="pl-loading-title">Generando tu semana</div>
            <div className="pl-loading-step">{LOADING_STEPS[loadingStep]}</div>
            <div className="pl-loading-hint">Vale la pena esperar — tu plan se está construyendo ahora mismo.</div>
            <button className="pl-act-btn" onClick={handleCancel} style={{ marginTop: "1.2rem" }}>
              Cancelar
            </button>
          </div>
        )}

        {showEmpty && (
          <EmptyState onGenerate={handleGenerate} />
        )}

        {showPlan && (
          <>
            {isSample && <SampleBanner onGoPricing={handleGoPricing} />}
            <PlanView
              displayPlan={displayPlan}
              isCurrentWeek={isSample ? true : isCurrentWeek}
              isSample={isSample}
              canSeeExercise={plan.canSeeWeeklyExercise}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              expandedMeal={expandedMeal}
              setExpandedMeal={setExpandedMeal}
              onToggleMealDone={(id) => !isSample && toggleMealDone(id)}
              onToggleExerciseDone={(id) => !isSample && toggleExerciseDone(id)}
              onRegenerate={handleRegenerate}
              onDelete={handleDelete}
              onDownloadPDF={handleDownloadPDF}
              onExercisePaywall={handleExercisePaywall}
              onGoPricing={handleGoPricing}
            />
          </>
        )}

        {/* ── Historial de planes ── */}
        <PlanHistorySection
          archive={archive}
          canSeeHistory={plan.canUse(FEATURES.PLAN_HISTORY)}
          onGoPricing={handleGoPricing}
          onRestore={restoreFromArchive}
          onDownload={(p) => generateWeeklyPlanPDF(p, p.forProfileName || profileForAgent?.nombre || "Usuario")}
        />

        <PaywallModal open={!!paywallCopy} onClose={() => setPaywallCopy(null)} copy={paywallCopy} />
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   Plan History Section
   ═══════════════════════════════════════════════════════ */
function PlanHistorySection({ archive, canSeeHistory, onGoPricing, onRestore, onDownload }) {
  if (!archive || archive.length === 0) return null;

  return (
    <div className="pl-history">
      <div className="pl-history-head">
        <h2 className="pl-history-title">Historial de semanas</h2>
        {canSeeHistory && (
          <span className="pl-history-badge">{archive.length} plan{archive.length !== 1 ? "es" : ""}</span>
        )}
      </div>

      {!canSeeHistory ? (
        <div className="pl-history-lock">
          <div className="pl-history-lock-ico">{ICO.lock}</div>
          <div className="pl-history-lock-text">
            <div className="pl-history-lock-title">Historial de 8 semanas — Plan Premium</div>
            <div className="pl-history-lock-body">
              Accede, compara y restaura cualquiera de tus planes anteriores. Tienes {archive.length} plan{archive.length !== 1 ? "es" : ""} guardado{archive.length !== 1 ? "s" : ""}.
            </div>
          </div>
          <button className="pl-history-lock-cta" onClick={onGoPricing}>Ver Premium</button>
        </div>
      ) : (
        <div className="pl-history-list">
          {archive.map((p) => (
            <ArchiveCard
              key={p.id}
              plan={p}
              onRestore={onRestore}
              onDownload={onDownload}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ArchiveCard({ plan, onRestore, onDownload }) {
  const dateStr = useMemo(() => {
    if (!plan.weekStartDate) return "Semana archivada";
    const d = new Date(plan.weekStartDate + "T12:00:00");
    const end = new Date(d);
    end.setDate(end.getDate() + 6);
    const months = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
    return `${d.getDate()} – ${end.getDate()} ${months[end.getMonth()]} ${end.getFullYear()}`;
  }, [plan.weekStartDate]);

  const createdStr = useMemo(() => {
    if (!plan.createdAt) return "";
    const d = new Date(plan.createdAt);
    return `Generado el ${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
  }, [plan.createdAt]);

  return (
    <div className="pl-archive-card">
      <div className="pl-archive-info">
        <div className="pl-archive-title">
          {plan.title || "Plan semanal"}
          {plan.forProfileName && (
            <span className="pl-archive-profile-tag">{plan.forProfileName}</span>
          )}
        </div>
        <div className="pl-archive-meta">
          {dateStr}{createdStr && ` · ${createdStr}`}
        </div>
      </div>
      <div className="pl-archive-actions">
        <button className="pl-archive-btn" onClick={() => onDownload(plan)} title="Descargar PDF">
          {ICO.download} PDF
        </button>
        <button className="pl-archive-btn" onClick={() => {
          if (window.confirm(`¿Restaurar "${plan.title || "este plan"}"? El plan activo actual se archivará.`)) {
            onRestore(plan.id);
          }
        }} title="Restaurar como plan activo">
          {ICO.refresh} Restaurar
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Sample Banner (sticky arriba del card)
   ═══════════════════════════════════════════════════════ */
function SampleBanner({ onGoPricing }) {
  return (
    <div className="pl-sample-banner">
      <div className="pl-sample-ico">{ICO.sparkle}</div>
      <div className="pl-sample-text">
        <div className="pl-sample-title">Este es un plan de muestra</div>
        <div className="pl-sample-body">
          El tuyo — con tu perfil, tus objetivos y tu despensa — se genera en minutos con Esencial.
        </div>
      </div>
      <button className="pl-sample-cta" onClick={onGoPricing}>
        Ver planes y precios
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Empty State — usuarios que pueden generar pero no tienen plan
   ═══════════════════════════════════════════════════════ */
function EmptyState({ onGenerate }) {
  return (
    <div className="pl-empty">
      <div className="pl-empty-ico">{ICO.sparkle}</div>
      <h2 className="pl-empty-title">Tu primera semana está a 30 segundos.</h2>
      <p className="pl-empty-body">
        KYŌRA analiza tu perfil, tus objetivos y tu despensa para construir un plan de 7 días completo — con recetas, macros y lista de compras.
      </p>

      <div className="pl-empty-bullets">
        <div className="pl-empty-bul">
          <span className="pl-empty-bul-ico">{ICO.calendar}</span>
          <div className="pl-empty-bul-text">
            7 días completos
            <small>Desayuno, comida, cena y snack con macros</small>
          </div>
        </div>
        <div className="pl-empty-bul">
          <span className="pl-empty-bul-ico">{ICO.chef}</span>
          <div className="pl-empty-bul-text">
            Recetas paso a paso
            <small>Ingredientes con cantidades exactas</small>
          </div>
        </div>
        <div className="pl-empty-bul">
          <span className="pl-empty-bul-ico">{ICO.shopping}</span>
          <div className="pl-empty-bul-text">
            Lista de compras
            <small>Agrupada por categoría, lista para el súper</small>
          </div>
        </div>
      </div>

      <button className="pl-generate-btn" onClick={onGenerate}>
        {ICO.sparkle} Generar mi plan semanal
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Plan View — header + macros target + tabs + day/shopping
   ═══════════════════════════════════════════════════════ */
function PlanView({ displayPlan, isCurrentWeek, isSample, canSeeExercise, activeTab, setActiveTab, expandedMeal, setExpandedMeal, onToggleMealDone, onToggleExerciseDone, onRegenerate, onDelete, onDownloadPDF, onExercisePaywall }) {
  const { profileSnapshot, days = [], exerciseRoutine, shoppingList = [], notes, doneMealIds = [], doneExerciseIds = [] } = displayPlan;
  const doneMealSet = useMemo(() => new Set(doneMealIds), [doneMealIds]);
  const doneExSet = useMemo(() => new Set(doneExerciseIds), [doneExerciseIds]);
  const SHOPPING_TAB = days.length;

  const dayTabs = useMemo(
    () => days.map((d) => ({
      day: (d.day || "").slice(0, 3),
      date: formatShortDate(d.date),
      hasProgress: (d.meals || []).some((m) => doneMealSet.has(m.id)),
    })),
    [days, doneMealSet]
  );

  const activeDay = activeTab < SHOPPING_TAB ? days[activeTab] : null;
  const activeExerciseDay = activeTab < SHOPPING_TAB && Array.isArray(exerciseRoutine) ? exerciseRoutine[activeTab] : null;
  const createdAt = displayPlan.createdAt ? new Date(displayPlan.createdAt) : null;

  return (
    <div className="pl-card">
      <div className="pl-meta">
        <div className="pl-meta-left">
          <div className="pl-plan-title">{displayPlan.title || "Plan semanal"}</div>
          <div className="pl-plan-sub">
            {isSample ? "Plan demostrativo" : (isCurrentWeek ? "Semana actual" : "Plan de otra semana")}
            {!isSample && createdAt && " · creado " + createdAt.toLocaleDateString("es", { day: "numeric", month: "short" })}
          </div>
        </div>
        <div className="pl-meta-actions">
          <button className="pl-act-btn" onClick={onRegenerate} title={isSample ? "Actualiza para crear tu plan" : "Genera un nuevo plan"}>
            {ICO.refresh} {isSample ? "Crear el mío" : "Regenerar"}
          </button>
          {!isSample && (
            <button className="pl-act-btn" onClick={onDownloadPDF} title="Descargar plan como PDF">
              {ICO.download} PDF
            </button>
          )}
          {!isSample && (
            <button className="pl-act-btn" onClick={onDelete} title="Eliminar este plan">
              {ICO.x} Eliminar
            </button>
          )}
        </div>
      </div>

      {/* Macros target */}
      {profileSnapshot && (
        <div className="pl-target">
          <div className="pl-target-cell">
            <div className="pl-target-label">Calorías</div>
            <div className="pl-target-val">{profileSnapshot.caloriesTarget ?? "—"}<span className="pl-target-unit">kcal</span></div>
          </div>
          <div className="pl-target-cell">
            <div className="pl-target-label">Proteína</div>
            <div className="pl-target-val">{profileSnapshot.proteinTarget ?? "—"}<span className="pl-target-unit">g</span></div>
          </div>
          <div className="pl-target-cell">
            <div className="pl-target-label">Carbos</div>
            <div className="pl-target-val">{profileSnapshot.carbsTarget ?? "—"}<span className="pl-target-unit">g</span></div>
          </div>
          <div className="pl-target-cell">
            <div className="pl-target-label">Grasas</div>
            <div className="pl-target-val">{profileSnapshot.fatsTarget ?? "—"}<span className="pl-target-unit">g</span></div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="pl-tabs" role="tablist">
        {dayTabs.map((t, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={activeTab === i}
            className={`pl-tab${activeTab === i ? " active" : ""}${t.hasProgress ? " has-progress" : ""}`}
            onClick={() => setActiveTab(i)}
          >
            <span className="pl-tab-day">{t.day}</span>
            <span className="pl-tab-date">{t.date}</span>
            <span className="pl-tab-dot" />
          </button>
        ))}
        <button
          role="tab"
          aria-selected={activeTab === SHOPPING_TAB}
          className={`pl-tab shopping${activeTab === SHOPPING_TAB ? " active" : ""}`}
          onClick={() => setActiveTab(SHOPPING_TAB)}
        >
          <span className="pl-tab-day">Lista compras</span>
        </button>
      </div>

      {activeDay && (
        <DayView
          day={activeDay}
          exerciseDay={activeExerciseDay}
          dayIdx={activeTab}
          expandedMeal={expandedMeal}
          setExpandedMeal={setExpandedMeal}
          onToggleMealDone={onToggleMealDone}
          onToggleExerciseDone={onToggleExerciseDone}
          doneMealSet={doneMealSet}
          doneExSet={doneExSet}
          canSeeExercise={canSeeExercise}
          isSample={isSample}
          onExercisePaywall={onExercisePaywall}
          onRegenerate={onRegenerate}
        />
      )}

      {activeTab === SHOPPING_TAB && <ShoppingList list={shoppingList} />}

      {notes && <div className="pl-notes">{notes}</div>}
    </div>
  );
}

/* ─── DayView ─── */
function DayView({ day, exerciseDay, dayIdx, expandedMeal, setExpandedMeal, onToggleMealDone, onToggleExerciseDone, doneMealSet, doneExSet, canSeeExercise, isSample, onExercisePaywall, onRegenerate }) {
  const meals = day.meals || [];
  const totals = day.totals || computeTotals(meals);
  const exercises = exerciseDay?.exercises || [];

  return (
    <div>
      <div className="pl-day-totals">
        <span className="pl-day-totals-label">Total del día</span>
        <span className="pl-day-stat">{totals.calories ?? 0}<small>kcal</small></span>
        <span className="pl-day-stat">{totals.protein ?? 0}<small>g proteína</small></span>
        <span className="pl-day-stat">{totals.carbs ?? 0}<small>g carbos</small></span>
        <span className="pl-day-stat">{totals.fats ?? 0}<small>g grasas</small></span>
      </div>

      {/* ── Sección: Nutrición ── */}
      <div className="pl-section">
        <div className="pl-section-head">
          <span className="pl-section-head-ico">{ICO.chef}</span>
          <span className="pl-section-head-title">Nutrición</span>
          <span className="pl-section-head-sub">{meals.length} comidas</span>
        </div>

        {meals.map((m, j) => {
          const key = `${dayIdx}:${j}`;
          const isOpen = expandedMeal === key;
          const isDone = doneMealSet.has(m.id);
          return (
            <div key={m.id || j} className={`pl-meal${isOpen ? " open" : ""}${isDone ? " done" : ""}`}>
              <div className="pl-meal-head" onClick={() => setExpandedMeal(isOpen ? null : key)}>
                <div className="pl-meal-label">{m.label}</div>
                <div className="pl-meal-info">
                  <div className="pl-meal-name">{m.name}</div>
                  {m.description && <div className="pl-meal-desc">{m.description}</div>}
                </div>
                <div className="pl-meal-macros">
                  <span><b>{m.calories ?? 0}</b> kcal</span>
                  <span><b>{m.protein ?? 0}</b>g prot</span>
                </div>
                <span className="pl-meal-chev">{ICO.down}</span>
              </div>
              <div className="pl-meal-body">
                {Array.isArray(m.ingredients) && m.ingredients.length > 0 && (
                  <div className="pl-meal-sect">
                    <h4>Ingredientes</h4>
                    <ul className="pl-meal-ing">
                      {m.ingredients.map((ing, k) => <li key={k}>{ing}</li>)}
                    </ul>
                  </div>
                )}
                {m.recipe && (
                  <div className="pl-meal-sect">
                    <h4>Preparación</h4>
                    <div className="pl-meal-recipe">{m.recipe}</div>
                  </div>
                )}
                {!isSample && (
                  <button
                    className="pl-meal-done-btn"
                    onClick={(e) => { e.stopPropagation(); onToggleMealDone(m.id); }}
                  >
                    {isDone ? <>{ICO.check} Hecha</> : <>Marcar como hecha</>}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Sección: Entrenamiento ── */}
      <div className="pl-section">
        <div className="pl-section-head">
          <span className="pl-section-head-ico">{ICO.dumbbell}</span>
          <span className="pl-section-head-title">Entrenamiento</span>
          {canSeeExercise && exercises.length > 0 && (
            <span className="pl-section-head-sub">{exercises.length} ejercicio{exercises.length === 1 ? "" : "s"}</span>
          )}
        </div>

        {canSeeExercise ? (
          exercises.length > 0 ? (
            exercises.map((ex, j) => {
              const isDone = doneExSet.has(ex.id);
              return (
                <div key={ex.id || j} className={`pl-ex${isDone ? " done" : ""}`}>
                  <span className="pl-ex-ico">{EX_ICONS[ex.type] || ICO.dumbbell}</span>
                  <div className="pl-ex-info">
                    <div className="pl-ex-name">{ex.name}</div>
                    <div className="pl-ex-meta">{formatExerciseMeta(ex)}</div>
                    {ex.notes && <div className="pl-ex-notes">{ex.notes}</div>}
                  </div>
                  {!isSample && (
                    <button className="pl-ex-done-btn" onClick={() => onToggleExerciseDone(ex.id)}>
                      {isDone ? "✓ Hecho" : "Marcar"}
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div style={{ padding: "1.25rem 1rem", textAlign: "center" }}>
              <div style={{ color: "var(--text-light)", fontSize: ".82rem", fontWeight: 300, marginBottom: ".75rem" }}>
                Este plan fue generado antes de activar tu rutina de entrenamiento.
              </div>
              <button className="pl-act-btn" onClick={onRegenerate}>
                {ICO.refresh} Regenerar con ejercicios
              </button>
            </div>
          )
        ) : (
          <ExerciseLocked onUpgrade={onExercisePaywall} />
        )}
      </div>
    </div>
  );
}

/* ─── Exercise locked overlay ─── */
function ExerciseLocked({ onUpgrade }) {
  return (
    <div className="pl-ex-locked">
      <div className="pl-ex-locked-preview" aria-hidden="true">
        <div className="pl-ex-locked-preview-row"><div className="pl-ex-locked-preview-ico" /><div className="pl-ex-locked-preview-bar" /></div>
        <div className="pl-ex-locked-preview-row"><div className="pl-ex-locked-preview-ico" /><div className="pl-ex-locked-preview-bar" style={{ width: "70%" }} /></div>
        <div className="pl-ex-locked-preview-row"><div className="pl-ex-locked-preview-ico" /><div className="pl-ex-locked-preview-bar" style={{ width: "85%" }} /></div>
      </div>
      <div className="pl-ex-locked-content">
        <div className="pl-ex-locked-ico">{ICO.lock}</div>
        <div className="pl-ex-locked-title">Rutina de entrenamiento</div>
        <div className="pl-ex-locked-body">
          Desbloquea tu rutina semanal personalizada — fuerza, cardio y movilidad — sincronizada con tu plan de alimentación. Disponible en Premium.
        </div>
        <button className="pl-ex-locked-cta" onClick={onUpgrade}>
          Desbloquear en Premium
        </button>
      </div>
    </div>
  );
}

/* ─── ShoppingList ─── */
function ShoppingList({ list }) {
  if (!list || list.length === 0) {
    return <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-light)", fontSize: ".88rem", fontWeight: 300 }}>La lista de compras no está disponible para este plan.</div>;
  }
  return (
    <div>
      {list.map((sect, i) => (
        <div className="pl-shop-sect" key={i}>
          <div className="pl-shop-cat">{sect.category}</div>
          <ul className="pl-shop-list">
            {(sect.items || []).map((it, j) => (
              <li key={j} className="pl-shop-item">
                <span>{it.name}</span>
                <span className="pl-shop-item-qty">{it.quantity}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* ─── Helpers ─── */
function formatShortDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("es", { day: "numeric", month: "short" });
  } catch { return ""; }
}

function formatExerciseMeta(ex) {
  if (ex.type === "cardio" || ex.type === "flexibility" || ex.type === "hiit") {
    return `${ex.duration || 0} min`;
  }
  // strength
  const weightStr = ex.weight > 0 ? ` · ${ex.weight} kg` : "";
  return `${ex.sets || 0} sets × ${ex.reps || 0} reps${weightStr}`;
}

function computeTotals(meals) {
  return (meals || []).reduce((acc, m) => ({
    calories: acc.calories + (m.calories || 0),
    protein: acc.protein + (m.protein || 0),
    carbs: acc.carbs + (m.carbs || 0),
    fats: acc.fats + (m.fats || 0),
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
}
