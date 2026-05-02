/* ═══════════════════════════════════════════════════════
   KYŌRA — Anthropic API Client
   Wrapper alrededor del endpoint de Messages.
   Soporta respuesta completa (sendMessage) y streaming
   SSE (streamMessage) para UX en tiempo real.
   Proxy: /api/anthropic → https://api.anthropic.com
   ═══════════════════════════════════════════════════════ */

import { supabase } from "@api/supabaseClient";

export const DEFAULT_MODEL = "claude-sonnet-4-20250514";
export const DEFAULT_MAX_TOKENS = 4096;

const ENDPOINT = "/api/anthropic";

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

function sanitizeMessages(messages) {
  return messages
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && m.content)
    .map((m) => ({ role: m.role, content: m.content }));
}

function validateParams(systemPrompt, messages) {
  if (!systemPrompt) throw new Error("systemPrompt es requerido");
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error("messages debe ser un array con al menos un mensaje");
  }
}

/**
 * Envía una conversación y devuelve la respuesta completa.
 * (Mantenido para compatibilidad — streamMessage es preferido.)
 */
export async function sendMessage({
  systemPrompt,
  messages,
  model = DEFAULT_MODEL,
  maxTokens = DEFAULT_MAX_TOKENS,
  signal,
}) {
  validateParams(systemPrompt, messages);

  const authHeaders = await getAuthHeaders();
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders },
    signal,
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: sanitizeMessages(messages),
    }),
  });

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Respuesta inválida del servidor (status ${res.status})`);
  }

  if (data?.error) throw new Error(data.error.message || "Error desconocido de la API");
  if (!res.ok) throw new Error(`La API respondió con status ${res.status}`);

  const reply = data?.content
    ?.map((block) => (block.type === "text" ? block.text : ""))
    .filter(Boolean)
    .join("\n");

  if (!reply) throw new Error("La API no devolvió contenido de texto");

  // Guardamos metadata (stop_reason, usage) indexada por el string de reply
  // para que generateWeeklyPlan pueda detectar truncamientos por max_tokens.
  // Store con tamaño acotado — GC-friendly para lo que necesitamos.
  METADATA_STORE.set(reply, { stopReason: data?.stop_reason || null, usage: data?.usage || null });
  if (METADATA_STORE.size > MAX_METADATA_ENTRIES) {
    METADATA_STORE.delete(METADATA_STORE.keys().next().value);
  }
  return reply;
}

const METADATA_STORE = new Map();
const MAX_METADATA_ENTRIES = 20;

/** Devuelve stop_reason + usage del reply, o null si no está disponible. */
export function getReplyMeta(reply) {
  return METADATA_STORE.get(reply) || null;
}

/**
 * Envía una conversación con streaming SSE.
 * Llama onToken(text) con cada fragmento de texto conforme llega.
 * Devuelve el texto completo al finalizar.
 *
 * @param {object} params
 * @param {string} params.systemPrompt
 * @param {Array} params.messages
 * @param {(token: string) => void} params.onToken - callback por cada chunk
 * @param {string} [params.model]
 * @param {number} [params.maxTokens]
 * @param {AbortSignal} [params.signal]
 * @returns {Promise<string>} Texto completo de la respuesta.
 */
export async function streamMessage({
  systemPrompt,
  messages,
  onToken,
  model = DEFAULT_MODEL,
  maxTokens = DEFAULT_MAX_TOKENS,
  signal,
}) {
  validateParams(systemPrompt, messages);

  const authHeaders = await getAuthHeaders();
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders },
    signal,
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: sanitizeMessages(messages),
      stream: true,
    }),
  });

  if (!res.ok) {
    let errorMsg = `La API respondió con status ${res.status}`;
    try {
      const errData = await res.json();
      if (errData?.error?.message) errorMsg = errData.error.message;
    } catch {
      /* no-op */
    }
    throw new Error(errorMsg);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullText = "";
  let buffer = "";
  let stopReason = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop(); // keep incomplete line in buffer

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") continue;

      let event;
      try {
        event = JSON.parse(payload);
      } catch {
        continue;
      }

      // content_block_delta with text_delta
      if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
        const text = event.delta.text;
        fullText += text;
        onToken(text);
      }

      // Capture stop_reason for getReplyMeta callers (e.g. generateWeeklyPlan)
      if (event.type === "message_delta" && event.delta?.stop_reason) {
        stopReason = event.delta.stop_reason;
      }

      // Handle API errors in stream
      if (event.type === "error") {
        throw new Error(event.error?.message || "Error en stream de la API");
      }
    }
  }

  if (!fullText) throw new Error("La API no devolvió contenido de texto");

  METADATA_STORE.set(fullText, { stopReason, usage: null });
  if (METADATA_STORE.size > MAX_METADATA_ENTRIES) {
    METADATA_STORE.delete(METADATA_STORE.keys().next().value);
  }

  return fullText;
}
