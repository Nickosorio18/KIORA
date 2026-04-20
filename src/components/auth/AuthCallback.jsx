import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@api/supabaseClient";

/* ═══════════════════════════════════════════════════════
   KYŌRA — Auth Callback
   Procesa tokens de confirmación de email y OAuth.
   Supabase redirige aquí después de verificar el correo.
   ═══════════════════════════════════════════════════════ */

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Verificando tu cuenta...");

  useEffect(() => {
    async function handleCallback() {
      try {
        // Supabase detecta automáticamente los tokens del URL hash/query
        // gracias a detectSessionInUrl: true en el client.
        // Solo necesitamos esperar a que se resuelva la sesión.
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          setStatus("Hubo un error al verificar tu cuenta. Intenta iniciar sesión.");
          setTimeout(() => navigate("/app/login"), 3000);
          return;
        }

        if (session) {
          setStatus("¡Cuenta verificada! Bienvenido a KYŌRA. Redirigiendo...");
          setTimeout(() => navigate("/app/onboarding"), 3500);
        } else {
          // Puede que el token aún esté procesándose
          // Esperamos un momento y reintentamos
          setTimeout(async () => {
            const { data: { session: s2 } } = await supabase.auth.getSession();
            if (s2) {
              setStatus("¡Cuenta verificada! Bienvenido a KYŌRA. Redirigiendo...");
              setTimeout(() => navigate("/app/onboarding"), 3500);
            } else {
              setStatus("Verificación completa. Inicia sesión para continuar.");
              setTimeout(() => navigate("/app/login"), 3500);
            }
          }, 1500);
        }
      } catch {
        setStatus("Error inesperado. Redirigiendo al login...");
        setTimeout(() => navigate("/app/login"), 2000);
      }
    }

    handleCallback();
  }, [navigate]);

  return (
    <div style={{
      fontFamily: "'Jost', system-ui, sans-serif",
      background: "#FAF8F5",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      color: "#1A1A2E",
    }}>
      <div style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: "1.3rem",
        fontWeight: 500,
        letterSpacing: ".3em",
        marginBottom: "2rem",
      }}>
        KY<span style={{ color: "#C8A96E", fontWeight: 700 }}>Ō</span>RA
      </div>
      <div style={{
        background: "white",
        border: "1px solid rgba(200,169,110,.15)",
        borderRadius: "4px",
        padding: "2.5rem 3rem",
        textAlign: "center",
        boxShadow: "0 24px 60px rgba(26,26,46,.04)",
        maxWidth: "420px",
      }}>
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
        }}>
          ✓
        </div>
        <p style={{
          fontSize: ".95rem",
          fontWeight: 300,
          color: "#6B6B80",
          lineHeight: 1.6,
        }}>
          {status}
        </p>
      </div>
    </div>
  );
}
