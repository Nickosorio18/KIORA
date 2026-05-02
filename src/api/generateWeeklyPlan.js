import { streamMessage, getReplyMeta } from "@api/anthropicClient";
import { modelForPlan, planMeets, FEATURES } from "@config/plans";
import { localDateISO } from "@utils/date";

/* ═══════════════════════════════════════════════════════
   KYŌRA — generateWeeklyPlan
   Genera un plan semanal completo vía Sonnet (si el plan
   del usuario califica) o Haiku (fallback). Devuelve un
   objeto estructurado listo para guardar en WeeklyPlanContext.

   La respuesta esperada del modelo es JSON, pero protegemos
   contra envoltorio en prosa extrayendo el primer {...}
   válido del texto devuelto.
   ═══════════════════════════════════════════════════════ */

const DAYS_ES = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

function datesOfWeek(weekStartDate) {
  const start = new Date(weekStartDate + "T00:00:00");
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return localDateISO(d);
  });
}

/**
 * Intenta reparar un JSON truncado cerrando strings, arrays y objetos abiertos.
 * Útil cuando el modelo se queda sin tokens en medio de la respuesta.
 * Es best-effort — si falla, simplemente lanza y dejamos que el caller
 * pida un reintento.
 */
function tryRepairTruncatedJson(text) {
  let src = text.trim();
  // Quitar fences si vinieron
  const fence = src.match(/```json\s*([\s\S]*?)$/i) || src.match(/```\s*([\s\S]*?)$/);
  if (fence) src = fence[1];

  // Arrancar desde el primer { real
  const first = src.indexOf("{");
  if (first === -1) return null;
  src = src.slice(first);

  // Recorrer y contar balance. Si estamos dentro de un string cuando se
  // trunca, cerramos el string primero. Luego cerramos arrays y objetos
  // pendientes. Si el último char es una coma colgante, la removemos.
  const stack = []; // array de '{' o '['
  let inString = false;
  let escape = false;
  let lastCompleteIdx = -1;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\" && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;

    if (ch === "{" || ch === "[") stack.push(ch);
    else if (ch === "}" || ch === "]") {
      stack.pop();
      if (stack.length === 0) lastCompleteIdx = i;
    }
  }

  // Si el JSON ya cerró balanceado, no hay que reparar.
  if (stack.length === 0 && lastCompleteIdx === src.length - 1) {
    return src;
  }

  // Truncar strings abiertas cerrando la comilla
  let repaired = src;
  if (inString) repaired += '"';

  // Quitar comas colgantes tras el último valor completo
  repaired = repaired.replace(/,\s*$/, "");

  // Cerrar estructuras pendientes en orden inverso
  for (let i = stack.length - 1; i >= 0; i--) {
    repaired += stack[i] === "{" ? "}" : "]";
  }

  return repaired;
}

function extractJson(text, { wasTruncated = false } = {}) {
  if (!text) throw new Error("Respuesta vacía del modelo");
  // Primer intento: parsear directo
  try { return JSON.parse(text); } catch { /* fallthrough */ }

  // Segundo intento: buscar bloque ```json ... ```
  const fence = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```\s*([\s\S]*?)```/);
  if (fence) {
    try { return JSON.parse(fence[1].trim()); } catch { /* fallthrough */ }
  }

  // Tercer intento: primer { ... } balanceado
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last > first) {
    const slice = text.slice(first, last + 1);
    try { return JSON.parse(slice); } catch { /* fallthrough */ }
  }

  // Cuarto intento: si la respuesta está truncada, reparar best-effort.
  // Sucede cuando Anthropic corta por max_tokens — cerramos strings/arrays
  // abiertos y quitamos comas colgantes para recuperar lo más posible.
  const repaired = tryRepairTruncatedJson(text);
  if (repaired) {
    try {
      const parsed = JSON.parse(repaired);
      if (import.meta.env.DEV) {
        console.warn("[generateWeeklyPlan] JSON reparado tras truncamiento. stopReason:", wasTruncated ? "max_tokens" : "?");
      }
      return parsed;
    } catch { /* fallthrough */ }
  }

  // Loggear el raw para debug en dev antes de fallar
  if (import.meta.env.DEV) {
    console.group("[generateWeeklyPlan] JSON parse failure");
    console.log("Full reply length:", text.length);
    console.log("Head (first 500):", text.slice(0, 500));
    console.log("Tail (last 500):", text.slice(-500));
    console.log("wasTruncated:", wasTruncated);
    console.groupEnd();
  }

  const hint = wasTruncated
    ? "La respuesta del modelo se cortó por longitud. Intenta de nuevo — si persiste, avísame."
    : "No pude interpretar la respuesta del modelo como JSON válido. Intenta de nuevo.";
  throw new Error(hint);
}

