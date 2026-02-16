// ═══════════════════════ LOGIN ═══════════════════════
// JWT auth: email/password login + registration.
// Includes "Claim Account" flow for existing PIN-based users.
//
// Modes: login | register | claim-select | claim-verify

import { useState, useEffect, useRef } from "react";
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

  // Claim flow state
  const [legacyUsers, setLegacyUsers] = useState([]);
  const [selectedLegacy, setSelectedLegacy] = useState(null);
  const [pin, setPin] = useState("");
  const pinRef = useRef(null);

  // Load legacy users when entering claim mode
  useEffect(() => {
    if (mode === "claim-select") {
      api.get("/auth/legacy-users").then(setLegacyUsers).catch(() => setLegacyUsers([]));
    }
  }, [mode]);

  function resetForm() {
    setEmail(""); setPassword(""); setConfirmPassword(""); setName(""); setError(""); setPin("");
    setSelectedLegacy(null); setLoading(false);
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

  async function handleClaim(e) {
    e.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirmPassword) { setError("Passwords don't match"); return; }
    setError(""); setLoading(true);
    try {
      const res = await api.post("/auth/claim", {
        userId: selectedLegacy.id,
        pin: selectedLegacy.has_pin ? pin : undefined,
        email,
        password,
        name: name || selectedLegacy.name,
      });
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
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} placeholder="••••••••" autoComplete="current-password" required />
            </div>
          </div>
          {error && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 8 }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ ...S.btn("primary"), width: "100%", marginTop: 12, opacity: loading ? 0.6 : 1 }}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button type="button" onClick={() => { resetForm(); setMode("register"); }} style={{ ...S.btn("ghost"), flex: 1, fontSize: 12 }}>Create Account</button>
            <button type="button" onClick={() => { resetForm(); setMode("claim-select"); }} style={{ ...S.btn("ghost"), flex: 1, fontSize: 12 }}>Claim Existing</button>
          </div>
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
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} placeholder="Min 8 characters" autoComplete="new-password" required />
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#525252", marginBottom: 4, textTransform: "uppercase" }}>Confirm Password</div>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={inputStyle} placeholder="••••••••" autoComplete="new-password" required />
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

      {/* ── CLAIM: Select Legacy User ── */}
      {mode === "claim-select" && (
        <div style={{ width: "100%", maxWidth: 320 }} className="fade-in">
          <div style={S.label}>Claim Existing Account</div>
          <div style={{ color: "#737373", fontSize: 12, marginBottom: 16 }}>
            Select your old profile to link it with a new email & password.
          </div>
          {legacyUsers.length === 0 ? (
            <div style={{ ...S.card, margin: "8px 0", textAlign: "center", color: "#737373", fontSize: 13 }}>
              No unclaimed accounts found.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {legacyUsers.map(u => (
                <div
                  key={u.id}
                  onClick={() => {
                    setSelectedLegacy(u);
                    setName(u.name);
                    setColor(u.color);
                    setMode("claim-verify");
                    if (u.has_pin) setTimeout(() => pinRef.current?.focus(), 100);
                  }}
                  style={{ ...S.card, margin: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}
                >
                  <div style={S.avatar(u.color)}>{u.name[0].toUpperCase()}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fafafa" }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: "#737373" }}>{u.has_pin ? "PIN protected" : "No PIN"}</div>
                  </div>
                  <span style={{ color: "#525252" }}>→</span>
                </div>
              ))}
            </div>
          )}
          <button type="button" onClick={() => { resetForm(); setMode("login"); }} style={{ ...S.btn("ghost"), width: "100%", fontSize: 12 }}>Back to Sign In</button>
        </div>
      )}

      {/* ── CLAIM: Verify + Set Credentials ── */}
      {mode === "claim-verify" && selectedLegacy && (
        <form onSubmit={handleClaim} style={{ width: "100%", maxWidth: 320 }} className="fade-in">
          <div style={S.label}>Claim: {selectedLegacy.name}</div>
          <div style={{ ...S.card, margin: "8px 0", display: "flex", flexDirection: "column", gap: 12 }}>
            {selectedLegacy.has_pin && (
              <div>
                <div style={{ fontSize: 10, color: "#525252", marginBottom: 4, textTransform: "uppercase" }}>Current PIN</div>
                <input ref={pinRef} type="password" inputMode="numeric" value={pin} onChange={e => setPin(e.target.value)} style={inputStyle} placeholder="Enter your old PIN" autoComplete="off" required />
              </div>
            )}
            <div>
              <div style={{ fontSize: 10, color: "#525252", marginBottom: 4, textTransform: "uppercase" }}>Email</div>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder="you@example.com" autoComplete="email" required />
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#525252", marginBottom: 4, textTransform: "uppercase" }}>New Password</div>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} placeholder="Min 8 characters" autoComplete="new-password" required />
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#525252", marginBottom: 4, textTransform: "uppercase" }}>Confirm Password</div>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={inputStyle} placeholder="••••••••" autoComplete="new-password" required />
            </div>
          </div>
          {error && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 8 }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ ...S.btn("primary"), width: "100%", marginTop: 12, opacity: loading ? 0.6 : 1 }}>
            {loading ? "Claiming..." : "Claim Account"}
          </button>
          <button type="button" onClick={() => { setError(""); setPin(""); setMode("claim-select"); }} style={{ ...S.btn("ghost"), width: "100%", marginTop: 8, fontSize: 12 }}>Back</button>
        </form>
      )}
    </div>
  );
}
