import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@api/supabaseClient";

/* ═══════════════════════════════════════════════════════
   KYŌRA — Update Password Page
   Formulario para establecer nueva contraseña tras
   el flujo de recuperación (PASSWORD_RECOVERY).
   ═══════════════════════════════════════════════════════ */

export default function UpdatePasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (err) {
      setError(err.message || "No se pudo actualizar la contraseña. El enlace puede haber expirado.");
      return;
    }

    setSuccess(true);
    setTimeout(() => navigate("/app/dashboard"), 3000);
  }

  return (
    <div style={{
      fontFamily: "'Jost', system-ui, sans-serif",
      background: "#FAF8F5",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "1.5rem",
    }}>
      {/* Logo */}
      <div style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: "1.3rem",
        fontWeight: 500,
        letterSpacing: ".3em",
        marginBottom: "2rem",
        cursor: "pointer",
      }} onClick={() => navigate("/")}>
        KY<span style={{ color: "#C8A96E", fontWeight: 700 }}>Ō</span>RA
      </div>

      <div style={{
        background: "white",
        border: "1px solid rgba(200,169,110,.15)",
        borderRadius: "4px",
        padding: "2.5rem 2rem",
        textAlign: "center",
        boxShadow: "0 24px 60px rgba(26,26,46,.04)",
        width: "100%",
        maxWidth: "420px",
      }}>
        {success ? (
          <>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "rgba(200,169,110,.1)",
              border: "1px solid rgba(200,169,110,.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.2rem",
              fontSize: "1.2rem",
            }}>✓</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", fontWeight: 500, marginBottom: ".6rem", color: "#1A1A2E" }}>
              Contraseña actualizada
            </h2>
            <p style={{ fontSize: ".9rem", color: "#6B6B80", fontWeight: 300 }}>
              Tu contraseña se cambió con éxito. Redirigiendo a tu cuenta...
            </p>
          </>
        ) : (
          <>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", fontWeight: 500, marginBottom: ".5rem", color: "#1A1A2E" }}>
              Nueva contraseña
            </h2>
            <p style={{ fontSize: ".875rem", color: "#6B6B80", fontWeight: 300, marginBottom: "1.75rem" }}>
              Elige una contraseña segura para tu cuenta.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", textAlign: "left" }}>
              <div>
                <label style={{ display: "block", fontSize: ".8rem", fontWeight: 500, color: "#1A1A2E", marginBottom: ".4rem", letterSpacing: ".05em" }}>
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                  style={{
                    width: "100%",
                    padding: ".75rem 1rem",
                    border: "1px solid rgba(26,26,46,.15)",
                    borderRadius: "3px",
                    fontSize: ".9rem",
                    fontFamily: "'Jost', system-ui, sans-serif",
                    background: "#FAFAFA",
                    color: "#1A1A2E",
                    outline: "none",
                    boxSizing: "border-box",
                    fontSize: "16px",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: ".8rem", fontWeight: 500, color: "#1A1A2E", marginBottom: ".4rem", letterSpacing: ".05em" }}>
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repite tu nueva contraseña"
                  required
                  style={{
                    width: "100%",
                    padding: ".75rem 1rem",
                    border: "1px solid rgba(26,26,46,.15)",
                    borderRadius: "3px",
                    fontSize: ".9rem",
                    fontFamily: "'Jost', system-ui, sans-serif",
                    background: "#FAFAFA",
                    color: "#1A1A2E",
                    outline: "none",
                    boxSizing: "border-box",
                    fontSize: "16px",
                  }}
                />
              </div>

              {error && (
                <p style={{ fontSize: ".85rem", color: "#c0392b", background: "rgba(192,57,43,.06)", border: "1px solid rgba(192,57,43,.15)", borderRadius: "3px", padding: ".65rem .9rem", margin: 0 }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: ".85rem",
                  background: loading ? "rgba(200,169,110,.5)" : "#C8A96E",
                  color: "white",
                  border: "none",
                  borderRadius: "3px",
                  fontSize: ".9rem",
                  fontWeight: 500,
                  fontFamily: "'Jost', system-ui, sans-serif",
                  letterSpacing: ".06em",
                  cursor: loading ? "not-allowed" : "pointer",
                  marginTop: ".25rem",
                }}
              >
                {loading ? "Guardando..." : "Cambiar contraseña"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