function pantryLine(pantry) {
  if (!pantry || typeof pantry !== "object") return "El usuario aún no registró ingredientes en su despensa.";
  const all = Object.entries(pantry)
    .flatMap(([loc, items]) => (Array.isArray(items) ? items.map((i) => `${i.name || i} (${loc})`) : []));
  if (!all.length) return "El usuario aún no registró ingredientes en su despensa.";
  return `Ingredientes ya disponibles en la despensa del usuario: ${all.slice(0, 40).join(", ")}.`;
}

function buildPrompt(profile, pantry, weekStartDate, includeExercise) {
  const dates = datesOfWeek(weekStartDate);

  const daysSchema = DAYS_ES
    .map((d, i) => `      { "day": "${d}", "date": "${dates[i]}", "meals": [...], "totals": { "calories": 0, "protein": 0, "carbs": 0, "fats": 0 } }`)
    .join(",\n");

  const exerciseSchema = includeExercise
    ? `,
  "exerciseRoutine": [
${DAYS_ES.map((d, i) => `    { "day": "${d}", "date": "${dates[i]}", "exercises": [...] }`).join(",\n")}
  ]`
    : "";

  const exerciseInstructions = includeExercise
    ? `
═══ RUTINA DE ENTRENAMIENTO ═══
9. Además del plan nutricional, genera una rutina de ejercicio semanal alineada al objetivo del usuario.
10. 7 días: combina fuerza, cardio, movilidad y descanso activo de forma balanceada según el nivel de actividad indicado.
11. Cada ejercicio debe tener: type ("strength"|"cardio"|"hiit"|"flexibility"), name, sets, reps, weight (0 si no aplica), duration en minutos (0 si no aplica), y notes (coaching breve).
12. Respeta el nivel de actividad del perfil: si es "sedentary" o "light", prioriza caminatas y movilidad; si es "moderate"+, agrega fuerza progresiva.`
    : "";

  const exerciseMealSchema = includeExercise
    ? `

Y cada elemento dentro de exerciseRoutine.exercises es:
{
  "type": "strength",
  "name": "Sentadilla con barra",
  "sets": 4,
  "reps": 10,
  "weight": 0,
  "duration": 0,
  "notes": "Baja hasta paralelo, controla el ascenso"
}`
    : "";

  return `Eres KYŌRA, nutriólogo virtual con enfoque en bienestar integral. Tu tarea: generar un plan alimenticio semanal completo y personalizado${includeExercise ? ", más una rutina de entrenamiento alineada al objetivo" : ""}.

═══ PERFIL DEL USUARIO ═══
- Nombre: ${profile.nombre || "Usuario"}
- Sexo: ${profile.sexo || "No especificado"}
- Edad: ${profile.edad || "No especificada"}
- Peso: ${profile.peso || "No especificado"}
- Altura: ${profile.altura || "No especificada"}
- Objetivo: ${profile.objetivo || "No especificado"}
- Nivel de actividad: ${profile.actividad || "No especificado"}
- Restricciones: ${profile.restricciones || "Ninguna"}
- Cocinas favoritas: ${profile.preferencias || "Sin preferencias específicas"}

═══ DESPENSA ═══
${pantryLine(pantry)}

═══ INSTRUCCIONES ═══
1. Calcula calorías y macros target basados en el perfil (Mifflin-St Jeor + ajuste por objetivo).
2. Genera 7 días (lunes a domingo) con 4 comidas cada uno: Desayuno, Snack, Comida, Cena.
3. Cada comida debe tener: nombre real (no genérico), descripción de 1 línea, macros realistas, ingredientes con cantidad, y receta breve (3-5 pasos).
4. Prioriza ingredientes de la despensa cuando sea posible y señala lo que falta comprar en la lista de compras.
5. Varía las comidas — que no se repitan exactamente en la semana.
6. Respeta restricciones al 100%.
7. La lista de compras debe agrupar por categoría (Frutas y verduras, Proteínas, Lácteos, Granos y cereales, Otros).
8. Notas finales: 2-3 líneas de coaching específico para este perfil.${exerciseInstructions}

═══ FORMATO DE SALIDA ═══
Responde ÚNICAMENTE con un objeto JSON válido, sin texto antes ni después, sin envolver en \`\`\`. El objeto debe cumplir exactamente este schema:

{
  "title": "Plan semanal · Semana del X al Y de [mes]",
  "profileSnapshot": {
    "objetivo": "...",
    "caloriesTarget": 2100,
    "proteinTarget": 140,
    "carbsTarget": 230,
    "fatsTarget": 70
  },
  "days": [
${daysSchema}
  ],
  "shoppingList": [
    {
      "category": "Frutas y verduras",
      "items": [
        { "name": "Plátano", "quantity": "7 unidades" }
      ]
    }
  ],
  "notes": "Texto motivacional de 2-3 líneas..."${exerciseSchema}
}

Donde cada "meal" dentro de days.meals es:
{
  "label": "Desayuno",
  "time": "08:00",
  "name": "Avena con plátano y almendras",
  "description": "Desayuno balanceado con proteína vegetal y grasas buenas",
  "calories": 380,
  "protein": 14,
  "carbs": 52,
  "fats": 12,
  "ingredients": ["50g de avena", "1 plátano maduro", "15g de almendras", "200ml de leche"],
  "recipe": "1. Calienta la leche. 2. Agrega la avena y cocina 3 min. 3. Sirve y decora con plátano y almendras."
}${exerciseMealSchema}

IMPORTANTE: devuelve solo el JSON, nada más.`;
}

