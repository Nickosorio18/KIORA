import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@api/supabaseClient";

/* ═══════════════════════════════════════════════════════
   KYŌRA — Auth Callback
   Procesa tokens de confirmación de email, OAuth y
   recuperación de contraseña.
   Supabase redirige aquí después de verificar el correo.
   ═══════════════════════════════════════════════════════ */

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Verificando tu cuenta...");

  useEffect(() => {
    let redirected = false;

    // onAuthStateChange detecta PASSWORD_RECOVERY vs SIGNED_IN
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (redirected) return;

      if (event === "PASSWORD_RECOVERY") {
        redirected = true;
        setStatus("Redirigiendo para cambiar tu contraseña...");
        navigate("/auth/update-password");
        return;
      }

      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
        redirected = true;
        setStatus("¡Cuenta verificada! Bienvenido a KYŌRA. Redirigiendo...");
        setTimeout(() => navigate("/app/onboarding"), 3500);
      }
    });

    // Fallback: si después de 5s no disparó ningún evento, revisar sesión manualmente
    const timeout = setTimeout(async () => {
      if (redirected) return;
      redirected = true;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setStatus("¡Cuenta verificada! Bienvenido a KYŌRA. Redirigiendo...");
          setTimeout(() => navigate("/app/onboarding"), 3500);
        } else {
          setStatus("Verificación completa. Inicia sesión para continuar.");
          setTimeout(() => navigate("/app/login"), 3500);
        }
      } catch {
        setStatus("Error inesperado. Redirigiendo al login...");
        setTimeout(() => navigate("/app/login"), 2000);
      }
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
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
