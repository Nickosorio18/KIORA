import { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useMeals } from "@context/MealsContext";
import { useExercise } from "@context/ExerciseContext";
import { useWeeklyPlan } from "@context/WeeklyPlanContext";
import { useUser } from "@context/UserContext";

/* ═══════════════════════════════════════════════════════
   KYŌRA — ProgressPage
   Dashboard de progreso personal: rachas, adherencia al
   plan, macros promedio, charts semanales y logros.
   Toda la data viene de los contextos existentes —
   sin backend requerido.
   ═══════════════════════════════════════════════════════ */

const styles = `
/* ── Layout ── */
.prg{max-width:900px;margin:0 auto;padding:2.5rem 1.5rem 5rem;font-family:var(--font-b)}

/* ── Header ── */
.prg-head{margin-bottom:2.5rem}
.prg-objetivo{display:inline-flex;align-items:center;gap:.5rem;background:var(--gold-glow);color:var(--gold);font-size:.6rem;font-weight:500;letter-spacing:.18em;text-transform:uppercase;padding:.28rem .75rem;border-radius:30px;margin-bottom:1rem}
.prg-objetivo-dot{width:5px;height:5px;border-radius:50%;background:var(--gold);flex-shrink:0}
.prg-title{font-family:var(--font-d);font-size:2.2rem;font-weight:600;color:var(--text-dark);line-height:1.1;letter-spacing:-.01em;margin-bottom:.55rem}
.prg-title em{font-style:italic;color:var(--gold);font-weight:500}
.prg-lead{font-size:.92rem;font-weight:300;color:var(--text-muted);line-height:1.6;max-width:560px}

/* ── Stats row ── */
.prg-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:.85rem;margin-bottom:2rem}
.prg-stat{background:var(--white);border:1px solid var(--border);border-radius:var(--radius);padding:1.25rem 1.1rem;position:relative;overflow:hidden}
.prg-stat::after{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--gold);opacity:.35;border-radius:var(--radius) var(--radius) 0 0}
.prg-stat.highlight::after{opacity:1}
.prg-stat-icon{width:32px;height:32px;border-radius:8px;background:var(--gold-glow);color:var(--gold);display:flex;align-items:center;justify-content:center;margin-bottom:.85rem}
.prg-stat-val{font-family:var(--font-d);font-size:2rem;font-weight:600;color:var(--text-dark);line-height:1;margin-bottom:.2rem}
.prg-stat-val small{font-family:var(--font-b);font-size:.68rem;font-weight:300;color:var(--text-light);margin-left:.25rem}
.prg-stat-label{font-size:.62rem;font-weight:400;letter-spacing:.12em;text-transform:uppercase;color:var(--text-light)}

/* ── Section header ── */
.prg-section{margin-bottom:1.8rem}
.prg-section-title{font-family:var(--font-d);font-size:1.05rem;font-weight:600;color:var(--text-dark);margin-bottom:.2rem}
.prg-section-sub{font-size:.78rem;font-weight:300;color:var(--text-light);margin-bottom:1.1rem}

/* ── Week charts (side by side) ── */
.prg-charts{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:2rem}
.prg-chart-card{background:var(--white);border:1px solid var(--border);border-radius:var(--radius);padding:1.4rem}
.prg-chart-label{font-size:.6rem;font-weight:500;letter-spacing:.16em;text-transform:uppercase;color:var(--text-light);margin-bottom:1.1rem;display:flex;justify-content:space-between;align-items:center}
.prg-chart-label span{font-family:var(--font-d);font-size:.9rem;font-weight:600;color:var(--text-dark);letter-spacing:normal;text-transform:none}

/* Bar chart */
.prg-bars{display:flex;align-items:flex-end;gap:4px;height:80px;padding-bottom:0}
.prg-bar-wrap{flex:1;display:flex;flex-direction:column;align-items:center;gap:5px}
.prg-bar-track{width:100%;flex:1;display:flex;align-items:flex-end;position:relative}
.prg-bar{width:100%;border-radius:3px 3px 0 0;background:rgba(200,169,110,.18);transition:height .5s cubic-bezier(.22,1,.36,1);min-height:3px}
.prg-bar.filled{background:var(--gold)}
.prg-bar.today{background:var(--charcoal)}
.prg-bar.future{background:rgba(200,169,110,.07);min-height:0;height:0!important}
.prg-bar-day{font-size:.55rem;font-weight:400;color:var(--text-light);letter-spacing:.05em;text-transform:uppercase}
.prg-bar-day.today{color:var(--charcoal);font-weight:600}

/* Dot activity chart */
.prg-dots-row{display:flex;align-items:center;gap:4px;height:80px;align-items:center}
.prg-dot-wrap{flex:1;display:flex;flex-direction:column;align-items:center;gap:8px}
.prg-dot-circle{width:24px;height:24px;border-radius:50%;border:1.5px solid rgba(200,169,110,.2);display:flex;align-items:center;justify-content:center;transition:all .3s}
.prg-dot-circle.active{background:var(--gold);border-color:var(--gold)}
.prg-dot-circle.today-inactive{border-color:var(--charcoal);border-style:dashed}
.prg-dot-circle svg{opacity:.8}
.prg-dot-day{font-size:.55rem;font-weight:400;color:var(--text-light);letter-spacing:.05em;text-transform:uppercase}
.prg-dot-day.today{color:var(--charcoal);font-weight:600}

/* ── Adherencia ── */
.prg-adherencia{background:var(--white);border:1px solid var(--border);border-radius:var(--radius);padding:1.5rem;margin-bottom:2rem;display:grid;grid-template-columns:auto 1fr;gap:1.5rem;align-items:center}
.prg-ring-wrap{display:flex;flex-direction:column;align-items:center;gap:.4rem;flex-shrink:0}
.prg-ring{width:96px;height:96px;position:relative}
.prg-ring svg{transform:rotate(-90deg)}
.prg-ring-bg{fill:none;stroke:rgba(200,169,110,.1);stroke-width:8}
.prg-ring-fill{fill:none;stroke:var(--gold);stroke-width:8;stroke-linecap:round;transition:stroke-dashoffset .8s cubic-bezier(.22,1,.36,1)}
.prg-ring-text{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.1}
.prg-ring-pct{font-family:var(--font-d);font-size:1.35rem;font-weight:600;color:var(--text-dark)}
.prg-ring-lbl{font-size:.55rem;letter-spacing:.1em;text-transform:uppercase;color:var(--text-light)}
.prg-adh-info h4{font-family:var(--font-d);font-size:1rem;font-weight:600;color:var(--text-dark);margin-bottom:.3rem}
.prg-adh-info p{font-size:.82rem;font-weight:300;color:var(--text-muted);line-height:1.55;margin-bottom:.9rem}
.prg-adh-bars{display:flex;flex-direction:column;gap:.55rem}
.prg-adh-row{display:flex;align-items:center;gap:.75rem}
.prg-adh-row-label{font-size:.68rem;font-weight:400;color:var(--text-light);width:75px;flex-shrink:0;letter-spacing:.04em}
.prg-adh-track{flex:1;height:6px;background:rgba(200,169,110,.1);border-radius:3px;overflow:hidden}
.prg-adh-fill{height:100%;background:var(--gold);border-radius:3px;transition:width .8s cubic-bezier(.22,1,.36,1)}
.prg-adh-fill.exercise{background:var(--charcoal)}
.prg-adh-count{font-size:.7rem;font-weight:500;color:var(--text-dark);width:45px;text-align:right;flex-shrink:0}
.prg-no-plan{background:var(--white);border:1px dashed rgba(200,169,110,.2);border-radius:var(--radius);padding:1.5rem;margin-bottom:2rem;text-align:center}
.prg-no-plan p{font-size:.85rem;font-weight:300;color:var(--text-light);line-height:1.6}

/* ── Macros ── */
.prg-macros{background:var(--white);border:1px solid var(--border);border-radius:var(--radius);padding:1.4rem;margin-bottom:2rem}
.prg-macros-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem 1.5rem;margin-top:1rem}
.prg-macro{display:flex;flex-direction:column;gap:.4rem}
.prg-macro-head{display:flex;justify-content:space-between;align-items:baseline}
.prg-macro-name{font-size:.65rem;font-weight:500;letter-spacing:.12em;text-transform:uppercase;color:var(--text-light)}
.prg-macro-vals{font-size:.72rem;font-weight:400;color:var(--text-muted)}
.prg-macro-vals strong{font-weight:600;color:var(--text-dark)}
.prg-macro-track{height:7px;background:rgba(200,169,110,.08);border-radius:4px;overflow:hidden}
.prg-macro-fill{height:100%;border-radius:4px;transition:width .8s cubic-bezier(.22,1,.36,1)}
.prg-macro-fill.cals{background:var(--gold)}
.prg-macro-fill.protein{background:var(--charcoal)}
.prg-macro-fill.over{background:#c97070}

/* ── Logros ── */
.prg-logros{display:grid;grid-template-columns:repeat(4,1fr);gap:.75rem;margin-bottom:2rem}
.prg-logro{background:var(--white);border:1px solid var(--border);border-radius:var(--radius);padding:1.1rem;display:flex;flex-direction:column;align-items:center;gap:.5rem;text-align:center;transition:border-color .2s}
.prg-logro.unlocked{border-color:rgba(200,169,110,.3);background:linear-gradient(135deg,rgba(200,169,110,.04) 0%,var(--white) 100%)}
.prg-logro-icon{font-size:1.6rem;line-height:1;filter:grayscale(1) opacity(.25);transition:filter .3s}
.prg-logro.unlocked .prg-logro-icon{filter:none}
.prg-logro-name{font-size:.68rem;font-weight:500;color:var(--text-dark);line-height:1.3}
.prg-logro.locked .prg-logro-name{color:var(--text-light)}
.prg-logro-desc{font-size:.6rem;font-weight:300;color:var(--text-light);line-height:1.4}

/* ── Empty state ── */
.prg-empty{background:var(--white);border:1px dashed rgba(200,169,110,.2);border-radius:var(--radius);padding:2.5rem;text-align:center}
.prg-empty-icon{width:44px;height:44px;border-radius:12px;background:var(--gold-glow);color:var(--gold);display:flex;align-items:center;justify-content:center;margin:0 auto 1rem}
.prg-empty h3{font-family:var(--font-d);font-size:1.1rem;font-weight:600;color:var(--text-dark);margin-bottom:.4rem}
.prg-empty p{font-size:.82rem;font-weight:300;color:var(--text-light);line-height:1.6}

/* ── Responsive ── */
@media(max-width:700px){
  .prg-stats{grid-template-columns:1fr 1fr}
  .prg-charts{grid-template-columns:1fr}
  .prg-adherencia{grid-template-columns:1fr}
  .prg-logros{grid-template-columns:repeat(2,1fr)}
  .prg-macros-grid{grid-template-columns:1fr}
  .prg-title{font-size:1.75rem}
}
@media(max-width:420px){
  .prg-stats{grid-template-columns:1fr}
}
`;

