// ═══════════════════════ LOGIN ═══════════════════════
// Extracted from App.jsx — Login function
//
// Modes: select (user list) | pin (enter PIN) | create (new user)
// Face ID / biometric auth works via Safari Keychain autofill on PIN field.
//
// NOTE: This entire component gets replaced by Clerk's <SignIn>/<SignUp>
// during Phase 3 (Authentication). For now, it's extracted as-is for
// clean decomposition.

import { useState, useEffect, useRef } from "react";
import { USER_COLORS } from "../lib/helpers";
import api from "../lib/api";
import S from "../lib/styles";

export default function Login({ onLogin }) {
  const [users, setUsers] = useState([]);
  const [mode, setMode] = useState("select"); // select | pin | create
  const [selected, setSelected] = useState(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");
  const [newPin, setNewPin] = useState("");
  const [newColor, setNewColor] = useState(USER_COLORS[0]);
  const pinRef = useRef(null);

  useEffect(() => {
    api.get("/users").then(setUsers).catch(() => {});
  }, []);

  async function selectUser(u) {
    setSelected(u);
    setError("");
    if (u.has_pin) {
      setMode("pin");
      setTimeout(() => pinRef.current?.focus(), 100);
    } else {
      try {
        await api.post(`/users/${u.id}/verify`, {});
        onLogin(u);
      } catch (e) {
        setError(e.message);
      }
    }
  }

  async function verifyPin() {
    try {
      await api.post(`/users/${selected.id}/verify`, { pin });
      onLogin(selected);
    } catch (e) {
      setError("Wrong PIN");
      setPin("");
    }
  }

  async function createUser() {
    if (!newName.trim()) return;
    try {
      const u = await api.post("/users", {
        name: newName,
        pin: newPin || undefined,
        color: newColor,
      });
      onLogin(u);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div
      style={{
        ...S.app,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100dvh",
        padding: 24,
      }}
    >
      {/* TALOS logo / title */}
      <div style={{ ...S.title, fontSize: 28, marginBottom: 32, justifyContent: "center" }}>
        Δ TALOS
      </div>

      {/* ── User Selection ── */}
      {mode === "select" && (
        <div style={{ width: "100%", maxWidth: 360 }}>
          {users.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ ...S.label, textAlign: "center", marginBottom: 16 }}>
                Select Profile
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))",
                  gap: 12,
                  justifyItems: "center",
                }}
              >
                {users.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => selectUser(u)}
                    style={{
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                      padding: 8,
                      borderRadius: 10,
                    }}
                  >
                    <div style={S.avatar(u.color, 56)}>
                      {u.name?.[0]?.toUpperCase()}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#e5e5e5",
                        textAlign: "center",
                      }}
                    >
                      {u.name}
                    </div>
                    {u.has_pin && (
                      <div style={{ fontSize: 9, color: "#525252" }}>🔒</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          <button
            onClick={() => {
              setMode("create");
              setError("");
            }}
            style={{ ...S.btn("ghost"), width: "100%", marginTop: 8 }}
          >
            + Create Profile
          </button>
        </div>
      )}

      {/* ── PIN Entry ── */}
      {mode === "pin" && selected && (
        <div style={{ width: "100%", maxWidth: 300, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={S.avatar(selected.color, 64)}>
              {selected.name?.[0]?.toUpperCase()}
            </div>
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#fafafa",
              marginTop: 12,
              marginBottom: 16,
            }}
          >
            {selected.name}
          </div>
          <input
            ref={pinRef}
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && verifyPin()}
            placeholder="Enter PIN"
            style={{
              ...S.input,
              textAlign: "center",
              fontSize: 20,
              letterSpacing: 8,
              marginBottom: 12,
            }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => {
                setMode("select");
                setPin("");
                setError("");
              }}
              style={{ ...S.btn("ghost"), flex: 1 }}
            >
              Back
            </button>
            <button
              onClick={verifyPin}
              style={{ ...S.btn("primary"), flex: 1 }}
            >
              Unlock
            </button>
          </div>
        </div>
      )}

      {/* ── Create User ── */}
      {mode === "create" && (
        <div style={{ width: "100%", maxWidth: 300 }}>
          <div style={{ ...S.label, textAlign: "center", marginBottom: 16 }}>
            New Profile
          </div>

          {/* Name */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "#737373", marginBottom: 4 }}>Name</div>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Your name"
              style={S.input}
              autoFocus
            />
          </div>

          {/* PIN (optional) */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "#737373", marginBottom: 4 }}>PIN (optional)</div>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              placeholder="Leave blank for no PIN"
              style={S.input}
            />
          </div>

          {/* Color picker */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "#737373", marginBottom: 6 }}>Color</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {USER_COLORS.map((c) => (
                <div
                  key={c}
                  onClick={() => setNewColor(c)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: c,
                    cursor: "pointer",
                    border: newColor === c ? "3px solid #fafafa" : "3px solid transparent",
                    opacity: newColor === c ? 1 : 0.5,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <div style={S.avatar(newColor, 48)}>
              {newName?.[0]?.toUpperCase() || "?"}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => {
                setMode("select");
                setNewName("");
                setNewPin("");
                setError("");
              }}
              style={{ ...S.btn("ghost"), flex: 1 }}
            >
              Back
            </button>
            <button
              onClick={createUser}
              disabled={!newName.trim()}
              style={{
                ...S.btn("primary"),
                flex: 1,
                opacity: newName.trim() ? 1 : 0.5,
              }}
            >
              Create
            </button>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div style={{ color: "#ef4444", fontSize: 12, marginTop: 12 }}>{error}</div>
      )}
    </div>
  );
}
