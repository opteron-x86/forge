// ═══════════════════════ PWA INSTALL PROMPT ═══════════════════════
// Shows a dismissible banner prompting the user to install TALOS as a PWA.
// Captures the browser's beforeinstallprompt event and triggers it on tap.
// On iOS Safari (no beforeinstallprompt), shows manual instructions instead.

import { useState, useEffect } from "react";
import S from "../lib/styles";
import api from "../lib/api";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Don't show if already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (window.navigator.standalone === true) return;

    // Don't show if user previously dismissed
    try {
      const dismissed = localStorage.getItem("talos-install-dismissed");
      if (dismissed) {
        const dismissedAt = parseInt(dismissed, 10);
        // Show again after 7 days
        if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
      }
    } catch (e) {}

    // Detect iOS Safari
    const ua = navigator.userAgent;
    const isiOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua);

    if (isiOS && isSafari) {
      setIsIOS(true);
      setShowBanner(true);
      return;
    }

    // Chrome/Edge/Samsung — capture beforeinstallprompt
    function handlePrompt(e) {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    }

    window.addEventListener("beforeinstallprompt", handlePrompt);
    return () => window.removeEventListener("beforeinstallprompt", handlePrompt);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === "accepted") {
      setShowBanner(false);
      api.track("pwa_installed");
    }
    setDeferredPrompt(null);
  }

  function dismiss() {
    setShowBanner(false);
    try { localStorage.setItem("talos-install-dismissed", Date.now().toString()); } catch (e) {}
  }

  if (!showBanner) return null;

  return (
    <div style={{
      margin: "8px 16px",
      padding: "12px 14px",
      background: "var(--surface)",
      border: "1px solid var(--accent)",
      borderRadius: 10,
      display: "flex",
      alignItems: "center",
      gap: 12,
      animation: "fadeIn 0.3s ease-out",
    }}>
      <div style={{ fontSize: 28, flexShrink: 0 }}>📲</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-bright)", marginBottom: 2 }}>
          Install TALOS
        </div>
        <div style={{ fontSize: 10, color: "var(--text-muted)", lineHeight: 1.4 }}>
          {isIOS
            ? <>Tap <strong style={{ color: "var(--text)" }}>Share</strong> → <strong style={{ color: "var(--text)" }}>Add to Home Screen</strong> for the full app experience.</>
            : "Add to your home screen for quick access and a native app experience."
          }
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
        {!isIOS && (
          <button onClick={handleInstall} style={{ ...S.sm("primary"), fontSize: 9, padding: "5px 10px" }}>
            Install
          </button>
        )}
        <button onClick={dismiss} style={{ ...S.sm(), fontSize: 9, padding: "4px 8px", border: "none" }}>
          Later
        </button>
      </div>
    </div>
  );
}
