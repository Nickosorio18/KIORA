import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@context/AuthContext";
import { useMidnightRefresh } from "@hooks/useMidnightRefresh";
import { localDateISO } from "@utils/date";

/* ═══════════════════════════════════════════════════════
   KYŌRA — MealsContext
   Persiste comidas y agua en localStorage, scoped por user ID.
   Al cerrar sesión NO se borra la data — así al volver a
   entrar el usuario recupera su dashboard intacto.
   ═══════════════════════════════════════════════════════ */

const MealsContext = createContext(null);

const MEALS_KEY_BASE = "kyora.meals";
const WATER_KEY_BASE = "kyora.water";
const MAX_MEALS = 500; // evitar bloat en localStorage

const keyFor = (base, userId) => (userId ? `${base}.${userId}` : `${base}.guest`);

// ── Helpers ──────────────────────────────────────────

function today() {
  return localDateISO();
}

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
  } catch {
    /* quota / private browsing */
  }
}

let _idCounter = Date.now();
function uid() {
  return (++_idCounter).toString(36);
}

// ── Provider ─────────────────────────────────────────

export function MealsProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id || null;
  const todayStr = useMidnightRefresh();
  const mealsKey = keyFor(MEALS_KEY_BASE, userId);
  const waterKey = keyFor(WATER_KEY_BASE, userId);

  const [meals, setMeals] = useState(() => load(mealsKey, []));
  const [water, setWater] = useState(() => load(waterKey, {}));

  // Reload from storage when the auth user changes (login/logout/switch account)
  useEffect(() => {
    setMeals(load(mealsKey, []));
    setWater(load(waterKey, {}));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => { save(mealsKey, meals); }, [meals, mealsKey]);
  useEffect(() => { save(waterKey, water); }, [water, waterKey]);

  // ── Meal CRUD ──

  const addMeal = useCallback((meal) => {
    const entry = {
      id: uid(),
      date: today(),
      time: "",
      label: "Snack",
      name: "",
      calories: 0,
      protein: 0,
      done: false,
      ...meal,
    };
    setMeals((prev) => [...prev, entry].slice(-MAX_MEALS));
    return entry;
  }, []);

  const updateMeal = useCallback((id, partial) => {
    setMeals((prev) => prev.map((m) => (m.id === id ? { ...m, ...partial } : m)));
  }, []);

  const toggleMealDone = useCallback((id) => {
    setMeals((prev) => prev.map((m) => (m.id === id ? { ...m, done: !m.done } : m)));
  }, []);

  const removeMeal = useCallback((id) => {
    setMeals((prev) => prev.filter((m) => m.id !== id));
  }, []);

  // ── Water ──

  const todaysWater = water[todayStr] || 0;

  const addWater = useCallback(() => {
    setWater((prev) => ({ ...prev, [today()]: (prev[today()] || 0) + 1 }));
  }, []);

  const removeWater = useCallback(() => {
    setWater((prev) => {
      const current = prev[today()] || 0;
      if (current <= 0) return prev;
      return { ...prev, [today()]: current - 1 };
    });
  }, []);

  // ── Derived: today's meals ──

  const todaysMeals = useMemo(() => {
    return meals
      .filter((m) => m.date === todayStr)
      .sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  }, [meals, todayStr]);

  // ── Derived: today's consumed totals ──

  const todaysTotals = useMemo(() => {
    const done = todaysMeals.filter((m) => m.done);
    return {
      calories: done.reduce((s, m) => s + (m.calories || 0), 0),
      protein: done.reduce((s, m) => s + (m.protein || 0), 0),
    };
  }, [todaysMeals]);

  // ── Derived: week progress (last 7 days) ──

  const weekProgress = useMemo(() => {
    const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const result = [];
    const now = new Date(todayStr);

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayMeals = meals.filter((m) => m.date === dateStr && m.done);
      const cal = dayMeals.reduce((s, m) => s + (m.calories || 0), 0);
      const isToday = dateStr === todayStr;
      const isFuture = false;
      result.push({
        day: days[d.getDay()],
        date: dateStr,
        cal,
        isToday,
        isFuture,
      });
    }
    return result;
  }, [meals, todayStr]);

  // ── Derived: streak (días consecutivos con comidas done) ──

  const streak = useMemo(() => {
    let count = 0;
    const d = new Date(todayStr);
    const hasTodayDone = meals.some((m) => m.date === todayStr && m.done);
    if (!hasTodayDone) {
      d.setDate(d.getDate() - 1);
    }

    for (let i = 0; i < 365; i++) {
      const dateStr = d.toISOString().slice(0, 10);
      const hasDone = meals.some((m) => m.date === dateStr && m.done);
      if (!hasDone) break;
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  }, [meals, todayStr]);

  // ── Clear (for logout) ──

  // Reset in-memory state only. Keeps localStorage intact so the user
  // recovers their data when they log back in.
  const clearMeals = useCallback(() => {
    setMeals([]);
    setWater({});
  }, []);

  return (
    <MealsContext.Provider
      value={{
        meals,
        todaysMeals,
        todaysTotals,
        addMeal,
        updateMeal,
        toggleMealDone,
        removeMeal,
        todaysWater,
        addWater,
        removeWater,
        weekProgress,
        streak,
        clearMeals,
      }}
    >
      {children}
    </MealsContext.Provider>
  );
}

export function useMeals() {
  const ctx = useContext(MealsContext);
  if (!ctx) throw new Error("useMeals must be used within MealsProvider");
  return ctx;
}
