import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@context/AuthContext";

/* ═══════════════════════════════════════════════════════
   KYŌRA — useAgentUsage()
   Contador simple de mensajes del usuario al agente,
   reseteado cada mes. Persistido en localStorage por
   userId. Pensado para enforce el límite del plan Gratis
   (20 msgs/mes). Cuando llegue Stripe + backend real,
   esto se mueve a la base de datos.

   Devuelve:
     - count: número de mensajes este mes
     - increment(): suma 1 al contador del mes actual
     - reset(): borra el contador (útil para testing)
   ═══════════════════════════════════════════════════════ */

const KEY_PREFIX = "kyora.agent.usage.";

function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function storageKey(userId) {
  return userId ? `${KEY_PREFIX}${userId}` : `${KEY_PREFIX}guest`;
}

function loadUsage(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveUsage(userId, data) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(data));
  } catch { /* ignore */ }
}

export function useAgentUsage() {
  const { user } = useAuth();
  const userId = user?.id || null;
  const [usage, setUsage] = useState(() => loadUsage(userId));

  // Recargar cuando cambia el userId (login/logout)
  useEffect(() => {
    setUsage(loadUsage(userId));
  }, [userId]);

  const mk = monthKey();
  const count = usage[mk] || 0;

  const increment = useCallback(() => {
    setUsage((prev) => {
      const m = monthKey();
      const updated = { ...prev, [m]: (prev[m] || 0) + 1 };
      saveUsage(userId, updated);
      return updated;
    });
  }, [userId]);

  const reset = useCallback(() => {
    setUsage({});
    saveUsage(userId, {});
  }, [userId]);

  return { count, increment, reset, monthKey: mk };
}
