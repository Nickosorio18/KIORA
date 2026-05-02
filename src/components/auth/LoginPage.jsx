import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@context/AuthContext";

/* ═══════════════════════════════════════════════════════
   KYŌRA — Login Page
   Página de inicio de sesión para usuarios existentes
   ═══════════════════════════════════════════════════════ */

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Jost:ital,wght@0,200;0,300;0,400;0,500;0,600;1,300&display=swap');

:root {
  --gold: #C8A96E;
  --gold-light: #E8D5A3;
  --gold-glow: rgba(200,169,110,.12);
  --charcoal: #1A1A1E;
  --charcoal-soft: #2A2A30;
  --cream: #FAF8F5;
  --cream-dark: #F2EDE5;
  --text-dark: #1A1A2E;
  --text-muted: #6B6B80;
  --text-light: #9A9189;
  --border: rgba(200,169,110,.15);
  --font-display: 'Playfair Display', Georgia, serif;
  --font-body: 'Jost', system-ui, sans-serif;
}
* { margin:0; padding:0; box-sizing:border-box; }

/* ── Split-screen wrapper ── */
.lgn {
  font-family: var(--font-body);
  min-height: 100vh;
  display: flex;
  color: var(--text-dark);
}

/* ── Brand panel (left) ── */
.lgn-panel {
  width: 42%;
  min-height: 100vh;
  background: var(--charcoal);
  display: flex;
  flex-direction: column;
  padding: 3rem;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}
.lgn-panel::before {
  content: '';
  position: absolute;
  top: -120px; right: -120px;
  width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(200,169,110,.1) 0%, transparent 65%);
  pointer-events: none;
}
.lgn-panel::after {
  content: '';
  position: absolute;
  bottom: -80px; left: -60px;
  width: 300px; height: 300px;
  background: radial-gradient(circle, rgba(200,169,110,.06) 0%, transparent 65%);
  pointer-events: none;
}
/* Decorative ring */
.lgn-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 460px;
  height: 460px;
  border-radius: 50%;
  border: 1px solid rgba(200,169,110,.06);
  pointer-events: none;
}
.lgn-ring::before {
  content: '';
  position: absolute;
  top: 40px; left: 40px; right: 40px; bottom: 40px;
  border-radius: 50%;
  border: 1px solid rgba(200,169,110,.04);
}

.lgn-panel-top {
  position: relative;
  z-index: 1;
  margin-bottom: auto;
}
.lgn-panel-logo {
  font-family: var(--font-display);
  font-size: 1.4rem;
  font-weight: 500;
  letter-spacing: .35em;
  color: rgba(255,255,255,.9);
  text-decoration: none;
  display: inline-block;
}
.lgn-panel-logo .ac { color: var(--gold); }

.lgn-panel-body {
  position: relative;
  z-index: 1;
  padding: 3rem 0;
}
.lgn-panel-quote {
  font-family: var(--font-display);
  font-size: 2.4rem;
  font-weight: 400;
  color: rgba(255,255,255,.92);
  line-height: 1.2;
  margin-bottom: 2.5rem;
  letter-spacing: -.01em;
}
.lgn-panel-quote em { color: var(--gold); font-style: italic; }

.lgn-panel-benefits { list-style: none; display: flex; flex-direction: column; gap: .9rem; }
.lgn-panel-benefit {
  display: flex;
  align-items: center;
  gap: .8rem;
  font-size: .82rem;
  font-weight: 300;
  color: rgba(255,255,255,.5);
  letter-spacing: .02em;
}
.lgn-benefit-dot {
  width: 18px; height: 18px;
  border-radius: 50%;
  background: rgba(200,169,110,.12);
  border: 1px solid rgba(200,169,110,.25);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.lgn-benefit-dot::after {
  content: '';
  width: 5px; height: 5px;
  border-radius: 50%;
  background: var(--gold);
}

.lgn-panel-foot {
  position: relative;
  z-index: 1;
  padding-top: 2rem;
  border-top: 1px solid rgba(255,255,255,.06);
  font-size: .65rem;
  font-weight: 300;
  letter-spacing: .1em;
  color: rgba(255,255,255,.2);
  text-transform: uppercase;
}

/* ── Form panel (right) ── */
.lgn-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--cream);
  position: relative;
}
.lgn-right-head {
  padding: 1.4rem 2rem;
  display: flex;
  justify-content: flex-end;
}
.lgn-back {
  font-size: .68rem;
  font-weight: 400;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--text-light);
  text-decoration: none;
  transition: color .25s;
}
.lgn-back:hover { color: var(--gold); }