const Ico = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);

const GOAL_LABELS = {
  lose: "Perder grasa", gain: "Ganar músculo", both: "Recomposición",
  health: "Comer mejor", energy: "Más energía", maintain: "Mantenerme",
};

const ACHIEVEMENTS = [
  { id: "week1",    icon: "🔥", name: "Primera semana",   desc: "7 días de racha",        req: (s) => s.mealStreak >= 7 },
  { id: "month1",   icon: "📅", name: "Primer mes",       desc: "30 días registrados",    req: (s) => s.totalMealDays >= 30 },
  { id: "steady",   icon: "⚡", name: "Constante",        desc: "14 días de racha",       req: (s) => s.mealStreak >= 14 },
  { id: "century",  icon: "🍽️", name: "Centenar",         desc: "100 comidas logueadas",  req: (s) => s.totalMealsDone >= 100 },
  { id: "athlete",  icon: "💪", name: "Atleta",           desc: "7 días de ejercicio",    req: (s) => s.exStreak >= 7 },
  { id: "active30", icon: "🏃", name: "Sin excusas",      desc: "30 días activos",        req: (s) => s.totalExDays >= 30 },
  { id: "legend",   icon: "👑", name: "Leyenda",          desc: "30 días de racha",       req: (s) => s.mealStreak >= 30 },
  { id: "planner",  icon: "📋", name: "Planificador",     desc: "Plan semanal generado",  req: (s) => s.hasEverHadPlan },
];

