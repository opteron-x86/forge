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

  // MIGRATION NOTE: Copy the return JSX verbatim from App.jsx Login function.
  // It renders three mode views: user selection grid, PIN entry, create user form.
  // References: S, users, mode, selected, pin, error, newName, newPin, newColor,
  // pinRef, USER_COLORS, selectUser, verifyPin, createUser.

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

      {/* TODO: Copy the three mode views from App.jsx Login:
          - mode === "select": user avatar grid + create button
          - mode === "pin": PIN input with verify + back
          - mode === "create": name, PIN, color picker + create/back buttons
      */}

      {error && (
        <div style={{ color: "#ef4444", fontSize: 12, marginTop: 8 }}>{error}</div>
      )}
    </div>
  );
}