.lgn-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 2.5rem 3rem;
}

.lgn-card {
  width: 100%;
  max-width: 400px;
  animation: lgnIn .55s cubic-bezier(.22,1,.36,1) both;
}
@keyframes lgnIn {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}

.lgn-label {
  font-size: .58rem;
  font-weight: 500;
  letter-spacing: .2em;
  text-transform: uppercase;
  color: var(--gold);
  margin-bottom: .8rem;
  display: flex;
  align-items: center;
  gap: .6rem;
}
.lgn-label::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(200,169,110,.15);
}

.lgn-title {
  font-family: var(--font-display);
  font-size: 2.2rem;
  font-weight: 400;
  color: var(--charcoal);
  line-height: 1.15;
  margin-bottom: .4rem;
}
.lgn-title em { font-style: italic; color: var(--gold); }

.lgn-sub {
  font-size: .84rem;
  font-weight: 300;
  color: var(--text-muted);
  line-height: 1.65;
  margin-bottom: 2rem;
}

.lgn-field { margin-bottom: 1.1rem; }
.lgn-label-f {
  display: block;
  font-size: .6rem;
  font-weight: 500;
  letter-spacing: .15em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: .45rem;
}
.lgn-input {
  width: 100%;
  padding: .88rem 1.1rem;
  border: 1.5px solid var(--border);
  border-radius: 3px;
  background: white;
  font-family: var(--font-body);
  font-size: .92rem;
  font-weight: 300;
  color: var(--text-dark);
  outline: none;
  transition: border-color .25s, box-shadow .25s;
}
.lgn-input:focus {
  border-color: var(--gold);
  box-shadow: 0 0 0 3px var(--gold-glow);
}
.lgn-input::placeholder { color: var(--text-light); font-weight: 300; }
.lgn-input[type="password"] { font-family: Verdana, sans-serif; font-size: 1.1rem; letter-spacing: 3px; }

.lgn-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.6rem;
  font-size: .75rem;
}
.lgn-check {
  display: flex;
  align-items: center;
  gap: .5rem;
  color: var(--text-muted);
  font-weight: 300;
  cursor: pointer;
}
.lgn-check input { accent-color: var(--gold); cursor: pointer; }
.lgn-forgot {
  color: var(--gold);
  text-decoration: none;
  transition: color .25s;
  font-weight: 400;
  background: none;
  border: none;
  font-family: var(--font-body);
  font-size: .75rem;
  cursor: pointer;
  padding: 0;
}
.lgn-forgot:hover { color: var(--charcoal); }

.lgn-btn {
  width: 100%;
  padding: 1rem;
  background: var(--charcoal);
  color: var(--gold-light);
  border: none;
  border-radius: 2px;
  font-family: var(--font-body);
  font-size: .72rem;
  font-weight: 500;
  letter-spacing: .18em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all .25s;
  margin-bottom: 1.4rem;
  position: relative;
  overflow: hidden;
}
.lgn-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(200,169,110,.08) 0%, transparent 60%);
  opacity: 0;
  transition: opacity .25s;
}
.lgn-btn:hover {
  background: var(--charcoal-soft);
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(26,26,46,.12);
}
.lgn-btn:hover::after { opacity: 1; }
.lgn-btn:disabled { opacity: .45; cursor: not-allowed; transform: none; box-shadow: none; }

