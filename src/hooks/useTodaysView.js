import { useMemo, useCallback } from "react";
import { useWeeklyPlan } from "@context/WeeklyPlanContext";
import { useMeals } from "@context/MealsContext";
import { useExercise } from "@context/ExerciseContext";
import { useMidnightRefresh } from "@hooks/useMidnightRefresh";

/* ═══════════════════════════════════════════════════════
   KYŌRA — useTodaysView()
   Unifica la vista del día combinando:
   - Plan semanal activo (WeeklyPlanContext) → fuente principal si existe
   - Meals/Exercises manuales (Meals/ExerciseContext) → fallback + add-ons

   El Dashboard es "la pestaña de hoy" del plan. Si el usuario marca una
   comida aquí o en /app/plan, el estado queda sincronizado porque ambas
   vistas consumen el mismo contexto subyacente.

   Cada item tiene `source: "plan" | "manual"` para que el UI sepa:
   - Plan items: check + view-only (editar/borrar en Mi Semana)
   - Manual items: check + edit + delete
   ═══════════════════════════════════════════════════════ */

export function useTodaysView() {
  const weekly = useWeeklyPlan();
  const meals = useMeals();
  const exercise = useExercise();
  const todayStr = useMidnightRefresh();

  // ── 1. Localizar el día de hoy dentro del plan activo ──
  // Solo consideramos el plan como "de hoy" si:
  //   (a) existe un plan activo
  //   (b) alguno de sus days.date coincide con la fecha de hoy
  // Si el plan es de una semana anterior (y no se regeneró), hasActivePlan = false.
  const { todayMealsFromPlan, todayExercisesFromPlan, hasActivePlan } = useMemo(() => {
    const plan = weekly.currentPlan;
    if (!plan) return { todayMealsFromPlan: [], todayExercisesFromPlan: [], hasActivePlan: false };

    const dayEntry = (plan.days || []).find((d) => d.date === todayStr);
    const exEntry = (plan.exerciseRoutine || []).find((d) => d.date === todayStr);

    const doneMealsSet = new Set(plan.doneMealIds || []);
    const doneExSet = new Set(plan.doneExerciseIds || []);

    const mealsOut = (dayEntry?.meals || []).map((m) => ({
      id: m.id,
      source: "plan",
      label: m.label,
      name: m.name,
      time: m.time || "",
      calories: m.calories || 0,
      protein: m.protein || 0,
      done: doneMealsSet.has(m.id),
      // Info extra por si el UI quiere mostrarla al abrir detalle
      description: m.description,
      ingredients: m.ingredients,
      recipe: m.recipe,
    }));

    const exOut = (exEntry?.exercises || []).map((e) => ({
      id: e.id,
      source: "plan",
      name: e.name,
      sets: e.sets || 0,
      reps: e.reps || 0,
      weight: e.weight || 0,
      duration: e.duration || 0,
      type: e.type || "strength",
      muscle: e.muscle || "Full Body",
      notes: e.notes,
      done: doneExSet.has(e.id),
    }));

    return {
      todayMealsFromPlan: mealsOut,
      todayExercisesFromPlan: exOut,
      hasActivePlan: !!dayEntry,
    };
  }, [weekly.currentPlan, todayStr]);

  // ── 2. Items manuales de hoy (MealsContext/ExerciseContext) ──
  const manualMeals = useMemo(
    () => meals.todaysMeals.map((m) => ({ ...m, source: "manual" })),
    [meals.todaysMeals]
  );

  const manualExercises = useMemo(
    () => exercise.todaysExercises.map((e) => ({ ...e, source: "manual" })),
    [exercise.todaysExercises]
  );

  // ── 3. Merge + sort por hora ──
  const mergedMeals = useMemo(() => {
    return [...todayMealsFromPlan, ...manualMeals].sort((a, b) =>
      (a.time || "").localeCompare(b.time || "")
    );
  }, [todayMealsFromPlan, manualMeals]);

  const mergedExercises = useMemo(() => {
    return [...todayExercisesFromPlan, ...manualExercises];
  }, [todayExercisesFromPlan, manualExercises]);

  // ── 4. Toggles unificados — routean al contexto correcto ──
  const toggleMeal = useCallback(
    (id, source) => {
      if (source === "plan") weekly.toggleMealDone(id);
      else meals.toggleMealDone(id);
    },
    [weekly, meals]
  );

  const toggleExercise = useCallback(
    (id, source) => {
      if (source === "plan") weekly.toggleExerciseDone(id);
      else exercise.toggleExerciseDone(id);
    },
    [weekly, exercise]
  );

  // ── 5. Totals (solo items done, de ambas fuentes) ──
  const totals = useMemo(() => {
    return mergedMeals
      .filter((m) => m.done)
      .reduce(
        (acc, m) => ({
          calories: acc.calories + (m.calories || 0),
          protein: acc.protein + (m.protein || 0),
        }),
        { calories: 0, protein: 0 }
      );
  }, [mergedMeals]);

  // ── 6. Exercise stats ──
  const exerciseStats = useMemo(() => {
    const completed = mergedExercises.filter((e) => e.done).length;
    return {
      total: mergedExercises.length,
      completed,
      pct: mergedExercises.length
        ? Math.round((completed / mergedExercises.length) * 100)
        : 0,
    };
  }, [mergedExercises]);

  return {
    hasActivePlan,                  // ¿El plan semanal cubre hoy?
    hasPlanForWeek: !!weekly.currentPlan, // Hay plan pero puede no ser esta semana
    weeklyPlanTitle: weekly.currentPlan?.title || null,
    isCurrentWeek: weekly.isCurrentWeek,
    meals: mergedMeals,
    exercises: mergedExercises,
    toggleMeal,
    toggleExercise,
    totals,
    exerciseStats,
    // Conteos por source (para UI "según tu plan · 4 comidas · +1 manual")
    sourceCounts: {
      planMeals: todayMealsFromPlan.length,
      manualMeals: manualMeals.length,
      planExercises: todayExercisesFromPlan.length,
      manualExercises: manualExercises.length,
    },
  };
}
