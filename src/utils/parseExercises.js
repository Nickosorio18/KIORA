/* ═══════════════════════════════════════════════════════
   KYŌRA — Parser de ejercicios del agente
   Extrae bloques ```kyora-exercises [...] ``` de las
   respuestas del agente y los convierte en objetos
   listos para ExerciseContext.addExercise().
   ═══════════════════════════════════════════════════════ */

const BLOCK_RE = /```kyora-exercises\s*\n([\s\S]*?)```/;
const VALID_TYPES = new Set(["strength", "cardio", "flexibility", "hiit", "functional"]);
const VALID_MUSCLES = new Set([
  "Pecho", "Espalda", "Hombros", "Bíceps", "Tríceps",
  "Piernas", "Glúteos", "Core", "Full Body", "Cardio",
]);

/**
 * Extrae un array de ejercicios de un mensaje del agente.
 * @param {string} text — contenido del mensaje (role: "assistant")
 * @returns {{ exercises: Array, cleanText: string }}
 *   exercises: array de objetos { name, sets, reps, weight, duration, type, muscle }
 *   cleanText: el texto sin el bloque kyora-exercises (para renderizar)
 */
export function extractExercises(text) {
  if (!text) return { exercises: [], cleanText: text || "" };

  const match = text.match(BLOCK_RE);
  if (!match) return { exercises: [], cleanText: text };

  const cleanText = text.replace(BLOCK_RE, "").trimEnd();

  let parsed;
  try {
    parsed = JSON.parse(match[1]);
  } catch {
    return { exercises: [], cleanText };
  }

  if (!Array.isArray(parsed)) return { exercises: [], cleanText };

  const exercises = parsed
    .filter(
      (e) =>
        e &&
        typeof e.name === "string" &&
        e.name.trim()
    )
    .map((e) => ({
      name: e.name.trim(),
      sets: parseInt(e.sets, 10) || 0,
      reps: parseInt(e.reps, 10) || 0,
      weight: parseFloat(e.weight) || 0,
      duration: parseInt(e.duration, 10) || 0,
      type: VALID_TYPES.has(e.type) ? e.type : "strength",
      muscle: VALID_MUSCLES.has(e.muscle) ? e.muscle : "Full Body",
    }));

  return { exercises, cleanText };
}