.lgn-divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1.4rem 0;
  font-size: .62rem;
  font-weight: 400;
  letter-spacing: .15em;
  text-transform: uppercase;
  color: var(--text-light);
}
.lgn-divider::before, .lgn-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border);
}

.lgn-btn-g {
  width: 100%;
  padding: .82rem;
  background: white;
  color: var(--text-dark);
  border: 1.5px solid var(--border);
  border-radius: 2px;
  font-family: var(--font-body);
  font-size: .78rem;
  font-weight: 400;
  cursor: pointer;
  transition: all .25s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .6rem;
  margin-bottom: .6rem;
}
.lgn-btn-g:hover { border-color: var(--gold); background: rgba(200,169,110,.04); }
.lgn-btn-g svg { width: 16px; height: 16px; }

.lgn-signup {
  text-align: center;
  margin-top: 1.4rem;
  font-size: .8rem;
  color: var(--text-muted);
  font-weight: 300;
}
.lgn-signup a {
  color: var(--gold);
  text-decoration: none;
  font-weight: 500;
  transition: color .25s;
}
.lgn-signup a:hover { color: var(--charcoal); }

.lgn-err {
  padding: .7rem 1rem;
  background: #FFF5F5;
  border: 1px solid #FECACA;
  border-radius: 3px;
  color: #B91C1C;
  font-size: .78rem;
  margin-bottom: 1rem;
}

