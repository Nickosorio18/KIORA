/* ═══════════════════════════════════════════════════════
   KYŌRA — Disclaimer Médico
   Componente compartido. Una sola fuente de verdad para el
   texto legal que debe aparecer en cualquier superficie que
   ofrezca orientación nutricional (agente, dashboard,
   onboarding, etc.).
   Requisito definido en CLAUDE.md: "Incluir disclaimers
   apropiados en toda interfaz".
   ═══════════════════════════════════════════════════════ */

export const DISCLAIMER_TEXT =
  "KYŌRA ofrece orientación nutricional general basada en evidencia. No sustituye la asesoría médica profesional. Ante cualquier síntoma o condición de salud, consulta a un médico o nutriólogo certificado.";

export const DISCLAIMER_SHORT =
  "Orientación general. No sustituye asesoría médica profesional.";

/**
 * Variantes:
 *  - "inline": una sola línea minimalista, ideal para footers de input o debajo de CTAs.
 *  - "banner": caja con ícono ⚕, acento dorado, para landings y pantallas finales.
 *  - "footer": línea sutil con borde superior, para el pie de páginas tipo dashboard.
 *
 * @param {object} props
 * @param {"inline"|"banner"|"footer"} [props.variant="inline"]
 * @param {"short"|"full"} [props.length="short"]
 * @param {React.CSSProperties} [props.style]
 */
export default function Disclaimer({ variant = "inline", length = "short", style = {} }) {
  const text = length === "full" ? DISCLAIMER_TEXT : DISCLAIMER_SHORT;

  if (variant === "banner") {
    return (
      <div
        role="note"
        aria-label="Aviso médico"
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "10px",
          padding: "12px 16px",
          background: "rgba(200,169,110,.06)",
          border: "1px solid rgba(200,169,110,.2)",
          borderRadius: "6px",
          fontFamily: "'Jost', system-ui, sans-serif",
          fontSize: "12px",
          fontWeight: 300,
          lineHeight: 1.55,
          color: "#6B6B80",
          ...style,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            flexShrink: 0,
            width: "18px",
            height: "18px",
            borderRadius: "50%",
            background: "rgba(200,169,110,.15)",
            color: "#C8A96E",
            fontSize: "11px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "1px",
          }}
        >
          ⚕
        </span>
        <span>{DISCLAIMER_TEXT}</span>
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <div
        role="note"
        aria-label="Aviso médico"
        style={{
          padding: "14px 0 2px",
          borderTop: "1px solid rgba(200,169,110,.08)",
          marginTop: "2rem",
          fontFamily: "'Jost', system-ui, sans-serif",
          fontSize: "10.5px",
          fontWeight: 300,
          letterSpacing: ".02em",
          lineHeight: 1.55,
          color: "#9A9189",
          textAlign: "center",
          ...style,
        }}
      >
        <span aria-hidden="true" style={{ color: "#C8A96E", marginRight: "6px" }}>⚕</span>
        {DISCLAIMER_TEXT}
      </div>
    );
  }

  // variant === "inline" (default)
  return (
    <span
      role="note"
      aria-label="Aviso médico"
      style={{
        fontFamily: "'Jost', system-ui, sans-serif",
        fontSize: "10px",
        fontWeight: 300,
        color: "#9A9189",
        ...style,
      }}
    >
      {text}
    </span>
  );
}
