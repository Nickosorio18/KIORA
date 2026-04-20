import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@context/AuthContext";
import { localDateISO } from "@utils/date";

/* ═══════════════════════════════════════════════════════
   KYŌRA — WeeklyPlanContext
   Persiste planes semanales del usuario en localStorage,
   scoped por user ID. Solo mantiene el plan ACTIVO + un
   archivo histórico de hasta 4 planes anteriores (para no
   bloatear el storage). Al cerrar sesión NO se borra —
   misma estrategia que MealsContext.

   Estructura de un plan:
   {
     id:              "wp_xxx",                      // unique
     createdAt:       "2026-04-14T...",              // ISO
     weekStartDate:   "2026-04-13",                  // ISO date (lunes)
     title:           "Plan de la semana · 13-19 abril",
     profileSnapshot: { objetivo, caloriesTarget, proteinTarget, ... },
     days: [
       {
         day: "lunes",
         date: "2026-04-13",
         totals: { calories, protein, carbs, fats },
         meals: [
           { id, label, time, name, description,
             calories, protein, carbs, fats,
             ingredients: [string], recipe?: string }
         ]
       },
       ...7 días
     ],
     shoppingList: [
       { category: "Frutas y verduras", items: [{ name, quantity }] }
     ],
     notes: "..."
   }
   ═══════════════════════════════════════════════════════ */

const WeeklyPlanContext = createContext(null);

const PLAN_KEY_BASE = "kyora.weeklyplan";
const ARCHIVE_KEY_BASE = "kyora.weeklyplan.archive";
const MAX_ARCHIVE = 8;

const keyFor = (base, userId) => (userId ? `${base}.${userId}` : `${base}.guest`);

// ── Helpers ──────────────────────────────────────────

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* quota / private browsing */ }
}

function remove(key) {
  try { localStorage.removeItem(key); } catch { /* noop */ }
}

let _idCounter = Date.now();
function uid(prefix = "wp") {
  return `${prefix}_${(++_idCounter).toString(36)}`;
}

function mondayOfThisWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return localDateISO(d);
}

// ── Provider ─────────────────────────────────────────

export function WeeklyPlanProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id || null;
  const planKey = keyFor(PLAN_KEY_BASE, userId);
  const archiveKey = keyFor(ARCHIVE_KEY_BASE, userId);

  const [currentPlan, setCurrentPlan] = useState(() => load(planKey, null));
  const [archive, setArchive] = useState(() => load(archiveKey, []));

  // Reload from storage when the auth user changes (login/logout)
  useEffect(() => {
    setCurrentPlan(load(planKey, null));
    setArchive(load(archiveKey, []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Persist on change
  useEffect(() => {
    if (currentPlan) save(planKey, currentPlan);
    else remove(planKey);
  }, [currentPlan, planKey]);

  useEffect(() => { save(archiveKey, archive); }, [archive, archiveKey]);

  // ── API ──

  /**
   * Reemplaza el plan activo. Si había uno previo, lo empuja al archivo.
   * El plan que llega debe tener `days`, `shoppingList`, etc. ya construidos.
   * Los IDs se asignan aquí si no vienen.
   */
  const savePlan = useCallback((plan) => {
    // Normaliza IDs para que todas las comidas del plan tengan uno estable
    const normalized = {
      id: plan.id || uid(),
      createdAt: plan.createdAt || new Date().toISOString(),
      weekStartDate: plan.weekStartDate || mondayOfThisWeek(),
      title: plan.title || "Plan semanal",
      profileSnapshot: plan.profileSnapshot || null,
      days: (plan.days || []).map((d) => ({
        ...d,
        meals: (d.meals || []).map((m) => ({ id: m.id || uid("m"), ...m })),
      })),
      // Rutina de ejercicio (opcional — solo Premium+)
      exerciseRoutine: Array.isArray(plan.exerciseRoutine)
        ? plan.exerciseRoutine.map((d) => ({
            ...d,
            exercises: (d.exercises || []).map((e) => ({ id: e.id || uid("e"), ...e })),
          }))
        : null,
      shoppingList: plan.shoppingList || [],
      notes: plan.notes || "",
      doneMealIds: plan.doneMealIds || [],
      doneExerciseIds: plan.doneExerciseIds || [],
    };

    setCurrentPlan((prev) => {
      // Empujar el anterior al archivo antes de reemplazar
      if (prev) {
        setArchive((arr) => [prev, ...arr].slice(0, MAX_ARCHIVE));
      }
      return normalized;
    });

    return normalized;
  }, []);

  const clearPlan = useCallback(() => {
    setCurrentPlan((prev) => {
      if (prev) setArchive((arr) => [prev, ...arr].slice(0, MAX_ARCHIVE));
      return null;
    });
  }, []);

  const toggleMealDone = useCallback((mealId) => {
    setCurrentPlan((prev) => {
      if (!prev) return prev;
      const set = new Set(prev.doneMealIds || []);
      if (set.has(mealId)) set.delete(mealId);
      else set.add(mealId);
      return { ...prev, doneMealIds: [...set] };
    });
  }, []);

  const toggleExerciseDone = useCallback((exerciseId) => {
    setCurrentPlan((prev) => {
      if (!prev) return prev;
      const set = new Set(prev.doneExerciseIds || []);
      if (set.has(exerciseId)) set.delete(exerciseId);
      else set.add(exerciseId);
      return { ...prev, doneExerciseIds: [...set] };
    });
  }, []);

  const restoreFromArchive = useCallback((planId) => {
    setArchive((arr) => {
      const found = arr.find((p) => p.id === planId);
      if (!found) return arr;
      setCurrentPlan((prev) => {
        if (prev) return prev; // no sobreescribir si hay activo
        return found;
      });
      return arr.filter((p) => p.id !== planId);
    });
  }, []);

  // ── Derived ──

  // ¿El plan actual es de ESTA semana?
  const isCurrentWeek = useMemo(() => {
    if (!currentPlan) return false;
    return currentPlan.weekStartDate === mondayOfThisWeek();
  }, [currentPlan]);

  return (
    <WeeklyPlanContext.Provider
      value={{
        currentPlan,
        archive,
        isCurrentWeek,
        savePlan,
        clearPlan,
        toggleMealDone,
        toggleExerciseDone,
        restoreFromArchive,
      }}
    >
      {children}
    </WeeklyPlanContext.Provider>
  );
}

export function useWeeklyPlan() {
  const ctx = useContext(WeeklyPlanContext);
  if (!ctx) throw new Error("useWeeklyPlan must be used within WeeklyPlanProvider");
  return ctx;
}

export { mondayOfThisWeek };
