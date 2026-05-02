import { useState, useMemo, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@context/AuthContext";
import { useUser } from "@context/UserContext";
import { usePantry } from "@context/PantryContext";
import { useMeals } from "@context/MealsContext";
import { useExercise } from "@context/ExerciseContext";
import { useTodaysView } from "@hooks/useTodaysView";
import { usePlan } from "@hooks/usePlan";
import { calculateTargets } from "@utils/nutritionTargets";
import Disclaimer from "@components/shared/Disclaimer";

/* ═══════════════════════════════════════════════════════
   KYŌRA — Dashboard del Usuario (Contenido principal)
   Sidebar vive en DashboardLayout (shared).
   Aquí solo va el contenido de <main>.
   ═══════════════════════════════════════════════════════ */

const DEFAULT_USER = { nombre: "Invitado", objetivo: "Bienestar general" };
const MEAL_LABELS = ["Desayuno", "Snack", "Comida", "Cena"];

const css = `
/* ═══ DASHBOARD CONTENT ═══ */
.dash-main{flex:1;overflow-y:auto;padding:2rem 2.5rem}
.dash-main::-webkit-scrollbar{width:4px}.dash-main::-webkit-scrollbar-thumb{background:var(--border);border-radius:4px}

.dash-header{margin-bottom:2rem}
.dash-date{font-size:.62rem;font-weight:400;letter-spacing:.2em;text-transform:uppercase;color:var(--text-light);margin-bottom:.3rem}
.dash-greeting{font-family:var(--font-d);font-size:1.8rem;font-weight:400;color:var(--charcoal)}
.dash-greeting em{font-style:italic;color:var(--gold)}

.stats-row{display:grid;grid-template-columns:repeat(5,1fr);gap:1rem;margin-bottom:2rem}
.stat-card{background:var(--white);border:1px solid var(--border);border-radius:var(--radius);padding:1.2rem 1.1rem;position:relative;overflow:hidden;transition:transform .3s,box-shadow .3s}
.stat-card:hover{border-color:rgba(200,169,110,.25);box-shadow:0 4px 16px rgba(200,169,110,.06)}
.stat-card::before{content:'';position:absolute;top:12px;left:0;bottom:12px;width:2.5px;border-radius:0 2px 2px 0}
.stat-card.gold::before{background:var(--gold)}
.stat-card.green::before{background:var(--green)}
.stat-card.blue::before{background:var(--blue-soft)}
.stat-card.red::before{background:var(--red-soft)}
.stat-card.purple::before{background:#9B8EC4}
.stat-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.6rem}
.stat-label{font-size:.6rem;font-weight:400;letter-spacing:.12em;text-transform:uppercase;color:var(--text-light)}
.stat-badge{font-size:.55rem;font-weight:500;padding:.15rem .5rem;border-radius:100px;letter-spacing:.05em}
.stat-badge.on-track{background:var(--green-light);color:var(--green)}
.stat-badge.behind{background:var(--red-light);color:var(--red-soft)}
.stat-badge.streak{background:var(--gold-glow);color:var(--gold)}
.stat-badge.exercise{background:rgba(155,142,196,.1);color:#9B8EC4}
.stat-val{font-family:var(--font-d);font-size:1.6rem;font-weight:600;color:var(--charcoal);line-height:1}
.stat-val span{font-size:.85rem;font-weight:400;color:var(--text-light)}
.stat-bar-bg{width:100%;height:3px;background:rgba(200,169,110,.08);border-radius:3px;margin-top:.6rem;overflow:hidden}
.stat-bar-fill{height:100%;border-radius:3px;transition:width .8s cubic-bezier(.4,0,.2,1)}
.stat-bar-fill.gold{background:var(--gold)}.stat-bar-fill.green{background:var(--green)}.stat-bar-fill.blue{background:var(--blue-soft)}.stat-bar-fill.purple{background:#9B8EC4}

/* Main grid: 3 columns */
.dash-grid{display:grid;grid-template-columns:1fr 1fr 300px;gap:1.5rem}

.card{background:var(--white);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden}
.card-head{display:flex;justify-content:space-between;align-items:center;padding:1.1rem 1.3rem;border-bottom:1px solid var(--border)}
.card-title{font-family:var(--font-d);font-size:1.05rem;font-weight:600;color:var(--charcoal)}
.card-action{font-size:.62rem;font-weight:400;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);cursor:pointer;transition:color .2s;background:none;border:none;font-family:var(--font-b)}
.card-action:hover{color:var(--charcoal)}

/* Meal list */
.meal-list{padding:.5rem 0}
.meal-item{display:flex;align-items:center;gap:1rem;padding:.7rem 1.3rem;transition:background .15s;cursor:default}
.meal-item:hover{background:rgba(200,169,110,.03)}
.meal-time{font-size:.65rem;font-weight:400;color:var(--text-light);width:38px;flex-shrink:0;letter-spacing:.03em}
.meal-check{width:18px;height:18px;border-radius:50%;border:1.5px solid var(--border);flex-shrink:0;display:flex;align-items:center;justify-content:center;color:transparent;transition:all .2s cubic-bezier(.34,1.56,.64,1)}
.meal-check:active{transform:scale(.85)}
.meal-check.done{background:var(--green);border-color:var(--green);color:var(--white);transform:scale(1)}
.meal-info{flex:1;min-width:0}
.meal-label{font-size:.6rem;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);margin-bottom:.1rem}
.meal-name{font-size:.82rem;font-weight:300;color:var(--text-dark);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.meal-cal{font-size:.72rem;color:var(--text-light);font-weight:300;flex-shrink:0}
.meal-item.from-plan{background:linear-gradient(90deg,rgba(200,169,110,.03) 0%,transparent 60%)}
.meal-src-chip{display:inline-block;margin-left:.5rem;padding:1px 6px;background:var(--gold-glow);color:var(--gold);font-size:.5rem;font-weight:500;letter-spacing:.08em;text-transform:uppercase;border-radius:3px;vertical-align:middle}
.card-src-badge{display:inline-flex;align-items:center;gap:.3rem;margin-left:.6rem;padding:2px 8px;background:var(--gold-glow);color:var(--gold);font-family:var(--font-b);font-size:.55rem;font-weight:500;letter-spacing:.1em;text-transform:uppercase;border-radius:3px;vertical-align:middle}
.card-cta-strip{display:flex;align-items:center;justify-content:space-between;gap:.8rem;padding:.65rem 1.3rem;background:linear-gradient(90deg,rgba(200,169,110,.06),rgba(200,169,110,.02));border-bottom:1px solid var(--border);font-size:.72rem;font-weight:300;color:var(--text-muted)}
.card-cta-btn{padding:.35rem .8rem;background:var(--gold);border:none;border-radius:3px;color:var(--charcoal);font-family:var(--font-b);font-size:.62rem;font-weight:500;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;transition:all .2s;white-space:nowrap}
.card-cta-btn:hover{background:var(--gold-light);transform:translateY(-1px)}
.item-goto{background:none;border:none;color:var(--gold);cursor:pointer;padding:.3rem;border-radius:3px;display:flex;align-items:center;justify-content:center;opacity:.6;transition:opacity .2s,background .2s}
.item-goto:hover{opacity:1;background:var(--gold-glow)}

/* Exercise list */
.ex-list{padding:.5rem 0}
.ex-item{display:flex;align-items:center;gap:.8rem;padding:.65rem 1.3rem;transition:background .15s;cursor:default}
.ex-item:hover{background:rgba(155,142,196,.03)}
.ex-check{width:18px;height:18px;border-radius:50%;border:1.5px solid rgba(155,142,196,.2);flex-shrink:0;display:flex;align-items:center;justify-content:center;color:transparent;transition:all .2s cubic-bezier(.34,1.56,.64,1);cursor:pointer}
.ex-check:active{transform:scale(.85)}
.ex-check.done{background:#9B8EC4;border-color:#9B8EC4;color:var(--white);transform:scale(1)}
.ex-info{flex:1;min-width:0}
.ex-name{font-size:.82rem;font-weight:400;color:var(--text-dark);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ex-detail{font-size:.65rem;font-weight:300;color:var(--text-light);margin-top:.1rem}
.ex-muscle{font-size:.58rem;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:#9B8EC4;flex-shrink:0}
.ex-type-badge{display:inline-flex;align-items:center;gap:.3rem;padding:.15rem .5rem;background:rgba(155,142,196,.06);border-radius:20px;font-size:.58rem;font-weight:400;color:#9B8EC4;margin-right:.5rem}
.empty-state{padding:2.5rem 1.5rem;text-align:center;display:flex;flex-direction:column;align-items:center;gap:.6rem}
.empty-state span{color:var(--text-light);font-size:.82rem;font-weight:300}
.empty-state .card-action{margin-top:.3rem}
.ex-routine-bar{padding:.6rem 1.3rem;background:rgba(155,142,196,.04);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:.6rem;font-size:.72rem;font-weight:300;color:var(--text-muted)}
.ex-routine-type{font-weight:500;color:#9B8EC4}

/* Right Column */
.right-col{display:flex;flex-direction:column;gap:1.5rem}

/* Agent Card */
.agent-card{background:var(--charcoal);border:none;border-radius:var(--radius);padding:1.5rem;position:relative;overflow:hidden}
.agent-card::before{content:'';position:absolute;top:-40px;right:-40px;width:120px;height:120px;background:radial-gradient(circle,rgba(200,169,110,.08) 0%,transparent 70%)}
.agent-top{display:flex;align-items:center;gap:.6rem;margin-bottom:1rem}
.agent-dot{width:7px;height:7px;border-radius:50%;box-shadow:0 0 6px rgba(122,158,126,.4)}
.agent-dot.online{background:var(--green)}
.agent-dot.locked{background:var(--red-soft);box-shadow:0 0 6px rgba(201,112,112,.4)}
.agent-status{font-size:.6rem;font-weight:300;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.35)}
.agent-card h3{font-family:var(--font-d);font-size:1.15rem;font-weight:500;color:var(--white);margin-bottom:.4rem}
.agent-card h3 em{font-style:italic;color:var(--gold-light)}
.agent-card p{font-size:.8rem;font-weight:300;color:rgba(255,255,255,.35);line-height:1.5;margin-bottom:1.2rem}
.agent-btn{display:block;width:100%;padding:.7rem;background:var(--gold);color:var(--charcoal);border:none;border-radius:3px;font-family:var(--font-b);font-size:.7rem;font-weight:500;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;transition:all .3s;text-align:center}
.agent-btn:hover{background:var(--gold-light);transform:translateY(-1px)}
.agent-btn.locked{background:rgba(255,255,255,.08);color:rgba(255,255,255,.25);cursor:default;transform:none}
.agent-btn.locked:hover{background:rgba(255,255,255,.08);transform:none}
.agent-upgrade{display:inline-block;margin-top:.6rem;font-size:.65rem;font-weight:400;letter-spacing:.08em;text-transform:uppercase;color:var(--gold-light);text-decoration:none;transition:color .2s}
.agent-upgrade:hover{color:var(--gold)}

/* Pantry Card */
.pantry-card{padding:1.3rem}
.pantry-card .card-title{margin-bottom:1rem;font-size:1rem}
.pantry-locs{display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-bottom:1rem}
.pantry-loc{display:flex;align-items:center;gap:.5rem;padding:.55rem .7rem;background:var(--cream);border-radius:4px;font-size:.75rem}
.pantry-loc-icon{font-size:.9rem}
.pantry-loc-text{flex:1}
.pantry-loc-name{font-weight:500;color:var(--charcoal);font-size:.72rem}
.pantry-loc-count{font-size:.6rem;color:var(--text-light);font-weight:300}
.pantry-btn{display:block;width:100%;padding:.6rem;background:transparent;border:1px solid var(--border);border-radius:3px;font-family:var(--font-b);font-size:.65rem;font-weight:400;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted);cursor:pointer;transition:all .3s;text-align:center}
.pantry-btn:hover{border-color:var(--gold);color:var(--gold);background:var(--gold-glow)}

/* Week Progress */
.week-card{padding:1.3rem}
.week-card .card-title{margin-bottom:1rem;font-size:1rem}
.week-bars{display:flex;gap:.5rem;align-items:flex-end;height:100px}
.week-bar{flex:1;display:flex;flex-direction:column;align-items:center;gap:.3rem}
.week-bar-track{width:100%;height:80px;background:rgba(200,169,110,.05);border-radius:3px;position:relative;overflow:hidden;display:flex;align-items:flex-end}
.week-bar-fill{width:100%;border-radius:3px;transition:height .6s cubic-bezier(.4,0,.2,1)}
.week-bar-fill.hit{background:var(--gold)}
.week-bar-fill.miss{background:rgba(200,169,110,.2)}
.week-bar-fill.today{background:linear-gradient(180deg,var(--gold),rgba(200,169,110,.3))}
.week-bar-fill.future{background:rgba(200,169,110,.06)}
.week-bar-day{font-size:.6rem;color:var(--text-light);font-weight:300}
.week-bar-day.today-label{color:var(--gold);font-weight:500}

/* Dual week bars (nutrition + exercise) */
.week-dual{display:flex;gap:.5rem;align-items:flex-end;height:100px}
.week-dual-bar{flex:1;display:flex;flex-direction:column;align-items:center;gap:.3rem}
.week-dual-tracks{width:100%;height:80px;display:flex;gap:2px}
.week-dual-track{flex:1;background:rgba(200,169,110,.05);border-radius:3px;overflow:hidden;display:flex;align-items:flex-end}
.week-dual-fill{width:100%;border-radius:3px;transition:height .6s cubic-bezier(.4,0,.2,1)}
.week-dual-fill.nutrition{background:var(--gold)}
.week-dual-fill.exercise{background:#9B8EC4}
.week-dual-fill.today-n{background:linear-gradient(180deg,var(--gold),rgba(200,169,110,.3))}
.week-dual-fill.today-e{background:linear-gradient(180deg,#9B8EC4,rgba(155,142,196,.3))}
.week-dual-fill.empty{background:rgba(200,169,110,.06)}
.week-legend{display:flex;gap:1rem;justify-content:center;margin-top:.8rem}
.week-legend-item{display:flex;align-items:center;gap:.3rem;font-size:.58rem;font-weight:300;color:var(--text-light)}
.week-legend-dot{width:6px;height:6px;border-radius:50%}
.week-legend-dot.n{background:var(--gold)}
.week-legend-dot.e{background:#9B8EC4}

/* Water +/- buttons */
.water-btn{background:none;border:1px solid var(--border);width:22px;height:22px;border-radius:50%;font-size:.9rem;line-height:1;color:var(--blue-soft);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;margin:0 .4rem;vertical-align:middle;transition:all .2s;font-family:var(--font-b)}
.water-btn:hover{border-color:var(--blue-soft);background:var(--blue-light)}

/* Item delete */
.item-del{background:none;border:none;color:var(--text-light);font-size:1rem;cursor:pointer;padding:0 .3rem;opacity:.3;transition:opacity .2s}
.item-del:hover{opacity:1;color:var(--red-soft)}
.item-edit{background:none;border:none;color:var(--text-light);cursor:pointer;padding:0 .25rem;opacity:.35;transition:opacity .2s,color .2s;display:inline-flex;align-items:center}
.item-edit:hover{opacity:1;color:var(--gold)}

/* Modal */
.modal-overlay{position:fixed;inset:0;background:rgba(26,26,30,.45);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:100;animation:modalBgIn .2s ease-out}
@keyframes modalBgIn{from{opacity:0}to{opacity:1}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.modal-box{background:var(--white);border:1px solid var(--border);border-radius:var(--radius);width:420px;max-width:92vw;box-shadow:0 20px 60px rgba(26,26,46,.12);animation:modalSlideUp .25s cubic-bezier(.22,1,.36,1);overflow:hidden}
@keyframes modalSlideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
.modal-head{display:flex;justify-content:space-between;align-items:center;padding:1.1rem 1.3rem;border-bottom:1px solid var(--border)}
.modal-close{background:none;border:none;font-size:1.2rem;color:var(--text-light);cursor:pointer;padding:0 .2rem}
.modal-close:hover{color:var(--text-dark)}
.modal-body{padding:1.3rem;display:flex;flex-direction:column;gap:.8rem}
.modal-label{display:flex;flex-direction:column;gap:.3rem;font-size:.65rem;font-weight:400;letter-spacing:.1em;text-transform:uppercase;color:var(--text-light);font-family:var(--font-b)}
.modal-label input,.modal-label select{font-family:var(--font-b);font-size:.85rem;font-weight:300;padding:.55rem .7rem;border:1px solid var(--border);border-radius:3px;background:var(--cream);color:var(--text-dark);outline:none;transition:border-color .2s;min-width:0;width:100%;box-sizing:border-box}
.modal-label input:focus,.modal-label select:focus{border-color:var(--gold)}
.modal-foot{display:flex;justify-content:flex-end;gap:.8rem;padding:1rem 1.3rem;border-top:1px solid var(--border)}

/* Confirm-delete modal */
.confirm-box{width:380px}
.confirm-box .modal-body{align-items:center;text-align:center;padding:1.6rem 1.3rem .8rem;gap:.6rem}
.confirm-icon{width:48px;height:48px;border-radius:50%;background:#FCE9E9;color:#C84A4A;display:flex;align-items:center;justify-content:center;margin-bottom:.3rem}
.confirm-title{font-family:var(--font-h);font-size:1.05rem;font-weight:600;color:var(--text-dark);margin:0;letter-spacing:.01em}
.confirm-desc{font-family:var(--font-b);font-size:.85rem;font-weight:300;color:var(--text-light);margin:0;line-height:1.5;max-width:280px}
.confirm-desc strong{color:var(--text-dark);font-weight:500}
.confirm-del-btn{font-family:var(--font-b);font-size:.8rem;font-weight:500;letter-spacing:.05em;padding:.55rem 1.2rem;border:none;border-radius:3px;background:#C84A4A;color:#fff;cursor:pointer;transition:background .2s}
.confirm-del-btn:hover{background:#A83A3A}
.confirm-del-btn:focus-visible{outline:2px solid #C84A4A;outline-offset:2px}

/* ── Entrance animations ── */
@keyframes statIn {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
.stat-card {
  animation: statIn .5s cubic-bezier(.22,1,.36,1) both;
}
.stat-card:nth-child(1) { animation-delay: .04s }
.stat-card:nth-child(2) { animation-delay: .1s }
.stat-card:nth-child(3) { animation-delay: .16s }
.stat-card:nth-child(4) { animation-delay: .22s }
.stat-card:nth-child(5) { animation-delay: .28s }

@keyframes cardIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
.card {
  animation: cardIn .55s cubic-bezier(.22,1,.36,1) both;
  animation-delay: .32s;
}
.dash-grid .card:nth-child(2) { animation-delay: .38s }
.right-col { animation: cardIn .55s cubic-bezier(.22,1,.36,1) both; animation-delay: .42s }

/* ── Improved greeting animation ── */
@keyframes headerIn {
  from { opacity: 0; transform: translateX(-8px); }
  to   { opacity: 1; transform: translateX(0); }
}
.dash-header { animation: headerIn .5s cubic-bezier(.22,1,.36,1) both; animation-delay: .02s; }

/* Modal grids — responsive */
.modal-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:.8rem}
.modal-grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:.8rem}

/* ═══ RESPONSIVE ═══ */
@media(max-width:1200px){
  .dash-grid{grid-template-columns:1fr 1fr}
  .right-col{grid-column:1/-1;flex-direction:row;flex-wrap:wrap}
  .right-col>*{flex:1;min-width:250px}
}
@media(max-width:900px){
  .dash-main{padding:1.5rem 1.2rem}
  .stats-row{grid-template-columns:repeat(3,1fr)}
  .dash-grid{grid-template-columns:1fr}
}
@media(max-width:600px){
  .stats-row{grid-template-columns:1fr 1fr}
  .dash-main{padding:1rem}
  .modal-grid-2,.modal-grid-3{grid-template-columns:1fr}
  .right-col{flex-direction:column!important}
  .right-col>*{min-width:0!important;flex:none!important;width:100%}
  .week-card{padding:1rem}
  .week-dual{height:80px;gap:.25rem}
  .week-dual-tracks{gap:1px}
  .week-bar-day{font-size:.52rem}
  .week-legend{gap:.6rem}
  .week-legend-item{font-size:.52rem}
}
@media(max-width:400px){
  .stats-row{grid-template-columns:1fr}
}
`;

function getDate() {
  const d = new Date();
  const days = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
  const months = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  return `${days[d.getDay()]}, ${d.getDate()} de ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function pct(current, target) {
  if (!target) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

function guessTime(label) {
  const map = { Desayuno: "08:00", Snack: "11:00", Comida: "14:00", Cena: "20:00" };
  return map[label] || "12:00";
}

export default function KyoraDashboard() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { profile } = useUser();
  const { getByLocation, LOCATIONS, totalCount } = usePantry();
  // MealsContext y ExerciseContext siguen existiendo para writes (add/update/remove)
  // de items manuales. Los reads de "hoy" se delegan a useTodaysView() que unifica
  // con el plan semanal activo.
  const { todaysWater, addMeal, updateMeal, removeMeal, addWater, removeWater, weekProgress, streak } = useMeals();
  const { todaysRoutine, setTodaysRoutine, addExercise, updateExercise, removeExercise, weekExerciseProgress, ROUTINE_TYPES, MUSCLE_GROUPS } = useExercise();
  // Vista unificada del día: plan semanal + manuales
  const todaysView = useTodaysView();
  const todaysMeals = todaysView.meals;
  const todaysTotals = todaysView.totals;
  const todaysExercises = todaysView.exercises;
  const todaysExerciseStats = {
    total: todaysView.exerciseStats.total,
    completed: todaysView.exerciseStats.completed,
    // estCalories lo dejamos en 0 por ahora — ExerciseContext lo calculaba,
    // pero con plan activo el cálculo es diferente. Futura iteración.
    estCalories: 0,
  };
  const plan = usePlan();
  const [showMealModal, setShowMealModal] = useState(false);
  const [showExModal, setShowExModal] = useState(false);
  const [mealForm, setMealForm] = useState({ label: "Desayuno", name: "", time: "", calories: "", protein: "" });
  const [exForm, setExForm] = useState({ name: "", sets: "", reps: "", weight: "", duration: "", type: "strength", muscle: "Full Body" });
  // Confirm-delete: { kind: "meal" | "exercise", id, name }
  const [confirmDelete, setConfirmDelete] = useState(null);
  // Track edit IDs (null = creating new)
  const [editingMealId, setEditingMealId] = useState(null);
  const [editingExId, setEditingExId] = useState(null);

  function openMealEdit(m) {
    setEditingMealId(m.id);
    setMealForm({
      label: m.label || "Desayuno",
      name: m.name || "",
      time: m.time || "",
      calories: m.calories?.toString() || "",
      protein: m.protein?.toString() || "",
    });
    setShowMealModal(true);
  }
  function openExerciseEdit(ex) {
    setEditingExId(ex.id);
    setExForm({
      name: ex.name || "",
      sets: ex.sets?.toString() || "",
      reps: ex.reps?.toString() || "",
      weight: ex.weight?.toString() || "",
      duration: ex.duration?.toString() || "",
      type: ex.type || "strength",
      muscle: ex.muscle || "Full Body",
    });
    setShowExModal(true);
  }
  function closeMealModal() {
    setShowMealModal(false);
    setEditingMealId(null);
    setMealForm({ label: "Desayuno", name: "", time: "", calories: "", protein: "" });
  }
  function closeExModal() {
    setShowExModal(false);
    setEditingExId(null);
    setExForm({ name: "", sets: "", reps: "", weight: "", duration: "", type: "strength", muscle: "Full Body" });
  }

  const handleConfirmDelete = () => {
    if (!confirmDelete) return;
    if (confirmDelete.kind === "meal") removeMeal(confirmDelete.id);
    else if (confirmDelete.kind === "exercise") removeExercise(confirmDelete.id);
    setConfirmDelete(null);
  };

  // Close any open modal with Esc
  useEffect(() => {
    if (!confirmDelete && !showMealModal && !showExModal) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (confirmDelete) setConfirmDelete(null);
        else if (showMealModal) closeMealModal();
        else if (showExModal) closeExModal();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmDelete, showMealModal, showExModal]);

  // Hooks must run unconditionally — before any early return
  const USER = useMemo(() => {
    const nombre = profile?.nombre || DEFAULT_USER.nombre;
    const objetivo = profile?.objetivo || DEFAULT_USER.objetivo;
    let dias = 1;
    const createdAt = session?.user?.created_at;
    if (createdAt) {
      const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
      dias = Math.max(1, diff + 1);
    }
    return { nombre, objetivo, diasActivo: dias };
  }, [profile, session]);

  const PANTRY_SUMMARY = useMemo(() => ({
    total: totalCount,
    locations: LOCATIONS.map((loc) => ({
      id: loc.id, name: loc.label, icon: loc.icon, count: getByLocation(loc.id).length,
    })),
  }), [LOCATIONS, totalCount, getByLocation]);

  const targets = useMemo(() => calculateTargets(profile), [profile]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Buenos días";
    if (h < 19) return "Buenas tardes";
    return "Buenas noches";
  }, []);

  if (!profile?.edad || !profile?.peso) {
    return <Navigate to="/app/onboarding" replace />;
  }

  // Todos los planes KYŌRA (esencial+) incluyen acceso al agente.
  // Cuando Stripe esté activo: !plan.canUse(FEATURES.AGENT_MESSAGES_PER_MONTH)
  const agentLocked = false;

  function handleAddMeal(e) {
    e.preventDefault();
    if (!mealForm.name.trim()) return;
    const payload = {
      label: mealForm.label,
      name: mealForm.name.trim(),
      time: mealForm.time || guessTime(mealForm.label),
      calories: parseInt(mealForm.calories, 10) || 0,
      protein: parseInt(mealForm.protein, 10) || 0,
    };
    if (editingMealId) {
      updateMeal(editingMealId, payload);
    } else {
      addMeal({ ...payload, done: false });
    }
    closeMealModal();
  }

  function handleAddExercise(e) {
    e.preventDefault();
    if (!exForm.name.trim()) return;
    const isCardio = exForm.type === "cardio" || exForm.type === "flexibility";
    const payload = {
      name: exForm.name.trim(),
      sets: isCardio ? 0 : (parseInt(exForm.sets, 10) || 0),
      reps: isCardio ? 0 : (parseInt(exForm.reps, 10) || 0),
      weight: isCardio ? 0 : (parseFloat(exForm.weight) || 0),
      duration: parseInt(exForm.duration, 10) || 0,
      type: exForm.type,
      muscle: exForm.muscle,
    };
    if (editingExId) {
      updateExercise(editingExId, payload);
    } else {
      addExercise({ ...payload, done: false });
      // Set today's routine type if not set yet
      if (!todaysRoutine) {
        const rt = ROUTINE_TYPES.find(r => r.id === exForm.type);
        setTodaysRoutine({ type: exForm.type, label: rt?.label || exForm.type, muscle: exForm.muscle });
      }
    }
    closeExModal();
  }

  const calPct = pct(todaysTotals.calories, targets.calTarget);
  const protPct = pct(todaysTotals.protein, targets.protTarget);
  const waterPct = pct(todaysWater, targets.waterTarget);
  const exPct = todaysExerciseStats.total > 0 ? pct(todaysExerciseStats.completed, todaysExerciseStats.total) : 0;
  const isCardioType = exForm.type === "cardio" || exForm.type === "flexibility";

  return (
    <>
      <style>{css}</style>
      <main className="dash-main">
        {/* Header */}
        <div className="dash-header">
          <div className="dash-date">{getDate()}</div>
          <h1 className="dash-greeting">{greeting}, <em>{USER.nombre}</em></h1>
        </div>

        {/* Stats — 5 columnas */}
        <div className="stats-row">
          <div className="stat-card gold">
            <div className="stat-top">
              <span className="stat-label">Calorías</span>
              <span className={`stat-badge ${calPct >= 80 ? "on-track" : "behind"}`}>{calPct >= 80 ? "En meta" : `${calPct}%`}</span>
            </div>
            <div className="stat-val">{todaysTotals.calories} <span>/ {targets.calTarget}</span></div>
            <div className="stat-bar-bg"><div className="stat-bar-fill gold" style={{ width: `${calPct}%` }} /></div>
          </div>
          <div className="stat-card green">
            <div className="stat-top">
              <span className="stat-label">Proteína</span>
              <span className={`stat-badge ${protPct >= 80 ? "on-track" : "behind"}`}>{protPct >= 80 ? "En meta" : `${protPct}%`}</span>
            </div>
            <div className="stat-val">{todaysTotals.protein}g <span>/ {targets.protTarget}g</span></div>
            <div className="stat-bar-bg"><div className="stat-bar-fill green" style={{ width: `${protPct}%` }} /></div>
          </div>
          <div className="stat-card blue">
            <div className="stat-top">
              <span className="stat-label">Agua</span>
              <span className={`stat-badge ${waterPct >= 75 ? "on-track" : "behind"}`}>{todaysWater}/{targets.waterTarget}</span>
            </div>
            <div className="stat-val">
              <button className="water-btn" onClick={removeWater} title="Quitar vaso">−</button>
              {todaysWater} <span>/ {targets.waterTarget}</span>
              <button className="water-btn" onClick={addWater} title="Agregar vaso">+</button>
            </div>
            <div className="stat-bar-bg"><div className="stat-bar-fill blue" style={{ width: `${waterPct}%` }} /></div>
          </div>
          <div className="stat-card purple">
            <div className="stat-top">
              <span className="stat-label">Ejercicio</span>
              <span className={`stat-badge ${exPct >= 80 ? "on-track" : "exercise"}`}>{todaysExerciseStats.completed}/{todaysExerciseStats.total}</span>
            </div>
            <div className="stat-val">{todaysExerciseStats.completed} <span>/ {todaysExerciseStats.total} ejer.</span></div>
            <div className="stat-bar-bg"><div className="stat-bar-fill purple" style={{ width: `${exPct}%` }} /></div>
          </div>
          <div className="stat-card red">
            <div className="stat-top">
              <span className="stat-label">Racha</span>
              <span className="stat-badge streak">{streak > 0 ? "Activa" : "—"}</span>
            </div>
            <div className="stat-val">{streak} <span>días</span></div>
          </div>
        </div>

        {/* Grid: Nutrición + Ejercicio + Sidebar */}
        <div className="dash-grid">
          {/* ── Col 1: Plan de comidas ── */}
          <div className="card">
            <div className="card-head">
              <span className="card-title">
                Nutrición de Hoy
                {todaysView.hasActivePlan && (
                  <span className="card-src-badge" title="Las comidas vienen del plan semanal activo">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Plan semanal
                  </span>
                )}
              </span>
              <button className="card-action" onClick={() => setShowMealModal(true)}>+ Agregar</button>
            </div>
            {!todaysView.hasActivePlan && plan.canGenerateWeeklyPlan && (
              <div className="card-cta-strip">
                <span>Tu primera semana está a 30 segundos.</span>
                <button className="card-cta-btn" onClick={() => navigate("/app/plan")}>Generar plan →</button>
              </div>
            )}
            <div className="meal-list">
              {todaysMeals.length === 0 && (
                <div className="empty-state">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(200,169,110,.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>
                  <span>Sin comidas registradas hoy</span>
                  <button className="card-action" onClick={() => setShowMealModal(true)}>Registrar primera comida</button>
                </div>
              )}
              {todaysMeals.map((m) => (
                <div className={`meal-item${m.source === "plan" ? " from-plan" : ""}`} key={`${m.source}-${m.id}`}>
                  <span className="meal-time">{m.time}</span>
                  <div className={`meal-check${m.done ? " done" : ""}`} onClick={() => todaysView.toggleMeal(m.id, m.source)} style={{ cursor: "pointer" }}>{m.done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}</div>
                  <div className="meal-info">
                    <div className="meal-label">{m.label}{m.source === "plan" && <span className="meal-src-chip" title="Del plan semanal">plan</span>}</div>
                    <div className="meal-name">{m.name}</div>
                  </div>
                  <span className="meal-cal">{m.calories} kcal</span>
                  {m.source === "manual" && (
                    <>
                      <button className="item-edit" onClick={() => openMealEdit(m)} title="Editar" aria-label={`Editar ${m.name}`}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                      </button>
                      <button className="item-del" onClick={() => setConfirmDelete({ kind: "meal", id: m.id, name: m.name })} title="Eliminar" aria-label={`Eliminar ${m.name}`}>×</button>
                    </>
                  )}
                  {m.source === "plan" && (
                    <button className="item-goto" onClick={() => navigate("/app/plan")} title="Ver detalle en Mi Semana" aria-label="Ver en Mi Semana">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7"/><path d="M8 7h9v9"/></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Col 2: Entrenamiento ── */}
          <div className="card">
            <div className="card-head">
              <span className="card-title">
                Entrenamiento de Hoy
                {todaysView.sourceCounts.planExercises > 0 && (
                  <span className="card-src-badge" title="Rutina del plan semanal Premium">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Plan semanal
                  </span>
                )}
              </span>
              <button className="card-action" onClick={() => setShowExModal(true)}>+ Agregar</button>
            </div>
            {todaysRoutine && (
              <div className="ex-routine-bar">
                <span className="ex-routine-type">{todaysRoutine.label}</span>
                <span>· {todaysRoutine.muscle}</span>
                {todaysExerciseStats.estCalories > 0 && <span>· ~{todaysExerciseStats.estCalories} kcal</span>}
              </div>
            )}
            <div className="ex-list">
              {todaysExercises.length === 0 && (
                <div className="empty-state">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(155,142,196,.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.4 14.4L9.6 9.6"/><path d="M18.657 5.343a8 8 0 1 1-13.314 0"/><path d="M9.6 9.6L4 8"/><path d="M14.4 14.4L20 16"/></svg>
                  <span>Sin ejercicios registrados hoy</span>
                  <button className="card-action" onClick={() => setShowExModal(true)}>Agregar primer ejercicio</button>
                </div>
              )}
              {todaysExercises.map((ex) => {
                const isCardio = ex.type === "cardio" || ex.type === "flexibility";
                return (
                  <div className={`ex-item${ex.source === "plan" ? " from-plan" : ""}`} key={`${ex.source}-${ex.id}`}>
                    <div className={`ex-check${ex.done ? " done" : ""}`} onClick={() => todaysView.toggleExercise(ex.id, ex.source)}>{ex.done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}</div>
                    <div className="ex-info">
                      <div className="ex-name">{ex.name}</div>
                      <div className="ex-detail">
                        {isCardio
                          ? `${ex.duration} min`
                          : `${ex.sets}×${ex.reps}${ex.weight > 0 ? ` · ${ex.weight}kg` : ""}${ex.duration > 0 ? ` · ${ex.duration}min` : ""}`
                        }
                      </div>
                    </div>
                    <span className="ex-muscle">{ex.muscle}</span>
                    {ex.source === "manual" && (
                      <>
                        <button className="item-edit" onClick={() => openExerciseEdit(ex)} title="Editar" aria-label={`Editar ${ex.name}`}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                        </button>
                        <button className="item-del" onClick={() => setConfirmDelete({ kind: "exercise", id: ex.id, name: ex.name })} title="Eliminar" aria-label={`Eliminar ${ex.name}`}>×</button>
                      </>
                    )}
                    {ex.source === "plan" && (
                      <button className="item-goto" onClick={() => navigate("/app/plan")} title="Ver detalle en Mi Semana" aria-label="Ver en Mi Semana">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7"/><path d="M8 7h9v9"/></svg>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Col 3: Sidebar derecho ── */}
          <div className="right-col">
            {/* Agent CTA */}
            <div className="agent-card">
              <div className="agent-top">
                <span className={`agent-dot ${agentLocked ? "locked" : "online"}`} />
                <span className="agent-status">{agentLocked ? "Plan Free" : "Disponible"}</span>
              </div>
              <h3>Coach <em>KYŌRA</em></h3>
              {agentLocked ? (
                <>
                  <p>Tu coach te está esperando. En Avanzado, tienes acceso ilimitado al agente que crea tus planes, ajusta tus macros y responde cuando lo necesitas.</p>
                  <button className="agent-btn locked" disabled>No disponible en Free</button>
                  <a href="#" className="agent-upgrade" onClick={(e) => e.preventDefault()}>Ver planes y precios →</a>
                </>
              ) : (
                <>
                  <p>
                    {PANTRY_SUMMARY.total > 0
                      ? `Tu coach conoce los ${PANTRY_SUMMARY.total} ingredientes de tu despensa.`
                      : "Coach nutricional listo para ayudarte."}
                  </p>
                  <button className="agent-btn" onClick={() => navigate('/app/agent')}>Abrir Chat →</button>
                </>
              )}
            </div>

            {/* Pantry */}
            <div className="card pantry-card">
              <div className="card-title">
                Mi Despensa
                <span style={{ fontSize: '.65rem', fontWeight: 400, color: 'var(--text-light)', marginLeft: '.5rem' }}>
                  {PANTRY_SUMMARY.total} ingrediente{PANTRY_SUMMARY.total !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="pantry-locs">
                {PANTRY_SUMMARY.locations.map((l) => (
                  <div className="pantry-loc" key={l.id}>
                    <span className="pantry-loc-icon">{l.icon}</span>
                    <div className="pantry-loc-text">
                      <div className="pantry-loc-name">{l.name}</div>
                      <div className="pantry-loc-count">{l.count} items</div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="pantry-btn" onClick={() => navigate('/app/pantry')}>
                {PANTRY_SUMMARY.total > 0 ? 'Actualizar despensa' : 'Agregar ingredientes'}
              </button>
            </div>

            {/* Week Progress (dual bars) */}
            <div className="card week-card">
              <div className="card-title">Esta Semana</div>
              <div className="week-dual">
                {weekProgress.map((d, i) => {
                  const exDay = weekExerciseProgress[i];
                  const nH = targets.calTarget > 0 ? Math.max(4, (d.cal / targets.calTarget) * 100) : 4;
                  const eH = exDay?.count > 0 ? Math.max(15, Math.min(100, exDay.count * 20)) : 4;
                  return (
                    <div className="week-dual-bar" key={i}>
                      <div className="week-dual-tracks">
                        <div className="week-dual-track">
                          <div
                            className={`week-dual-fill ${d.isToday ? "today-n" : d.isFuture ? "empty" : d.cal > 0 ? "nutrition" : "empty"}`}
                            style={{ height: `${d.isFuture ? 4 : d.cal === 0 && !d.isToday ? 4 : Math.min(100, nH)}%` }}
                          />
                        </div>
                        <div className="week-dual-track">
                          <div
                            className={`week-dual-fill ${d.isToday ? "today-e" : d.isFuture ? "empty" : exDay?.count > 0 ? "exercise" : "empty"}`}
                            style={{ height: `${d.isFuture ? 4 : exDay?.count === 0 && !d.isToday ? 4 : Math.min(100, eH)}%` }}
                          />
                        </div>
                      </div>
                      <span className={`week-bar-day${d.isToday ? " today-label" : ""}`}>{d.day}</span>
                    </div>
                  );
                })}
              </div>
              <div className="week-legend">
                <div className="week-legend-item"><span className="week-legend-dot n" /> Nutrición</div>
                <div className="week-legend-item"><span className="week-legend-dot e" /> Ejercicio</div>
              </div>
            </div>
          </div>
        </div>

        <Disclaimer variant="footer" />
      </main>

      {/* ═══ Meal Entry Modal ═══ */}
      {showMealModal && (
        <div className="modal-overlay" onClick={closeMealModal}>
          <form className="modal-box" onClick={(e) => e.stopPropagation()} onSubmit={handleAddMeal}>
            <div className="modal-head">
              <span className="card-title">{editingMealId ? "Editar Comida" : "Registrar Comida"}</span>
              <button type="button" className="modal-close" onClick={closeMealModal}>×</button>
            </div>
            <div className="modal-body">
              <label className="modal-label">
                Tipo
                <select value={mealForm.label} onChange={(e) => setMealForm((f) => ({ ...f, label: e.target.value }))}>
                  {MEAL_LABELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </label>
              <label className="modal-label">
                Descripción
                <input type="text" placeholder="Ej. Avena con plátano y nueces" value={mealForm.name} onChange={(e) => setMealForm((f) => ({ ...f, name: e.target.value }))} autoFocus />
              </label>
              <label className="modal-label">
                Hora
                <input type="time" value={mealForm.time} onChange={(e) => setMealForm((f) => ({ ...f, time: e.target.value }))} />
              </label>
              <div className="modal-grid-2">
                <label className="modal-label">
                  Calorías (kcal)
                  <input type="number" min="0" placeholder="420" value={mealForm.calories} onChange={(e) => setMealForm((f) => ({ ...f, calories: e.target.value }))} />
                </label>
                <label className="modal-label">
                  Proteína (g)
                  <input type="number" min="0" placeholder="25" value={mealForm.protein} onChange={(e) => setMealForm((f) => ({ ...f, protein: e.target.value }))} />
                </label>
              </div>
            </div>
            <div className="modal-foot">
              <button type="button" className="pantry-btn" onClick={closeMealModal}>Cancelar</button>
              <button type="submit" className="agent-btn" style={{ width: "auto", padding: ".6rem 1.5rem" }}>{editingMealId ? "Actualizar" : "Guardar"}</button>
            </div>
          </form>
        </div>
      )}

      {/* ═══ Exercise Entry Modal ═══ */}
      {showExModal && (
        <div className="modal-overlay" onClick={closeExModal}>
          <form className="modal-box" onClick={(e) => e.stopPropagation()} onSubmit={handleAddExercise}>
            <div className="modal-head">
              <span className="card-title">{editingExId ? "Editar Ejercicio" : "Agregar Ejercicio"}</span>
              <button type="button" className="modal-close" onClick={closeExModal}>×</button>
            </div>
            <div className="modal-body">
              <label className="modal-label">
                Ejercicio
                <input type="text" placeholder="Ej. Press de banca, Sentadillas, Correr" value={exForm.name} onChange={(e) => setExForm((f) => ({ ...f, name: e.target.value }))} autoFocus />
              </label>
              <div className="modal-grid-2">
                <label className="modal-label">
                  Tipo
                  <select value={exForm.type} onChange={(e) => setExForm((f) => ({ ...f, type: e.target.value }))}>
                    {ROUTINE_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </label>
                <label className="modal-label">
                  Músculo
                  <select value={exForm.muscle} onChange={(e) => setExForm((f) => ({ ...f, muscle: e.target.value }))}>
                    {MUSCLE_GROUPS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </label>
              </div>
              {!isCardioType && (
                <div className="modal-grid-3">
                  <label className="modal-label">
                    Series
                    <input type="number" min="0" placeholder="4" value={exForm.sets} onChange={(e) => setExForm((f) => ({ ...f, sets: e.target.value }))} />
                  </label>
                  <label className="modal-label">
                    Repeticiones
                    <input type="number" min="0" placeholder="12" value={exForm.reps} onChange={(e) => setExForm((f) => ({ ...f, reps: e.target.value }))} />
                  </label>
                  <label className="modal-label">
                    Peso (kg)
                    <input type="number" min="0" step="0.5" placeholder="20" value={exForm.weight} onChange={(e) => setExForm((f) => ({ ...f, weight: e.target.value }))} />
                  </label>
                </div>
              )}
              <label className="modal-label">
                Duración (min) {!isCardioType && <span style={{ fontWeight: 300, textTransform: "none", letterSpacing: 0 }}>(opcional)</span>}
                <input type="number" min="0" placeholder={isCardioType ? "30" : "0"} value={exForm.duration} onChange={(e) => setExForm((f) => ({ ...f, duration: e.target.value }))} />
              </label>
            </div>
            <div className="modal-foot">
              <button type="button" className="pantry-btn" onClick={closeExModal}>Cancelar</button>
              <button type="submit" className="agent-btn" style={{ width: "auto", padding: ".6rem 1.5rem", background: "#9B8EC4", color: "#fff" }}>{editingExId ? "Actualizar" : "Guardar"}</button>
            </div>
          </form>
        </div>
      )}

      {/* ═══ Confirm Delete Modal ═══ */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-box confirm-box" onClick={(e) => e.stopPropagation()} role="alertdialog" aria-labelledby="cd-title">
            <div className="modal-body">
              <div className="confirm-icon" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                </svg>
              </div>
              <h3 id="cd-title" className="confirm-title">¿Eliminar {confirmDelete.kind === "meal" ? "esta comida" : "este ejercicio"}?</h3>
              <p className="confirm-desc">
                {confirmDelete.name ? <strong>{confirmDelete.name}</strong> : null}
                {confirmDelete.name ? " — " : ""}Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="modal-foot">
              <button type="button" className="pantry-btn" onClick={() => setConfirmDelete(null)} autoFocus>Cancelar</button>
              <button type="button" className="confirm-del-btn" onClick={handleConfirmDelete}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
