import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@context/AuthContext";
import { useMidnightRefresh } from "@hooks/useMidnightRefresh";
import { localDateISO } from "@utils/date";

/* ═══════════════════════════════════════════════════════
   KYŌRA — ExerciseContext
   Persiste rutinas en localStorage, scoped por user ID.
   Mismo patrón que MealsContext.
   ═══════════════════════════════════════════════════════ */

const ExerciseContext = createContext(null);

const EXERCISES_KEY_BASE = "kyora.exercises";
const ROUTINES_KEY_BASE = "kyora.routines";
const MAX_EXERCISES = 500;

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
  } catch { /* quota / private browsing */ }
}

let _idCounter = Date.now();
function uid() {
  return "ex" + (++_idCounter).toString(36);
}

// ── Tipos de rutina y músculos ──

const ROUTINE_TYPES = [
  { id: "strength", label: "Fuerza", color: "#C8A96E" },
  { id: "cardio", label: "Cardio", color: "#7A9E7E" },
  { id: "flexibility", label: "Flexibilidad", color: "#7A8E9E" },
  { id: "hiit", label: "HIIT", color: "#C97070" },
  { id: "functional", label: "Funcional", color: "#9A8E7E" },
];

const MUSCLE_GROUPS = [
  "Pecho", "Espalda", "Hombros", "Bíceps", "Tríceps",
  "Piernas", "Glúteos", "Core", "Full Body", "Cardio",
];

// ── Provider ─────────────────────────────────────────

export function ExerciseProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id || null;
  const todayStr = useMidnightRefresh();
  const exKey = keyFor(EXERCISES_KEY_BASE, userId);
  const rtKey = keyFor(ROUTINES_KEY_BASE, userId);

  const [exercises, setExercises] = useState(() => load(exKey, []));
  const [routines, setRoutines] = useState(() => load(rtKey, {}));

  useEffect(() => {
    setExercises(load(exKey, []));
    setRoutines(load(rtKey, {}));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => { save(exKey, exercises); }, [exercises, exKey]);
  useEffect(() => { save(rtKey, routines); }, [routines, rtKey]);

  // ── Exercise CRUD ──

  const addExercise = useCallback((exercise) => {
    const entry = {
      id: uid(),
      date: today(),
      name: "",
      sets: 0,
      reps: 0,
      weight: 0,
      duration: 0,        // minutos (para cardio/flexibilidad)
      type: "strength",   // strength | cardio | flexibility | hiit | functional
      muscle: "Full Body",
      done: false,
      ...exercise,
    };
    setExercises((prev) => [...prev, entry].slice(-MAX_EXERCISES));
    return entry;
  }, []);

  const updateExercise = useCallback((id, partial) => {
    setExercises((prev) => prev.map((e) => (e.id === id ? { ...e, ...partial } : e)));
  }, []);

  const toggleExerciseDone = useCallback((id) => {
    setExercises((prev) => prev.map((e) => (e.id === id ? { ...e, done: !e.done } : e)));
  }, []);

  const removeExercise = useCallback((id) => {
    setExercises((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // ── Routines (metadata del día: tipo, músculo target, duración estimada) ──

  const todaysRoutine = routines[todayStr] || null;

  const setTodaysRoutine = useCallback((routine) => {
    setRoutines((prev) => ({ ...prev, [today()]: routine }));
  }, []);

  // ── Derived: today's exercises ──

  const todaysExercises = useMemo(() => {
    return exercises.filter((e) => e.date === todayStr);
  }, [exercises, todayStr]);

  // ── Derived: today's stats ──

  const todaysExerciseStats = useMemo(() => {
    const done = todaysExercises.filter((e) => e.done);
    const total = todaysExercises.length;
    const completed = done.length;
    const totalSets = done.reduce((s, e) => s + (e.sets || 0), 0);
    const totalDuration = done.reduce((s, e) => s + (e.duration || 0), 0);
    // Estimar calorías quemadas (muy aproximado)
    const estCalories = done.reduce((s, e) => {
      if (e.type === "cardio" || e.type === "hiit") return s + (e.duration || 0) * 10;
      return s + (e.sets || 0) * (e.reps || 0) * 0.5;
    }, 0);
    return { total, completed, totalSets, totalDuration, estCalories: Math.round(estCalories) };
  }, [todaysExercises]);

  // ── Derived: week exercise progress ──

  const weekExerciseProgress = useMemo(() => {
    const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const result = [];
    const [y, mo, day] = todayStr.split("-").map(Number);
    const today = new Date(y, mo - 1, day);
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay());

    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      const dateStr = localDateISO(d);
      const dayExercises = exercises.filter((e) => e.date === dateStr && e.done);
      const count = dayExercises.length;
      result.push({
        day: days[d.getDay()],
        date: dateStr,
        count,
        isToday: dateStr === todayStr,
        isFuture: dateStr > todayStr,
      });
    }
    return result;
  }, [exercises, todayStr]);

  // ── Derived: exercise streak ──

  const exerciseStreak = useMemo(() => {
    let count = 0;
    const [y, mo, day] = todayStr.split("-").map(Number);
    const d = new Date(y, mo - 1, day);
    const hasTodayDone = exercises.some((e) => e.date === todayStr && e.done);
    if (!hasTodayDone) d.setDate(d.getDate() - 1);
    for (let i = 0; i < 365; i++) {
      const dateStr = localDateISO(d);
      const hasDone = exercises.some((e) => e.date === dateStr && e.done);
      if (!hasDone) break;
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  }, [exercises, todayStr]);

  // ── Clear (for logout) ──

  // Reset in-memory state only — localStorage por usuario se conserva
  // para que al volver a entrar recupere su dashboard.
  const clearExercises = useCallback(() => {
    setExercises([]);
    setRoutines({});
  }, []);

  return (
    <ExerciseContext.Provider
      value={{
        exercises,
        todaysExercises,
        todaysExerciseStats,
        todaysRoutine,
        setTodaysRoutine,
        addExercise,
        updateExercise,
        toggleExerciseDone,
        removeExercise,
        weekExerciseProgress,
        exerciseStreak,
        clearExercises,
        ROUTINE_TYPES,
        MUSCLE_GROUPS,
      }}
    >
      {children}
    </ExerciseContext.Provider>
  );
}

export function useExercise() {
  const ctx = useContext(ExerciseContext);
  if (!ctx) throw new Error("useExercise must be used within ExerciseProvider");
  return ctx;
}
