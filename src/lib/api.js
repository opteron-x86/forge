// ═══════════════════════ API HELPERS ═══════════════════════
// HTTP helpers with JWT token management.
// Token stored in localStorage, attached to every request.
// 401 responses trigger automatic logout.

const TOKEN_KEY = "talos_token";

let onAuthError = null; // Set by App.jsx to handle forced logout

const api = {
  // Called by App.jsx to register the logout callback
  setAuthErrorHandler(handler) {
    onAuthError = handler;
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  },

  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  _headers() {
    const h = { "Content-Type": "application/json" };
    const token = this.getToken();
    if (token) h["Authorization"] = `Bearer ${token}`;
    return h;
  },

  _handleAuthError(r, path) {
    if (r.status === 401 && !path?.startsWith("/auth/")) {
      this.clearToken();
      if (onAuthError) onAuthError();
      throw new Error("Session expired. Please log in again.");
    }
  },

  async get(path) {
    const r = await fetch(`/api${path}`, { headers: this._headers() });
    this._handleAuthError(r, path);
    if (!r.ok) throw new Error(r.statusText);
    return r.json();
  },

  async post(path, body) {
    const r = await fetch(`/api${path}`, {
      method: "POST",
      headers: this._headers(),
      body: JSON.stringify(body),
    });
    this._handleAuthError(r, path);
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      throw new Error(e.error || r.statusText);
    }
    return r.json();
  },

  async put(path, body) {
    const r = await fetch(`/api${path}`, {
      method: "PUT",
      headers: this._headers(),
      body: JSON.stringify(body),
    });
    this._handleAuthError(r, path);
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      throw new Error(e.error || r.statusText);
    }
    return r.json();
  },

  async del(path) {
    const r = await fetch(`/api${path}`, {
      method: "DELETE",
      headers: this._headers(),
    });
    this._handleAuthError(r, path);
    if (!r.ok) throw new Error(r.statusText);
    return r.json();
  },
};

export default api;
