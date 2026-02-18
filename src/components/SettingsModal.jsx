// ═══════════════════════ SETTINGS MODAL ═══════════════════════
// App preferences: theme, avatar color, AI config (admin only).
// Account management: email, password change, data export.

import { useState, useEffect } from "react";
import { useTalos } from "../context/TalosContext";
import { USER_COLORS } from "../lib/helpers";
import { THEME_LIST, applyTheme } from "../lib/themes";
import api from "../lib/api";
import S from "../lib/styles";

export default function SettingsModal({ onClose }) {
  const { user, updateUser } = useTalos();
  const [color, setColor] = useState(user.color);
  const [theme, setTheme] = useState(user.theme || "talos");
  const [originalTheme] = useState(user.theme || "talos");

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");

  // AI config (admin only)
  const [showAI, setShowAI] = useState(false);
  const [aiForm, setAiForm] = useState({ provider: "", model: "", baseUrl: "", supportsTools: true });
  const [aiProviders, setAiProviders] = useState([]);
  const [aiStatus, setAiStatus] = useState("");
  const [aiLoaded, setAiLoaded] = useState(false);

  const isAdmin = user.role === "admin";

  useEffect(() => {
    if (showAI && !aiLoaded) {
      api.get("/ai/config").then(cfg => {
        setAiForm({
          provider: cfg.provider || "anthropic",
          model: cfg.model || "",
          baseUrl: cfg.baseUrl || "",
          supportsTools: cfg.supportsTools !== false,
        });
        setAiProviders(cfg.providers || []);
        setAiStatus(cfg.enabled ? `Active: ${cfg.providerName}` : (cfg.hasKey ? "Configured but not active" : "No API key — set via environment variables"));
        setAiLoaded(true);
      }).catch(() => setAiLoaded(true));
    }
  }, [showAI]);

  function selectTheme(id) {
    setTheme(id);
    applyTheme(id);
  }

  async function save() {
    try {
      await api.put("/auth/account", { name: user.name, color, theme });
      updateUser({ color, theme });
      onClose();
    } catch (e) {
      alert("Save failed: " + e.message);
    }
  }

  function handleClose() {
    if (theme !== originalTheme) applyTheme(originalTheme);
    onClose();
  }

  async function changePassword() {
    setPasswordMsg("");
    if (newPassword.length < 8) { setPasswordMsg("Min 8 characters"); return; }
    if (newPassword !== confirmNewPassword) { setPasswordMsg("Passwords don't match"); return; }
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword });
      setPasswordMsg("Password updated!");
      setCurrentPassword(""); setNewPassword(""); setConfirmNewPassword("");
    } catch (e) { setPasswordMsg(e.message); }
  }

  async function exportData() {
    try {
      const token = localStorage.getItem("talos_token");
      const res = await fetch("/api/export", { headers: { "Authorization": `Bearer ${token}` } });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "talos-export.csv"; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { alert("Export failed: " + e.message); }
  }

  async function saveAI() {
    setAiStatus("Saving...");
    try {
      const body = { provider: aiForm.provider, model: aiForm.model, baseUrl: aiForm.baseUrl, supportsTools: aiForm.supportsTools };
      const res = await api.put("/ai/config", body);
      setAiStatus(res.enabled ? `Active: ${res.providerName}` : "Configuration saved — set API key via environment variables");
    } catch (e) { setAiStatus("Error: " + e.message); }
  }

  const PROVIDERS = aiProviders;

  return (
    <div style={{ position: "fixed", inset: 0, background: "var(--overlay)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ ...S.card, margin: 0, maxWidth: 360, width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={S.label}>Settings</div>
          <button onClick={handleClose} style={S.sm()}>✕</button>
        </div>

        {/* Account info */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 3, textTransform: "uppercase" }}>Email</div>
          <div style={{ fontSize: 13, color: "var(--text-light)" }}>{user.email}</div>
          {isAdmin && <span style={{ ...S.tag(), marginTop: 4, fontSize: 9, display: "inline-block" }}>ADMIN</span>}
        </div>

        {/* Theme selector */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 6, textTransform: "uppercase" }}>Theme</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {THEME_LIST.map(t => {
              const active = theme === t.id;
              return (
                <div key={t.id} onClick={() => selectTheme(t.id)} style={{
                  padding: "8px 10px", borderRadius: 8,
                  border: active ? "2px solid var(--accent)" : "1px solid var(--border2)",
                  background: active ? "var(--accent-bg)" : "transparent", cursor: "pointer",
                }}>
                  <div style={{ display: "flex", gap: 4, marginBottom: 5 }}>
                    <div style={{ width: 14, height: 14, borderRadius: "50%", background: t.preview.bg, border: "1px solid rgba(128,128,128,0.3)" }} />
                    <div style={{ width: 14, height: 14, borderRadius: "50%", background: t.preview.surface, border: "1px solid rgba(128,128,128,0.3)" }} />
                    <div style={{ width: 14, height: 14, borderRadius: "50%", background: t.preview.accent }} />
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: active ? "var(--accent)" : "var(--text)" }}>{t.name}</div>
                  <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 1 }}>{t.description}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Avatar color */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 3, textTransform: "uppercase" }}>Avatar Color</div>
          <div style={{ display: "flex", gap: 2 }}>
            {USER_COLORS.map(c => <div key={c} onClick={() => setColor(c)} style={{ width: 44, height: 44, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 24, height: 24, borderRadius: "50%", background: c, border: color === c ? "3px solid var(--text-bright)" : "3px solid transparent" }} /></div>)}
          </div>
        </div>

        {/* Change Password */}
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 8 }}>Change Password</div>
          <div style={{ marginBottom: 8 }}>
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} style={{ ...S.input, fontSize: 12 }} placeholder="Current password" autoComplete="current-password" />
          </div>
          <div style={{ marginBottom: 8 }}>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ ...S.input, fontSize: 12 }} placeholder="New password" autoComplete="new-password" />
          </div>
          <div style={{ marginBottom: 8 }}>
            <input type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} style={{ ...S.input, fontSize: 12 }} placeholder="Confirm new password" autoComplete="new-password" />
          </div>
          {passwordMsg && <div style={{ fontSize: 11, color: passwordMsg === "Password updated!" ? "#22c55e" : "#ef4444", marginBottom: 8 }}>{passwordMsg}</div>}
          <button onClick={changePassword} style={{ ...S.btn("ghost"), width: "100%", fontSize: 11 }}>Update Password</button>
        </div>

        {/* Data Export */}
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, marginBottom: 12 }}>
          <button onClick={exportData} style={{ ...S.btn("ghost"), width: "100%", fontSize: 11 }}>Export All Data (CSV)</button>
        </div>

        {/* AI Provider Config (admin only) */}
        {isAdmin && (
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, marginBottom: 12 }}>
            <div onClick={() => setShowAI(!showAI)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
              <div style={{ fontSize: 10, color: "var(--text-dim)", textTransform: "uppercase" }}>AI Coach Provider</div>
              <span style={{ color: "var(--text-dim)", fontSize: 12, transform: showAI ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▼</span>
            </div>
            {aiStatus && <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{aiStatus}</div>}
            {showAI && (
              <div style={{ marginTop: 8 }}>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 3, textTransform: "uppercase" }}>Provider</div>
                  <select value={aiForm.provider} onChange={e => {
                    const newProvider = e.target.value;
                    const models = PROVIDERS.find(p => p.id === newProvider)?.models || [];
                    setAiForm(f => ({ ...f, provider: newProvider, model: models[0]?.id || "" }));
                  }} style={{ ...S.input, fontSize: 12, height: 44 }}>
                    {PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 3, textTransform: "uppercase" }}>Model</div>
                  {(() => {
                    const providerModels = PROVIDERS.find(p => p.id === aiForm.provider)?.models || [];
                    const isKnownModel = providerModels.some(m => m.id === aiForm.model);
                    const isCustom = providerModels.length === 0 || (!isKnownModel && aiForm.model !== "");
                    return (
                      <>
                        {providerModels.length > 0 && (
                          <select value={isKnownModel ? aiForm.model : "__custom__"} onChange={e => {
                            if (e.target.value === "__custom__") setAiForm(f => ({ ...f, model: "" }));
                            else setAiForm(f => ({ ...f, model: e.target.value }));
                          }} style={{ ...S.input, fontSize: 12, height: 44 }}>
                            {providerModels.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                            <option value="__custom__">Custom model...</option>
                          </select>
                        )}
                        {isCustom && (
                          <input value={aiForm.model} onChange={e => setAiForm(f => ({ ...f, model: e.target.value }))}
                            style={{ ...S.input, fontSize: 12, marginTop: providerModels.length > 0 ? 4 : 0 }}
                            placeholder={providerModels.length > 0 ? "Enter model ID" : "e.g. llama3, mistral, deepseek-coder"} />
                        )}
                      </>
                    );
                  })()}
                </div>
                {aiForm.provider === "openai-compatible" && (
                  <>
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 3, textTransform: "uppercase" }}>Base URL</div>
                      <input value={aiForm.baseUrl} onChange={e => setAiForm(f => ({ ...f, baseUrl: e.target.value }))} style={{ ...S.input, fontSize: 12 }} placeholder="http://localhost:11434/v1" />
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--text-muted)", cursor: "pointer", marginBottom: 8 }}>
                      <input type="checkbox" checked={aiForm.supportsTools} onChange={e => setAiForm(f => ({ ...f, supportsTools: e.target.checked }))} />
                      Supports tool/function calling
                    </label>
                  </>
                )}
                <button onClick={saveAI} style={{ ...S.btn("ghost"), width: "100%", fontSize: 11 }}>Save AI Config</button>
                <div style={{ fontSize: 9, color: "var(--text-dim)", marginTop: 4, textAlign: "center" }}>API keys are set via environment variables.</div>
              </div>
            )}
          </div>
        )}

        <button onClick={save} style={{ ...S.btn("primary"), width: "100%" }}>Save</button>
      </div>
    </div>
  );
}
