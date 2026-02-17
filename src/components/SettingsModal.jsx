// ═══════════════════════ SETTINGS MODAL ═══════════════════════
// App preferences: theme, avatar color, rest timer config, RPE/RIR scale,
// AI config (admin only).

import { useState, useEffect } from "react";
import { useTalos } from "../context/TalosContext";
import { USER_COLORS } from "../lib/helpers";
import { THEME_LIST, THEMES, applyTheme } from "../lib/themes";
import api from "../lib/api";
import S from "../lib/styles";

export default function SettingsModal({ onClose }) {
  const { user, updateUser, profile, updateProfile } = useTalos();
  const [name, setName] = useState(user.name);
  const [color, setColor] = useState(user.color);
  const [theme, setTheme] = useState(user.theme || "talos");
  const [originalTheme] = useState(user.theme || "talos");

  // Rest timer settings
  const [restTimerEnabled, setRestTimerEnabled] = useState(profile.restTimerEnabled !== false);
  const [restCompound, setRestCompound] = useState(profile.restTimerCompound || 150);
  const [restIsolation, setRestIsolation] = useState(profile.restTimerIsolation || 90);

  // Intensity scale (RPE vs RIR)
  const [intensityScale, setIntensityScale] = useState(profile.intensityScale || "rpe");

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
      // Save account settings (name, color, theme)
      await api.put("/auth/account", { name, color, theme });
      updateUser({ name, color, theme });

      // Save profile settings (rest timer, intensity scale)
      await updateProfile({
        ...profile,
        restTimerEnabled,
        restTimerCompound: restCompound,
        restTimerIsolation: restIsolation,
        intensityScale,
      });

      onClose();
    } catch (e) {
      alert("Save failed: " + e.message);
    }
  }

  function handleClose() {
    if (theme !== originalTheme) applyTheme(originalTheme);
    onClose();
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

        {/* Name */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 3, textTransform: "uppercase" }}>Name</div>
          <input value={name} onChange={e => setName(e.target.value)} style={S.input} />
        </div>

        {/* Theme selector */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 6, textTransform: "uppercase" }}>Theme</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {THEME_LIST.map(t => {
              const active = theme === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => selectTheme(t.id)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: active ? "2px solid var(--accent)" : "1px solid var(--border2)",
                    background: active ? "var(--accent-bg)" : "transparent",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
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

        {/* Intensity Scale (RPE / RIR) */}
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 6, textTransform: "uppercase" }}>Intensity Scale</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => setIntensityScale("rpe")}
              style={{
                ...S.sm(intensityScale === "rpe" ? "primary" : "ghost"),
                flex: 1,
                padding: "8px 10px",
                fontSize: 11,
              }}
            >
              RPE (1–10)
            </button>
            <button
              onClick={() => setIntensityScale("rir")}
              style={{
                ...S.sm(intensityScale === "rir" ? "primary" : "ghost"),
                flex: 1,
                padding: "8px 10px",
                fontSize: 11,
              }}
            >
              RIR (0–5)
            </button>
          </div>
          <div style={{ fontSize: 9, color: "var(--text-dim)", marginTop: 4 }}>
            {intensityScale === "rpe" ? "Rate of Perceived Exertion (10 = max effort)" : "Reps In Reserve (0 = nothing left)"}
          </div>
        </div>

        {/* Rest Timer Toggle + Config */}
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: "var(--text-dim)", textTransform: "uppercase" }}>Rest Timer</div>
            <label style={{ position: "relative", display: "inline-block", width: 40, height: 22, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={restTimerEnabled}
                onChange={e => setRestTimerEnabled(e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: "absolute",
                inset: 0,
                borderRadius: 11,
                background: restTimerEnabled ? "var(--accent)" : "var(--surface2)",
                border: "1px solid var(--border2)",
                transition: "background 0.2s",
              }}>
                <span style={{
                  position: "absolute",
                  top: 2,
                  left: restTimerEnabled ? 20 : 2,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "var(--text-bright)",
                  transition: "left 0.2s",
                }} />
              </span>
            </label>
          </div>
          {restTimerEnabled && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div>
                <div style={{ fontSize: 9, color: "var(--text-dim)", marginBottom: 3, textTransform: "uppercase" }}>Compound (sec)</div>
                <input type="number" inputMode="numeric" value={restCompound} onChange={e => setRestCompound(Number(e.target.value))} style={S.smInput} />
              </div>
              <div>
                <div style={{ fontSize: 9, color: "var(--text-dim)", marginBottom: 3, textTransform: "uppercase" }}>Isolation (sec)</div>
                <input type="number" inputMode="numeric" value={restIsolation} onChange={e => setRestIsolation(Number(e.target.value))} style={S.smInput} />
              </div>
            </div>
          )}
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
