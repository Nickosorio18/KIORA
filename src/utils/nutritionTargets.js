/* ═══════════════════════════════════════════════════════
   KYŌRA — Cálculo de Metas Nutricionales
   Fórmula Mifflin-St Jeor × factor de actividad
   + ajuste por objetivo (perder / ganar / mantener)
   ═══════════════════════════════════════════════════════ */

const ACTIVITY_FACTORS = {
  // Onboarding IDs (English)
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
  athlete: 1.9,
  // Spanish fallbacks
  sedentario: 1.2,
  ligero: 1.375,
  moderado: 1.55,
  activo: 1.725,
  "muy activo": 1.9,
};

const GOAL_ADJUSTMENTS = {
  // Onboarding IDs (English)
  lose: -400,
  gain: 300,
  both: 0,
  health: 0,
  energy: 200,
  maintain: 0,
  // Spanish fallbacks
  "perder grasa": -400,
  "ganar músculo": 300,
  "recomposición": 0,
  "comer mejor": 0,
  "más energía": 200,
  "mantener": 0,
};

const DEFAULTS = { calTarget: 2000, protTarget: 100, waterTarget: 8 };

/**
 * Calcula metas diarias a partir del perfil del usuario.
 * @param {object|null} profile — UserContext profile shape
 * @returns {{ calTarget: number, protTarget: number, waterTarget: number }}
 */
export function calculateTargets(profile) {
  if (!profile) return DEFAULTS;

  const peso = parseFloat(profile.peso);
  const altura = parseFloat(profile.altura);
  const edad = parseInt(profile.edad, 10);
  const sexo = (profile.sexo || "").toLowerCase();

  // Si faltan datos clave, devolver defaults
  if (!peso || !altura || !edad) return DEFAULTS;

  // ── BMR (Mifflin-St Jeor) ──
  let bmr;
  if (sexo === "mujer" || sexo === "femenino" || sexo === "f") {
    bmr = 10 * peso + 6.25 * altura - 5 * edad - 161;
  } else {
    bmr = 10 * peso + 6.25 * altura - 5 * edad + 5;
  }

  // ── Factor de actividad ──
  const actKey = (profile.actividad || "").toLowerCase();
  const factor = ACTIVITY_FACTORS[actKey] || 1.55; // moderado como fallback
  let tdee = Math.round(bmr * factor);

  // ── Ajuste por objetivo ──
  const objetivo = (profile.objetivo || "").toLowerCase();
  const adjustment = GOAL_ADJUSTMENTS[objetivo]
    ?? Object.entries(GOAL_ADJUSTMENTS).find(([key]) => objetivo.includes(key))?.[1]
    ?? 0;
  tdee += adjustment;
  const calTarget = Math.max(1200, tdee); // piso de seguridad

  // ── Proteína ──
  const isGain = objetivo === "gain" || objetivo.includes("músculo") || objetivo.includes("ganar");
  const protPerKg = isGain ? 2.0 : 1.6;
  const protTarget = Math.round(peso * protPerKg);

  // ── Agua (vasos de 250ml) ──
  // OMS: ~35ml/kg, redondeamos a vasos, mínimo 6
  const waterMl = peso * 35;
  const waterTarget = Math.max(6, Math.round(waterMl / 250));

  return { calTarget, protTarget, waterTarget };
}
