// ═══════════════════════ API HELPERS ═══════════════════════
// Extracted from App.jsx — the api object used by all components

const api = {
  async get(path) {
    const r = await fetch(`/api${path}`);
    if (!r.ok) throw new Error(r.statusText);
    return r.json();
  },
  async post(path, body) {
    const r = await fetch(`/api${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      throw new Error(e.error || r.statusText);
    }
    return r.json();
  },
  async put(path, body) {
    const r = await fetch(`/api${path}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(r.statusText);
    return r.json();
  },
  async del(path) {
    const r = await fetch(`/api${path}`, { method: "DELETE" });
    if (!r.ok) throw new Error(r.statusText);
    return r.json();
  },
};

export default api;
