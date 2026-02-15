// ═══════════════════════ SETTINGS MODAL ═══════════════════════
// Extracted from App.jsx — SettingsModal function
//
// Features: Edit name, change PIN, change color, AI configuration
// (provider selector, model, API key, base URL, supports tools toggle),
// save + log out actions.

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
  const [aiForm, setAiForm] = useState({
    provider: "",
    model: "",
    apiKey: "",
    baseUrl: "",
    supportsTools: true,
  });
  const [aiStatus, setAiStatus] = useState("");
  const [aiLoaded, setAiLoaded] = useState(false);

  useEffect(() => {
    if (showAI && !aiLoaded) {
      api
        .get("/ai/config")
        .then((cfg) => {
          setAiForm({
            provider: cfg.provider || "anthropic",
            model: cfg.model || "",
            apiKey: "", // Don't prefill key
            baseUrl: cfg.baseUrl || "",
            supportsTools: cfg.supportsTools !== false,
          });
          setAiStatus(cfg.enabled ? `Active: ${cfg.providerName}` : "Not configured");
          setAiLoaded(true);
        })
        .catch(() => setAiLoaded(true));
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
      const body = {
        provider: aiForm.provider,
        model: aiForm.model,
        baseUrl: aiForm.baseUrl,
        supportsTools: aiForm.supportsTools,
      };
      if (aiForm.apiKey) body.apiKey = aiForm.apiKey;
      const res = await api.put("/ai/config", body);
      setAiStatus(res.enabled ? `Active: ${res.providerName}` : "Not configured");
    } catch (e) {
      setAiStatus("Error: " + e.message);
    }
  }

  // MIGRATION NOTE: Copy the return JSX from App.jsx SettingsModal.
  // It renders a fullscreen overlay with: name input, PIN input, color picker,
  // AI config expandable section (provider dropdown, model, API key, base URL,
  // supports tools checkbox, save AI button, status), and Log Out / Save buttons.

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.9)",
        zIndex: 300,
        overflow: "auto",
        padding: 16,
      }}
    >
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#fafafa" }}>Settings</div>
          <button onClick={onClose} style={S.sm()}>✕</button>
        </div>

        {/* TODO: Copy settings form JSX from App.jsx SettingsModal:
            - Name input
            - New PIN input
            - Color picker (USER_COLORS grid)
            - AI Configuration expandable section
            - Log Out + Save buttons */}

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button onClick={onLogout} style={{ ...S.btn("ghost"), flex: 1 }}>Log Out</button>
          <button onClick={save} style={{ ...S.btn("primary"), flex: 1 }}>Save</button>
        </div>
      </div>
    </div>
  );
}