/* ── Responsive ── */
@media (max-width: 860px) {
  .lgn-panel { width: 36%; padding: 2.5rem 2rem; }
  .lgn-panel-quote { font-size: 1.9rem; }
}
@media (max-width: 640px) {
  .lgn { flex-direction: column; min-height: 100svh; }
  .lgn-panel {
    width: 100%;
    height: auto;
    min-height: 0;
    flex-shrink: 0;
    padding: 1.25rem 1.5rem;
    flex-direction: row;
    align-items: center;
    gap: 1rem;
  }
  .lgn-ring { display: none; }
  .lgn-panel-body { display: none; }
  .lgn-panel-foot { display: none; }
  .lgn-panel-top { margin-bottom: 0; flex: 1; }
  .lgn-panel-logo { font-size: 1rem; }
  .lgn-right { flex: 1; overflow-y: auto; }
  .lgn-right-head { padding: .75rem 1.25rem; }
  .lgn-content { padding: 1.25rem 1.5rem 2rem; }
  .lgn-title { font-size: 1.6rem; }
}
`;

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signUp, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("login"); // "login" | "signup" | "reset"

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (mode === "reset") {
      if (!email) { setError("Ingresa tu correo."); return; }
      setLoading(true);
      const { error: err } = await resetPassword(email);
      setLoading(false);
      if (err) { setError(err.message); return; }
      setSuccess("Revisa tu correo para restablecer tu contraseña.");
      return;
    }

    if (!email || !password) {
      setError("Ingresa tu correo y contraseña.");
      return;
    }

    if (mode === "signup" && password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    if (mode === "signup") {
      const { error: err } = await signUp(email, password);
      setLoading(false);
      if (err) { setError(err.message); return; }
      setSuccess("Cuenta creada. Revisa tu correo para confirmar.");
      return;
    }

    // Store remember preference before signIn so custom storage uses correct backend
    localStorage.setItem('kyora_remember', remember ? 'true' : 'false');

    // Login
    const { error: err } = await signIn(email, password);
    setLoading(false);
    if (err) {
      setError("Correo o contraseña incorrectos.");
      return;
    }
    navigate("/app/dashboard");
  }

  const titles = {
    login: { label: "Bienvenido de nuevo", h1Start: "Inicia ", h1Em: "sesión", sub: "Tu plan te espera donde lo dejaste." },
    signup: { label: "Empieza hoy", h1Start: "Crea tu ", h1Em: "cuenta", sub: "Planes personalizados, coaching IA y seguimiento de progreso." },
    reset: { label: "Recuperar acceso", h1Start: "Nueva ", h1Em: "contraseña", sub: "Te enviaremos un link para restablecer tu contraseña." },
  };
  const t = titles[mode];

  return (
    <>
      <Helmet>
        <title>Iniciar Sesión — KYŌRA</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <style>{styles}</style>
      <div className="lgn">

        {/* ── Brand panel ── */}
        <div className="lgn-panel">
          <div className="lgn-ring" />
          <div className="lgn-panel-top">
            <Link to="/" className="lgn-panel-logo">KY<span className="ac">Ō</span>RA</Link>
          </div>
          <div className="lgn-panel-body">
            <p className="lgn-panel-quote">
              Tu espacio personal<br />
              de <em>salud</em><br />
              y bienestar.
            </p>
            <ul className="lgn-panel-benefits">
              {["Planes de alimentación con IA", "Coach nutricional 24/7", "Seguimiento de progreso real"].map((b) => (
                <li className="lgn-panel-benefit" key={b}>
                  <span className="lgn-benefit-dot" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div className="lgn-panel-foot">© 2026 KYŌRA · Nutrición Inteligente</div>
        </div>

        {/* ── Form panel ── */}
        <div className="lgn-right">
          <div className="lgn-right-head">
            <Link to="/" className="lgn-back">← Volver al inicio</Link>
          </div>

          <div className="lgn-content">
            <div className="lgn-card">
              <div className="lgn-label">{t.label}</div>
              <h1 className="lgn-title">{t.h1Start}<em>{t.h1Em}</em></h1>
              <p className="lgn-sub">{t.sub}</p>

              <form onSubmit={handleSubmit}>
                {error && <div className="lgn-err">{error}</div>}
                {success && <div className="lgn-err" style={{ background: "#F0FAF0", borderColor: "#BBE5BB", color: "#166534" }}>{success}</div>}

                <div className="lgn-field">
                  <label className="lgn-label-f">Correo electrónico</label>
                  <input
                    className="lgn-input"
                    type="email"
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                  />
                </div>

                {mode !== "reset" && (
                  <div className="lgn-field">
                    <label className="lgn-label-f">Contraseña {mode === "signup" && <span style={{ fontWeight: 300, textTransform: "none", letterSpacing: 0 }}>(mínimo 6 caracteres)</span>}</label>
                    <input
                      className="lgn-input"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                )}

                {mode === "login" && (
                  <div className="lgn-row">
                    <label className="lgn-check">
                      <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                      Recordarme
                    </label>
                    <button type="button" className="lgn-forgot" onClick={() => { setMode("reset"); setError(""); setSuccess(""); }}>
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                )}

                <button type="submit" className="lgn-btn" disabled={loading}>
                  {loading
                    ? "Procesando..."
                    : mode === "login" ? "Iniciar sesión"
                    : mode === "signup" ? "Crear cuenta"
                    : "Enviar link de recuperación"
                  }
                </button>
              </form>

              {mode === "login" && (
                <div className="lgn-signup">
                  ¿No tienes cuenta?{" "}
                  <a href="#" onClick={(e) => { e.preventDefault(); setMode("signup"); setError(""); setSuccess(""); }}>Crea una gratis</a>
                </div>
              )}
              {mode === "signup" && (
                <div className="lgn-signup">
                  ¿Ya tienes cuenta?{" "}
                  <a href="#" onClick={(e) => { e.preventDefault(); setMode("login"); setError(""); setSuccess(""); }}>Inicia sesión</a>
                </div>
              )}
              {mode === "reset" && (
                <div className="lgn-signup">
                  <a href="#" onClick={(e) => { e.preventDefault(); setMode("login"); setError(""); setSuccess(""); }}>← Volver al login</a>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
