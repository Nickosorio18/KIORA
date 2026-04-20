/* ═══════════════════════════════════════════════════════
   KYŌRA — Plan & Feature Configuration
   Single source of truth para tiers de pricing y feature gates.
   Cualquier cambio de plan/precio/feature se hace AQUÍ y se
   propaga al resto de la app vía usePlan().
   ═══════════════════════════════════════════════════════ */

/**
 * Plan IDs canónicos. Internamente siempre se usa el id (lowercase),
 * el `label` es solo para display.
 */
export const PLAN_IDS = {
  ESENCIAL: "esencial",
  PREMIUM: "premium",
  ELITE: "elite",
};

export const PLANS = [
  {
    id: "esencial",
    label: "Esencial",
    tagline: "El más popular",
    priceUSD: 29,
    priceLocal: { MX: "$499 MXN", CO: "$119,000 COP", AR: "$29,900 ARS", CL: "$27,990 CLP" },
    badge: "Esencial",
    color: "#C8A96E",
    popular: true,
    order: 0,
  },
  {
    id: "premium",
    label: "Premium",
    tagline: "Nutrición familiar con historial completo",
    priceUSD: 49,
    priceLocal: { MX: "$849 MXN", CO: "$199,000 COP", AR: "$49,900 ARS", CL: "$46,990 CLP" },
    badge: "Premium",
    color: "#7A9E7E",
    order: 1,
  },
  {
    id: "elite",
    label: "Élite",
    tagline: "Acceso a nutriólogo humano",
    priceUSD: 99,
    priceLocal: { MX: "$1,799 MXN", CO: "$399,000 COP", AR: "$99,900 ARS", CL: "$94,990 CLP" },
    badge: "Élite",
    color: "#1A1A2E",
    order: 2,
  },
];

export const PLAN_BY_ID = Object.fromEntries(PLANS.map((p) => [p.id, p]));

/**
 * Features definition. Each feature has:
 *   - minPlan: el tier mínimo requerido (esencial | premium | elite)
 *   - limit: opcional, número (mensajes/mes, planes/mes, etc). Si está, planes superiores tienen Infinity.
 *   - paywallCopy: { title, body, ctaPlan } para el modal cuando se bloquea
 *
 * IDs de features deben ser strings estables — se usan en analytics y A/B tests.
 */
