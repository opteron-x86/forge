// ═══════════════════════ LOGIN ═══════════════════════
// JWT auth: email/password login + registration.
// Modes: login | register

import { useState } from "react";
import { USER_COLORS } from "../lib/helpers";
import api from "../lib/api";
import S from "../lib/styles";

export default function Login({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [color, setColor] = useState(USER_COLORS[0]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function resetForm() {
    setEmail(""); setPassword(""); setConfirmPassword(""); setName(""); setError(""); setLoading(false);
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      api.setToken(res.token);
      onLogin(res.user);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirmPassword) { setError("Passwords don't match"); return; }
    setError(""); setLoading(true);
    try {
      const res = await api.post("/auth/register", { email, password, name, color });
      api.setToken(res.token);
      onLogin(res.user);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  const inputStyle = { ...S.input, marginBottom: 0 };

  return (
    <div style={{ ...S.app, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100dvh", padding: 32 }}>
      <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 4 }}>
        <img src="/talos-icon.svg" alt="" style={{ width: 32, height: 32, verticalAlign: "middle", marginRight: 8 }} />
        TALOS
      </div>
      <div style={{ color: "#525252", fontSize: 11, marginBottom: 40, letterSpacing: "2px", textTransform: "uppercase" }}>Unyielding</div>

      {/* ── LOGIN ── */}
      {mode === "login" && (
        <form onSubmit={handleLogin} style={{ width: "100%", maxWidth: 320 }} className="fade-in">
          <div style={S.label}>Sign In</div>
          <div style={{ ...S.card, margin: "8px 0", display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: "#525252", marginBottom: 4, textTransform: "uppercase" }}>Email</div>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder="you@example.com" autoFocus autoComplete="email" required />
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#525252", marginBottom: 4, textTransform: "uppercase" }}>Password</div>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} autoComplete="current-password" required />
            </div>
          </div>
          {error && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 8 }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ ...S.btn("primary"), width: "100%", marginTop: 12, opacity: loading ? 0.6 : 1 }}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
          <button type="button" onClick={() => { resetForm(); setMode("register"); }} style={{ ...S.btn("ghost"), width: "100%", marginTop: 8, fontSize: 12 }}>Create Account</button>
        </form>
      )}

      {/* ── REGISTER ── */}
      {mode === "register" && (
        <form onSubmit={handleRegister} style={{ width: "100%", maxWidth: 320 }} className="fade-in">
          <div style={S.label}>Create Account</div>
          <div style={{ ...S.card, margin: "8px 0", display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: "#525252", marginBottom: 4, textTransform: "uppercase" }}>Name</div>
              <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder="Your name" autoFocus required />
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#525252", marginBottom: 4, textTransform: "uppercase" }}>Email</div>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder="you@example.com" autoComplete="email" required />
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#525252", marginBottom: 4, textTransform: "uppercase" }}>Password</div>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} autoComplete="new-password" required />
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#525252", marginBottom: 4, textTransform: "uppercase" }}>Confirm Password</div>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={inputStyle} autoComplete="new-password" required />
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#525252", marginBottom: 4, textTransform: "uppercase" }}>Color</div>
              <div style={{ display: "flex", gap: 8 }}>
                {USER_COLORS.map(c => (
                  <div key={c} onClick={() => setColor(c)} style={{ width: 28, height: 28, borderRadius: "50%", background: c, cursor: "pointer", border: color === c ? "3px solid #fff" : "3px solid transparent" }} />
                ))}
              </div>
            </div>
          </div>
          {error && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 8 }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ ...S.btn("primary"), width: "100%", marginTop: 12, opacity: loading ? 0.6 : 1 }}>
            {loading ? "Creating..." : "Create Account"}
          </button>
          <button type="button" onClick={() => { resetForm(); setMode("login"); }} style={{ ...S.btn("ghost"), width: "100%", marginTop: 8, fontSize: 12 }}>Back to Sign In</button>
        </form>
      )}
    </div>
  );
}
