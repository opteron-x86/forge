// ═══════════════════════ LOGIN ═══════════════════════
// Extracted from App.jsx — Login function
//
// Modes: select (user list) | pin (enter PIN) | create (new user)
// Face ID / biometric auth works via Safari Keychain autofill on PIN field.

import { useState, useEffect, useRef } from "react";
import { USER_COLORS } from "../lib/helpers";
import api from "../lib/api";
import S from "../lib/styles";

export default function Login({ onLogin }) {
  const [users, setUsers] = useState([]);
  const [mode, setMode] = useState("select");
  const [selected, setSelected] = useState(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");
  const [newPin, setNewPin] = useState("");
  const [newColor, setNewColor] = useState(USER_COLORS[0]);
  const pinRef = useRef(null);

  useEffect(() => { api.get("/users").then(setUsers).catch(() => {}); }, []);

  async function selectUser(u) {
    setSelected(u);
    setError("");
    if (u.has_pin) { setMode("pin"); setTimeout(() => pinRef.current?.focus(), 100); }
    else { try { await api.post(`/users/${u.id}/verify`, {}); onLogin(u); } catch(e) { setError(e.message); } }
  }

  async function verifyPin() {
    try {
      await api.post(`/users/${selected.id}/verify`, { pin });
      onLogin(selected);
    } catch(e) { setError("Wrong PIN"); setPin(""); }
  }

  async function createUser() {
    if (!newName.trim()) return;
    try {
      const u = await api.post("/users", { name: newName, pin: newPin || undefined, color: newColor });
      onLogin(u);
    } catch(e) { setError(e.message); }
  }

  return (
    <div style={{ ...S.app, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100dvh", padding: 32, paddingBottom: 32 }}>
      <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 4 }}><img src="/talos-icon.svg" alt="" style={{ width: 32, height: 32, verticalAlign: "middle", marginRight: 8 }} />TALOS</div>
      <div style={{ color: "#525252", fontSize: 11, marginBottom: 40, letterSpacing: "2px", textTransform: "uppercase" }}>Unyielding</div>

      {mode === "select" && (
        <div style={{ width: "100%", maxWidth: 320 }} className="fade-in">
          {users.length > 0 && <div style={S.label}>Select Profile</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            {users.map(u => (
              <div key={u.id} onClick={() => selectUser(u)} style={{ ...S.card, margin: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={S.avatar(u.color)}>{u.name[0].toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#fafafa" }}>{u.name}</div>
                </div>
                <span style={{ color: "#525252" }}>→</span>
              </div>
            ))}
          </div>
          <button onClick={() => setMode("create")} style={{ ...S.btn("ghost"), width: "100%" }}>+ New Profile</button>
        </div>
      )}

      {mode === "pin" && selected && (
        <div style={{ width: "100%", maxWidth: 280, textAlign: "center" }} className="fade-in">
          <div style={S.avatar(selected.color, 56)}>{selected.name[0].toUpperCase()}</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#fafafa", marginTop: 12 }}>{selected.name}</div>
          <div style={{ marginTop: 16 }}>
            <input
              ref={pinRef} type="password" inputMode="numeric" autoComplete="current-password"
              value={pin} onChange={e => { setPin(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && verifyPin()}
              style={{ ...S.input, textAlign: "center", fontSize: 24, letterSpacing: 12 }}
              placeholder="PIN"
            />
          </div>
          {error && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 8 }}>{error}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button onClick={() => { setMode("select"); setPin(""); setError(""); }} style={{ ...S.btn("ghost"), flex: 1 }}>Back</button>
            <button onClick={verifyPin} style={{ ...S.btn("primary"), flex: 1 }}>Enter</button>
          </div>
        </div>
      )}

      {mode === "create" && (
        <div style={{ width: "100%", maxWidth: 320 }} className="fade-in">
          <div style={S.label}>Create Profile</div>
          <div style={{ ...S.card, margin: "8px 0" }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: "#525252", marginBottom: 4, textTransform: "uppercase" }}>Name</div>
              <input value={newName} onChange={e => setNewName(e.target.value)} style={S.input} placeholder="Your name" autoFocus />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: "#525252", marginBottom: 4, textTransform: "uppercase" }}>PIN (optional)</div>
              <input type="password" inputMode="numeric" autoComplete="new-password" value={newPin} onChange={e => setNewPin(e.target.value)} style={S.input} placeholder="4-6 digits" />
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#525252", marginBottom: 4, textTransform: "uppercase" }}>Color</div>
              <div style={{ display: "flex", gap: 8 }}>
                {USER_COLORS.map(c => (
                  <div key={c} onClick={() => setNewColor(c)} style={{ width: 28, height: 28, borderRadius: "50%", background: c, cursor: "pointer", border: newColor === c ? "3px solid #fff" : "3px solid transparent" }} />
                ))}
              </div>
            </div>
          </div>
          {error && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 8 }}>{error}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={() => setMode("select")} style={{ ...S.btn("ghost"), flex: 1 }}>Back</button>
            <button onClick={createUser} style={{ ...S.btn("primary"), flex: 1 }}>Create</button>
          </div>
        </div>
      )}
    </div>
  );
}
