import { useCallback, useMemo } from "react";
import { useUser } from "@context/UserContext";
import { FEATURES, PLAN_BY_ID, planMeets, modelForPlan } from "@config/plans";

/* ═══════════════════════════════════════════════════════
   KYŌRA — usePlan()
   Hook único para preguntar cualquier cosa relacionada con
   el plan del usuario. NO accedas a profile.plan directo
   en componentes — siempre vía este hook para que tengamos
   un solo punto de cambio cuando el modelo evolucione
   (e.g. cuando metamos Stripe, A/B tests, etc).

   Uso típico:

     const plan = usePlan();
     if (!plan.canUse(FEATURES.PDF_DOWNLOAD)) showPaywall(...);
     const limit = plan.limitFor(FEATURES.AGENT_MESSAGES_PER_MONTH);
     const model = plan.modelFor("plan_generation");
   ═══════════════════════════════════════════════════════ */

export function usePlan() {
  const { profile } = useUser();
  const planId = profile?.plan || "esencial";
  const plan = PLAN_BY_ID[planId] || PLAN_BY_ID.esencial;

  const canUse = useCallback(
    (feature) => {
      if (!feature) return false;
      return planMeets(planId, feature.minPlan);
    },
    [planId]
  );

  const limitFor = useCallback(
    (feature) => {
      if (!feature?.limits) return Infinity;
      const v = feature.limits[planId];
      return v === undefined ? Infinity : v;
    },
    [planId]
  );

  const modelFor = useCallback(
    (taskType = "chat") => modelForPlan(planId, taskType),
    [planId]
  );

  return useMemo(
    () => ({
      // Plan info
      id: planId,
      label: plan.label,
      tagline: plan.tagline,
      priceUSD: plan.priceUSD,
      color: plan.color,
      isEsencial: planId === "esencial",
      isPremiumOrAbove: planMeets(planId, "premium"),

      // Capability checks
      canUse,
      limitFor,
      modelFor,

      // Convenience flags por feature común
      canDownloadPDF: planMeets(planId, FEATURES.PDF_DOWNLOAD.minPlan),
      canGenerateWeeklyPlan: planMeets(planId, FEATURES.WEEKLY_PLAN_GENERATION.minPlan),
      canSeeWeeklyExercise: planMeets(planId, FEATURES.WEEKLY_EXERCISE_ROUTINE.minPlan),
      canSeeProgressAnalytics: planMeets(planId, FEATURES.PROGRESS_ANALYTICS.minPlan),
      canUseVoice: planMeets(planId, FEATURES.VOICE_AGENT.minPlan),
    }),
    [planId, plan, canUse, limitFor, modelFor]
  );
}
