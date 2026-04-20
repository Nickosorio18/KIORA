/* ═══════════════════════════════════════════════════════
   KYŌRA — Parser de comidas del agente
   Extrae bloques ```kyora-meals [...] ``` de las
   respuestas del agente y los convierte en objetos
   listos para MealsContext.addMeal().
   ═══════════════════════════════════════════════════════ */

const BLOCK_RE = /```kyora-meals\s*\n([\s\S]*?)```/;
const VALID_LABELS = new Set(["Desayuno", "Snack", "Comida", "Cena"]);

/**
 * Extrae un array de comidas de un mensaje del agente.
 * @param {string} text — contenido del mensaje (role: "assistant")
 * @returns {{ meals: Array, cleanText: string }}
 *   meals: array de objetos { label, name, time, calories, protein }
 *   cleanText: el texto sin el bloque kyora-meals (para renderizar)
 */
export function extractMeals(text) {
  if (!text) return { meals: [], cleanText: text || "" };

  const match = text.match(BLOCK_RE);
  if (!match) return { meals: [], cleanText: text };

  const cleanText = text.replace(BLOCK_RE, "").trimEnd();

  let parsed;
  try {
    parsed = JSON.parse(match[1]);
  } catch {
    return { meals: [], cleanText };
  }

  if (!Array.isArray(parsed)) return { meals: [], cleanText };

  const meals = parsed
    .filter(
      (m) =>
        m &&
        typeof m.name === "string" &&
        m.name.trim() &&
        VALID_LABELS.has(m.label)
    )
    .map((m) => ({
      label: m.label,
      name: m.name.trim(),
      time: typeof m.time === "string" ? m.time : "",
      calories: parseInt(m.calories, 10) || 0,
      protein: parseInt(m.protein, 10) || 0,
    }));

  return { meals, cleanText };
}