function uniqueDays(entries, doneField = "done") {
  const days = new Set(entries.filter((e) => e[doneField]).map((e) => e.date));
  return days.size;
}

export default function ProgressPage() {
  const { meals, streak, weekProgress } = useMeals();
  const { exercises, exerciseStreak, weekExerciseProgress } = useExercise();
  const { currentPlan, archive } = useWeeklyPlan();
  const { profile } = useUser();

  // ── Computed stats ────────────────────────────────────

  const stats = useMemo(() => {
    const mealsDone = meals.filter((m) => m.done);
    return {
      mealStreak:    streak,
      exStreak:      exerciseStreak,
      totalMealDays: uniqueDays(meals),
      totalExDays:   uniqueDays(exercises),
      totalMealsDone: mealsDone.length,
      hasEverHadPlan: !!(currentPlan || archive.length > 0),
    };
  }, [meals, exercises, streak, exerciseStreak, currentPlan, archive]);

  const achievements = useMemo(
    () => ACHIEVEMENTS.map((a) => ({ ...a, unlocked: a.req(stats) })),
    [stats]
  );
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  // ── Calories chart ─────────────────────────────────────
  const maxCal = useMemo(
    () => Math.max(...weekProgress.map((d) => d.cal), 1),
    [weekProgress]
  );
  const targetCal = useMemo(() => {
    if (currentPlan?.profileSnapshot?.caloriesTarget) return currentPlan.profileSnapshot.caloriesTarget;
    return null;
  }, [currentPlan]);

  // ── 7-day macro averages ───────────────────────────────
  const macroAvg = useMemo(() => {
    const last7 = (() => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 6);
      const cutStr = cutoff.toISOString().slice(0, 10);
      return meals.filter((m) => m.done && m.date >= cutStr);
    })();
    const days = new Set(last7.map((m) => m.date)).size || 1;
    const totalCal  = last7.reduce((s, m) => s + (m.calories || 0), 0);
    const totalProt = last7.reduce((s, m) => s + (m.protein || 0), 0);
    return {
      cals:   Math.round(totalCal / days),
      protein: Math.round(totalProt / days),
    };
  }, [meals]);

  const targetProtein = useMemo(() => {
    if (currentPlan?.profileSnapshot?.proteinTarget) return currentPlan.profileSnapshot.proteinTarget;
    if (profile?.peso) return Math.round(Number(profile.peso) * 1.6); // estimación estándar
    return null;
  }, [currentPlan, profile]);

  // ── Plan adherence ─────────────────────────────────────
  const adherence = useMemo(() => {
    if (!currentPlan) return null;
    const totalMeals = currentPlan.days.reduce((s, d) => s + (d.meals?.length || 0), 0);
    const doneMeals  = (currentPlan.doneMealIds || []).length;
    const totalEx    = currentPlan.days.reduce((s, d) => {
      const r = currentPlan.exerciseRoutine?.find((r) => r.date === d.date);
      return s + (r?.exercises?.length || 0);
    }, 0);
    const doneEx = (currentPlan.doneExerciseIds || []).length;
    return {
      mealPct:  totalMeals > 0 ? Math.round((doneMeals / totalMeals) * 100) : 0,
      exPct:    totalEx   > 0 ? Math.round((doneEx   / totalEx)    * 100) : 0,
      doneMeals, totalMeals,
      doneEx,   totalEx,
      overall:  totalMeals > 0 ? Math.round((doneMeals / totalMeals) * 100) : 0,
    };
  }, [currentPlan]);

  // ── Ring math ──────────────────────────────────────────
  const ringPct = adherence?.overall ?? 0;
  const RADIUS  = 38;
  const CIRC    = 2 * Math.PI * RADIUS;
  const offset  = CIRC - (ringPct / 100) * CIRC;

  const userName = profile?.nombre ? `, ${profile.nombre.split(" ")[0]}` : "";
  const objetivoLabel = profile?.objetivo ? GOAL_LABELS[profile.objetivo] : null;

  return (
    <>
      <Helmet>
        <title>Mi Progreso — KYŌRA</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <style>{styles}</style>
      <div className="prg">

        {/* ── Header ── */}
        <div className="prg-head">
          {objetivoLabel && (
            <div className="prg-objetivo">
              <div className="prg-objetivo-dot" />
              {objetivoLabel}
            </div>
          )}
          <h1 className="prg-title">Tu <em>progreso</em>, en perspectiva</h1>
          <p className="prg-lead">
            {stats.totalMealDays === 0
              ? "Aquí verás tu evolución a medida que registres comidas y completes tu plan semanal."
              : `Llevas ${stats.totalMealDays} día${stats.totalMealDays !== 1 ? "s" : ""} registrando tu alimentación${userName}. Esto es lo que muestra la data.`}
          </p>
        </div>

        {/* ── Stats row ── */}
        <div className="prg-stats">
          <div className={`prg-stat${streak >= 3 ? " highlight" : ""}`}>
            <div className="prg-stat-icon">
              <Ico d={<><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></>} />
            </div>
            <div className="prg-stat-val">{streak}<small>días</small></div>
            <div className="prg-stat-label">Racha comidas</div>
          </div>
          <div className={`prg-stat${exerciseStreak >= 3 ? " highlight" : ""}`}>
            <div className="prg-stat-icon">
              <Ico d={<><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 9 6.5 9 9"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 15 6.5 15 9"/><path d="M8 9h8"/><path d="M12 9v8"/><path d="M8 17h8"/></>} />
            </div>
            <div className="prg-stat-val">{exerciseStreak}<small>días</small></div>
            <div className="prg-stat-label">Racha ejercicio</div>
          </div>
          <div className="prg-stat">
            <div className="prg-stat-icon">
              <Ico d={<><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>} />
            </div>
            <div className="prg-stat-val">{stats.totalMealDays}<small>días</small></div>
            <div className="prg-stat-label">Días registrados</div>
          </div>
          <div className="prg-stat">
            <div className="prg-stat-icon">
              <Ico d={<><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z"/></>} />
            </div>
            <div className="prg-stat-val">{unlockedCount}<small>/ {ACHIEVEMENTS.length}</small></div>
            <div className="prg-stat-label">Logros</div>
          </div>
        </div>

        {/* ── Semana en vistazo ── */}
        <div className="prg-section">
          <div className="prg-section-title">Semana en vistazo</div>
          <div className="prg-section-sub">Esta semana — calorías consumidas y días de actividad</div>
        </div>

        <div className="prg-charts">
          {/* Calories bar chart */}
          <div className="prg-chart-card">
            <div className="prg-chart-label">
              Calorías
              <span>{macroAvg.cals > 0 ? `~${macroAvg.cals} prom.` : "Sin datos"}</span>
            </div>
            <div className="prg-bars">
              {weekProgress.map((d) => {
                const h = maxCal > 0 ? Math.max((d.cal / maxCal) * 100, d.cal > 0 ? 6 : 0) : 0;
                return (
                  <div key={d.date} className="prg-bar-wrap">
                    <div className="prg-bar-track">
                      <div
                        className={`prg-bar${d.isToday ? " today" : d.isFuture ? " future" : d.cal > 0 ? " filled" : ""}`}
                        style={{ height: `${h}%` }}
                      />
                    </div>
                    <div className={`prg-bar-day${d.isToday ? " today" : ""}`}>{d.day}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Exercise dot chart */}
          <div className="prg-chart-card">
            <div className="prg-chart-label">
              Actividad
              <span>{stats.totalExDays > 0 ? `${stats.totalExDays} días activos` : "Sin datos"}</span>
            </div>
            <div className="prg-dots-row">
              {weekExerciseProgress.map((d) => (
                <div key={d.date} className="prg-dot-wrap">
                  <div className={`prg-dot-circle${d.count > 0 && !d.isFuture ? " active" : d.isToday ? " today-inactive" : ""}`}>
                    {d.count > 0 && (
                      <Ico size={12} d={<><polyline points="20 6 9 17 4 12"/></>} />
                    )}
                  </div>
                  <div className={`prg-dot-day${d.isToday ? " today" : ""}`}>{d.day}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Adherencia al plan ── */}
        <div className="prg-section">
          <div className="prg-section-title">Adherencia al plan</div>
          <div className="prg-section-sub">Qué tan al pie de la letra estás siguiendo tu plan semanal</div>
        </div>

        {adherence ? (
          <div className="prg-adherencia">
            <div className="prg-ring-wrap">
              <div className="prg-ring">
                <svg width="96" height="96" viewBox="0 0 96 96">
                  <circle className="prg-ring-bg" cx="48" cy="48" r={RADIUS} />
                  <circle
                    className="prg-ring-fill"
                    cx="48" cy="48" r={RADIUS}
                    strokeDasharray={CIRC}
                    strokeDashoffset={offset}
                  />
                </svg>
                <div className="prg-ring-text">
                  <div className="prg-ring-pct">{ringPct}%</div>
                  <div className="prg-ring-lbl">plan</div>
                </div>
              </div>
            </div>
            <div className="prg-adh-info">
              <h4>
                {ringPct >= 80 ? "Excelente adherencia" :
                 ringPct >= 50 ? "Buen progreso" :
                 ringPct > 0  ? "Vas por buen camino" :
                 "Empieza a marcar comidas"}
              </h4>
              <p>
                {ringPct >= 80
                  ? "Estás siguiendo tu plan de manera consistente. Eso es lo que genera resultados reales."
                  : ringPct >= 50
                  ? "Más de la mitad del plan completado. Cada comida marcada cuenta."
                  : "Ve a tu Plan semanal y marca las comidas completadas para ver tu progreso aquí."}
              </p>
              <div className="prg-adh-bars">
                <div className="prg-adh-row">
                  <div className="prg-adh-row-label">Nutrición</div>
                  <div className="prg-adh-track">
                    <div className="prg-adh-fill" style={{ width: `${adherence.mealPct}%` }} />
                  </div>
                  <div className="prg-adh-count">{adherence.doneMeals}/{adherence.totalMeals}</div>
                </div>
                {adherence.totalEx > 0 && (
                  <div className="prg-adh-row">
                    <div className="prg-adh-row-label">Ejercicio</div>
                    <div className="prg-adh-track">
                      <div className="prg-adh-fill exercise" style={{ width: `${adherence.exPct}%` }} />
                    </div>
                    <div className="prg-adh-count">{adherence.doneEx}/{adherence.totalEx}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="prg-no-plan">
            <p>Genera tu plan semanal desde la sección <strong>Plan</strong> para ver tu adherencia aquí.</p>
          </div>
        )}

        {/* ── Macros promedio ── */}
        <div className="prg-section">
          <div className="prg-section-title">Macros — promedio 7 días</div>
          <div className="prg-section-sub">
            {macroAvg.cals === 0
              ? "Registra comidas con calorías para ver tu promedio"
              : "Basado en las comidas marcadas como completadas"}
          </div>
        </div>

        <div className="prg-macros">
          {macroAvg.cals === 0 ? (
            <div style={{ textAlign: "center", padding: "1rem 0" }}>
              <p style={{ fontSize: ".82rem", fontWeight: 300, color: "var(--text-light)" }}>
                Sin datos aún — marca comidas en tu plan o en el agente para ver tus macros aquí.
              </p>
            </div>
          ) : (
            <div className="prg-macros-grid">
              <div className="prg-macro">
                <div className="prg-macro-head">
                  <div className="prg-macro-name">Calorías</div>
                  <div className="prg-macro-vals">
                    <strong>{macroAvg.cals}</strong>
                    {targetCal ? ` / ${targetCal} meta` : " kcal prom."}
                  </div>
                </div>
                <div className="prg-macro-track">
                  <div
                    className={`prg-macro-fill cals${targetCal && macroAvg.cals > targetCal * 1.1 ? " over" : ""}`}
                    style={{ width: `${targetCal ? Math.min((macroAvg.cals / targetCal) * 100, 100) : 70}%` }}
                  />
                </div>
              </div>
              <div className="prg-macro">
                <div className="prg-macro-head">
                  <div className="prg-macro-name">Proteína</div>
                  <div className="prg-macro-vals">
                    <strong>{macroAvg.protein}g</strong>
                    {targetProtein ? ` / ${targetProtein}g meta` : " prom."}
                  </div>
                </div>
                <div className="prg-macro-track">
                  <div
                    className={`prg-macro-fill protein${targetProtein && macroAvg.protein > targetProtein * 1.15 ? " over" : ""}`}
                    style={{ width: `${targetProtein ? Math.min((macroAvg.protein / targetProtein) * 100, 100) : 60}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Logros ── */}
        <div className="prg-section">
          <div className="prg-section-title">Logros</div>
          <div className="prg-section-sub">{unlockedCount} de {ACHIEVEMENTS.length} desbloqueados</div>
        </div>

        <div className="prg-logros">
          {achievements.map((a) => (
            <div key={a.id} className={`prg-logro${a.unlocked ? " unlocked" : " locked"}`}>
              <div className="prg-logro-icon">{a.icon}</div>
              <div className="prg-logro-name">{a.name}</div>
              <div className="prg-logro-desc">{a.desc}</div>
            </div>
          ))}
        </div>

      </div>
    </>
  );
}
