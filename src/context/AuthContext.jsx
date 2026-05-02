import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@api/supabaseClient";

/* ═══════════════════════════════════════════════════════
   KYŌRA — AuthContext (Supabase Auth)
   Sesión real con email/password.
   Escucha cambios de auth y expone estado + helpers.
   ═══════════════════════════════════════════════════════ */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);     // Supabase session object
  const [user, setUser] = useState(null);            // Supabase user object
  const [loading, setLoading] = useState(true);      // true while checking initial session

  // ── Listen to auth state changes ──
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      // If remember=false and this is a fresh browser open (no sessionStorage flag),
      // sign the user out so the session doesn't persist across browser restarts.
      if (s && localStorage.getItem('kyora_remember') === 'false' &&
          !sessionStorage.getItem('kyora_session_alive')) {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ── Auth actions ──

  /**
   * Registrar nuevo usuario con email y contraseña.
   * @returns {{ error: Error|null }}
   */
  async function signUp(email, password) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  }

  /**
   * Iniciar sesión con email y contraseña.
   * @returns {{ error: Error|null }}
   */
  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }

  /**
   * Cerrar sesión.
   */
  async function signOut() {
    await supabase.auth.signOut();
  }

  /**
   * Enviar email de recuperación de contraseña.
   * @returns {{ error: Error|null }}
   */
  async function resetPassword(email) {
    const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/callback`,
    });
    return { error };
  }

  const isAuthenticated = !!session;

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        isAuthenticated,
        signUp,
        signIn,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
