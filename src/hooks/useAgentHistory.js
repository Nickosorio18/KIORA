import { useState, useEffect, useCallback } from "react";

/* ═══════════════════════════════════════════════════════
   KYŌRA — useAgentHistory
   Persiste la conversación con el agente en localStorage.
   - Filtra mensajes "error" (son transitorios, no se persisten).
   - Limita a los últimos MAX_MESSAGES para no saturar storage.
   - Maneja JSON corrupto o localStorage deshabilitado sin romper.
   ═══════════════════════════════════════════════════════ */

const STORAGE_KEY = "kyora.agent.history";
const MAX_MESSAGES = 50;

function isValidMessage(m) {
  return (
    m &&
    typeof m === "object" &&
    (m.role === "user" || m.role === "assistant") &&
    typeof m.content === "string" &&
    m.content.length > 0
  );
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidMessage);
  } catch {
    return [];
  }
}

function saveToStorage(messages) {
  try {
    const persistable = messages.filter(isValidMessage);
    const trimmed = persistable.slice(-MAX_MESSAGES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage lleno, private browsing, etc. — ignorar en silencio.
  }
}

/**
 * Utility exportable para limpiar el historial desde fuera del hook
 * (por ejemplo, desde el handler de logout del Dashboard).
 */
export function clearAgentHistoryStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // noop
  }
}

/**
 * Hook que gestiona el historial persistente del agente.
 *
 * @returns {{
 *   messages: Array<{role: 'user'|'assistant', content: string}>,
 *   setMessages: React.Dispatch<React.SetStateAction<Array>>,
 *   appendMessage: (msg: object) => void,
 *   clearHistory: () => void,
 *   hasHistory: boolean,
 * }}
 */
export function useAgentHistory() {
  const [messages, setMessages] = useState(() => loadFromStorage());

  useEffect(() => {
    saveToStorage(messages);
  }, [messages]);

  const appendMessage = useCallback((message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([]);
    clearAgentHistoryStorage();
  }, []);

  const hasHistory = messages.some(isValidMessage);

  return { messages, setMessages, appendMessage, clearHistory, hasHistory };
}