/**
 * Genera un plan semanal y devuelve el objeto parseado.
 *
 * @param {object} args
 * @param {object} args.profile        - profileForAgent (formato legible)
 * @param {object} args.pantry         - objeto { location: [{name, ...}] }
 * @param {string} args.weekStartDate  - ISO date del lunes de la semana
 * @param {string} args.planId         - plan del usuario (free/esencial/premium/...)
 * @param {AbortSignal} [args.signal]
 * @returns {Promise<object>}
 */
export async function generateWeeklyPlan({ profile, pantry, weekStartDate, planId, signal }) {
  // Solo incluimos entrenamiento si el plan del usuario lo permite (Premium+)
  const includeExercise = planMeets(planId, FEATURES.WEEKLY_EXERCISE_ROUTINE.minPlan);

  const prompt = buildPrompt(profile, pantry, weekStartDate, includeExercise);
  const model = modelForPlan(planId, "plan_generation");

  // Plan nutricional denso (28 comidas con ingredientes+recetas) fácilmente
  // consume 10-14k tokens. Con rutina de ejercicio suma otros 3-5k.
  // Sonnet 4 soporta hasta 64k de salida, así que somos generosos.
  const maxTokens = includeExercise ? 24000 : 16000;

  const reply = await streamMessage({
    systemPrompt: prompt,
    messages: [{ role: "user", content: "Genera mi plan semanal ahora, siguiendo el schema al pie de la letra." }],
    onToken: () => {},
    model,
    maxTokens,
    signal,
  });

  const meta = getReplyMeta(reply);
  const wasTruncated = meta?.stopReason === "max_tokens";

  if (import.meta.env.DEV && meta?.usage) {
    console.log("[generateWeeklyPlan] usage:", meta.usage, "stopReason:", meta.stopReason);
  }

  const parsed = extractJson(reply, { wasTruncated });

  // Validación mínima — si falta el core, fallamos con mensaje claro
  if (!Array.isArray(parsed.days) || parsed.days.length < 7) {
    const hint = wasTruncated
      ? "El plan se cortó por longitud antes de completar los 7 días. Intenta de nuevo."
      : "El modelo devolvió un plan incompleto — reintenta en un momento.";
    throw new Error(hint);
  }

  return { ...parsed, weekStartDate };
}
