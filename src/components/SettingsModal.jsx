// ═══════════════════════ SETTINGS MODAL ═══════════════════════
// Extracted from App.jsx — SettingsModal function

import { useState, useEffect } from "react";
import { useTalos } from "../context/TalosContext";
import { USER_COLORS } from "../lib/helpers";
import api from "../lib/api";
import S from "../lib/styles";

export default function SettingsModal({ onClose, onLogout }) {
  const { user } = useTalos();
  const [name, setName] = useState(user.name);
  const [newPin, setNewPin] = useState("");
  const [color, setColor] = useState(user.color);
  const [showAI, setShowAI] = useState(false);
  const [aiForm, setAiForm] = useState({ provider: "", model: "", apiKey: "", baseUrl: "", supportsTools: true });
  const [aiStatus, setAiStatus] = useState("");
  const [aiLoaded, setAiLoaded] = useState(false);

  useEffect(() => {
    if (showAI && !aiLoaded) {
      api.get("/ai/config").then(cfg => {
        setAiForm({
          provider: cfg.provider || "anthropic",
          model: cfg.model || "",
          apiKey: "",
          baseUrl: cfg.baseUrl || "",
          supportsTools: cfg.supportsTools !== false,
        });
        setAiStatus(cfg.enabled ? `Active: ${cfg.providerName}` : "Not configured");
        setAiLoaded(true);
      }).catch(() => setAiLoaded(true));
    }
  }, [showAI]);

  async function save() {
    const payload = { name, color };
    if (newPin) payload.pin = newPin;
    await api.put(`/users/${user.id}`, payload);
    onClose();
    window.location.reload();
  }

  async function saveAI() {
    setAiStatus("Saving...");
    try {
      const body = { provider: aiForm.provider, model: aiForm.model, baseUrl: aiForm.baseUrl, supportsTools: aiForm.supportsTools };
      if (aiForm.apiKey) body.apiKey = aiForm.apiKey;
      const res = await api.put("/ai/config", body);
      setAiStatus(res.enabled ? `Active: ${res.providerName}` : "Configuration saved (no API key)");
    } catch (e) { setAiStatus("Error: " + e.message); }
  }

  const PROVIDERS = [
    { id: "anthropic", label: "Anthropic (Claude)", models: [
      { id: "claude-opus-4-6", label: "Claude Opus 4.6" },
      { id: "claude-sonnet-4-5-20250929", label: "Claude Sonnet 4.5" },
      { id: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
      { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
    ]},
    { id: "openai", label: "OpenAI", models: [
      { id: "gpt-4.1", label: "GPT-4.1" },
      { id: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
      { id: "gpt-4o", label: "GPT-4o" },
      { id: "gpt-4o-mini", label: "GPT-4o Mini" },
      { id: "o4-mini", label: "o4 Mini" },
    ]},
    { id: "gemini", label: "Google Gemini", models: [
      { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
      { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
    ]},
    { id: "openai-compatible", label: "Custom (Ollama, LM Studio, etc.)", models: [] },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ ...S.card, margin: 0, maxWidth: 360, width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={S.label}>Settings</div>
          <button onClick={onClose} style={S.sm()}>✕</button>
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: "#525252", marginBottom: 3, textTransform: "uppercase" }}>Name</div>
          <input value={name} onChange={e => setName(e.target.value)} style={S.input} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: "#525252", marginBottom: 3, textTransform: "uppercase" }}>New PIN (leave blank to keep current)</div>
          <input type="password" inputMode="numeric" autoComplete="new-password" value={newPin} onChange={e => setNewPin(e.target.value)} style={S.input} placeholder="••••" />
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: "#525252", marginBottom: 3, textTransform: "uppercase" }}>Color</div>
          <div style={{ display: "flex", gap: 8 }}>
            {USER_COLORS.map(c => <div key={c} onClick={() => setColor(c)} style={{ width: 24, height: 24, borderRadius: "50%", background: c, cursor: "pointer", border: color === c ? "3px solid #fff" : "3px solid transparent" }} />)}
          </div>
        </div>

        {/* AI Provider Config */}
        <div style={{ borderTop: "1px solid #262626", paddingTop: 12, marginBottom: 12 }}>
          <div onClick={() => setShowAI(!showAI)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
            <div style={{ fontSize: 10, color: "#525252", textTransform: "uppercase" }}>AI Coach Provider</div>
            <span style={{ color: "#525252", fontSize: 12, transform: showAI ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▼</span>
          </div>
          {aiStatus && <div style={{ fontSize: 10, color: "#737373", marginTop: 2 }}>{aiStatus}</div>}
        </div>

        {showAI && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: "#525252", marginBottom: 3, textTransform: "uppercase" }}>Provider</div>
              <select value={aiForm.provider} onChange={e => {
                const newProvider = e.target.value;
                const models = PROVIDERS.find(p => p.id === newProvider)?.models || [];
                setAiForm(f => ({ ...f, provider: newProvider, model: models[0]?.id || "" }));
              }} style={{ ...S.input, fontSize: 12 }}>
                {PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: "#525252", marginBottom: 3, textTransform: "uppercase" }}>Model</div>
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
                      }} style={{ ...S.input, fontSize: 12 }}>
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
            {aiForm.provider !== "openai-compatible" && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10, color: "#525252", marginBottom: 3, textTransform: "uppercase" }}>API Key (leave blank to keep current)</div>
                <input type="password" value={aiForm.apiKey} onChange={e => setAiForm(f => ({ ...f, apiKey: e.target.value }))} style={{ ...S.input, fontSize: 12 }} placeholder="sk-..." />
              </div>
            )}
            {aiForm.provider === "openai-compatible" && (
              <>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 10, color: "#525252", marginBottom: 3, textTransform: "uppercase" }}>Base URL</div>
                  <input value={aiForm.baseUrl} onChange={e => setAiForm(f => ({ ...f, baseUrl: e.target.value }))} style={{ ...S.input, fontSize: 12 }} placeholder="http://localhost:11434/v1" />
                </div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 10, color: "#525252", marginBottom: 3, textTransform: "uppercase" }}>API Key (optional for local)</div>
                  <input type="password" value={aiForm.apiKey} onChange={e => setAiForm(f => ({ ...f, apiKey: e.target.value }))} style={{ ...S.input, fontSize: 12 }} placeholder="Leave blank for Ollama" />
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "#737373", cursor: "pointer", marginBottom: 8 }}>
                  <input type="checkbox" checked={aiForm.supportsTools} onChange={e => setAiForm(f => ({ ...f, supportsTools: e.target.checked }))} />
                  Supports tool/function calling
                </label>
              </>
            )}
            <button onClick={saveAI} style={{ ...S.btn("ghost"), width: "100%", fontSize: 11 }}>Save AI Config</button>
            <div style={{ fontSize: 9, color: "#525252", marginTop: 4, textAlign: "center" }}>Key stored in local database. Server-level .env takes priority if set.</div>
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onLogout} style={{ ...S.btn("ghost"), flex: 1 }}>Log Out</button>
          <button onClick={save} style={{ ...S.btn("primary"), flex: 1 }}>Save</button>
        </div>
      </div>
    </div>
  );
}