export const FEATURES = {
  // ── Agente conversacional ──
  // Todos los planes pagos tienen mensajes ilimitados.
  AGENT_MESSAGES_PER_MONTH: {
    id: "agent_messages",
    minPlan: "esencial",
    limits: { esencial: Infinity, premium: Infinity, elite: Infinity },
    paywallCopy: {
      title: "Mensajes ilimitados con KYŌRA",
      body: "Todos los planes KYŌRA incluyen conversaciones ilimitadas con tu coach de nutrición.",
      ctaPlan: "esencial",
    },
  },

  // ── Generación de planes ──
  WEEKLY_PLAN_GENERATION: {
    id: "weekly_plan",
    minPlan: "esencial",
    paywallCopy: {
      title: "Planes semanales personalizados",
      body: "Genera tu menú de la semana completo con macros, lista de compras y recetas. Disponible desde el plan Esencial.",
      ctaPlan: "esencial",
    },
  },

  PDF_DOWNLOAD: {
    id: "pdf_download",
    minPlan: "esencial",
    paywallCopy: {
      title: "Descarga tu plan en PDF",
      body: "Exporta tu menú con macros, recetas y notas de tu coach. Listo para imprimir o compartir con tu nutriólogo.",
      ctaPlan: "esencial",
    },
  },

  // ── Análisis y progreso ──
  PROGRESS_ANALYTICS: {
    id: "progress_analytics",
    minPlan: "esencial",
    paywallCopy: {
      title: "Análisis profundo de tu progreso",
      body: "Tendencias semanales, adherencia, comparativas y proyecciones. Disponible desde Esencial.",
      ctaPlan: "esencial",
    },
  },

  // ── Rutina de entrenamiento semanal (diferenciador Premium) ──
  WEEKLY_EXERCISE_ROUTINE: {
    id: "weekly_exercise_routine",
    minPlan: "premium",
    paywallCopy: {
      title: "Rutina de entrenamiento semanal",
      body: "Tu plan de ejercicio de 7 días generado con tu perfil, tu nivel y tu objetivo. Sincronizado con tu plan de alimentación.",
      ctaPlan: "premium",
    },
  },

  // ── Premium tier features ──

  // Historial de hasta 8 planes semanales previos (actualmente WeeklyPlanContext
  // archiva 4 — ampliar a 8 cuando se migre a backend).
  PLAN_HISTORY: {
    id: "plan_history",
    minPlan: "premium",
    paywallCopy: {
      title: "Historial de tus últimas 8 semanas",
      body: "Accede, compara y restaura cualquiera de tus planes anteriores para ver tu evolución semana a semana.",
      ctaPlan: "premium",
    },
  },

  // Hasta 2 perfiles adicionales en la misma cuenta (familia/pareja).
  FAMILY_PROFILES: {
    id: "family_profiles",
    minPlan: "premium",
    paywallCopy: {
      title: "Plan familiar — hasta 2 perfiles adicionales",
      body: "Gestiona la nutrición de tu familia desde una sola cuenta. Cada perfil tiene su propio plan personalizado.",
      ctaPlan: "premium",
    },
  },

  VOICE_AGENT: {
    id: "voice_agent",
    minPlan: "premium",
    paywallCopy: {
      title: "Conversa con KYŌRA por voz",
      body: "Habla con tu coach mientras cocinas, entrenas o caminas. Voz natural en español. Disponible en Premium.",
      ctaPlan: "premium",
    },
  },

  HEALTH_INTEGRATIONS: {
    id: "health_integrations",
    minPlan: "premium",
    paywallCopy: {
      title: "Sincroniza con Apple Health y Google Fit",
      body: "Tu actividad, peso y métricas se actualizan automáticamente en KYŌRA.",
      ctaPlan: "premium",
    },
  },

  // ── Élite ──
  HUMAN_NUTRITIONIST: {
    id: "human_nutritionist",
    minPlan: "elite",
    paywallCopy: {
      title: "Consulta con un nutriólogo certificado",
      body: "Una videollamada al mes con un profesional humano partner de KYŌRA, además de todo lo que ya tienes.",
      ctaPlan: "elite",
    },
  },

  // ── AI model routing ──
  // No es un gate, es un input para usePlan().getModel()
  // esencial → Haiku para chat, Sonnet para generación/análisis. premium/elite → Sonnet siempre.
};

/**
 * Devuelve el orden numérico de un plan para comparaciones (a >= b).
 */
export function planRank(planId) {
  return PLAN_BY_ID[planId]?.order ?? -1;
}

/**
 * @returns {boolean} true si planA tiene acceso al tier de planB (planA >= planB)
 */
export function planMeets(planA, planB) {
  return planRank(planA) >= planRank(planB);
}

/**
 * Decide qué modelo Anthropic usar según plan + tipo de tarea.
 * Por defecto: planes inferiores usan Haiku, esencial+ usa Sonnet.
 *
 * @param {string} planId
 * @param {"chat" | "plan_generation" | "analysis"} taskType
 */
export function modelForPlan(planId, taskType = "chat") {
  const HAIKU = "claude-haiku-4-5";
  const SONNET = "claude-sonnet-4-20250514";

  // Generación de planes y análisis: Sonnet siempre (esencial es el tier base).
  if (taskType === "plan_generation" || taskType === "analysis") {
    return SONNET;
  }

  // Chat normal: Haiku para Esencial (barato, rápido). Premium+ usa Sonnet.
  if (planMeets(planId, "premium")) return SONNET;
  return HAIKU;
}
