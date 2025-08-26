const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const TOKEN_KEY = "wt_orgatoken";
export function getToken() { return sessionStorage.getItem(TOKEN_KEY) || ""; }
export function setToken(t) { t ? sessionStorage.setItem(TOKEN_KEY, t) : sessionStorage.removeItem(TOKEN_KEY); }
export function isAdmin() { return !!getToken(); }

function authHeader() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

// ---- NEW: Create tasting (Quick Start) ----
export async function createTasting({ title, host, organizerPin, drams = [] }) {
  const res = await fetch(`${API}/api/tastings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, host, organizerPin, drams })
  });
  if (!res.ok) throw new Error(`create tasting ${res.status}`);
  const data = await res.json(); // {id, joinCode, token}
  if (data.token) setToken(data.token);
  return data;
}

// ---- Tastings lesen ----
export async function fetchActiveTastings() {
  const res = await fetch(`${API}/api/tastings`);
  if (!res.ok) throw new Error(`fetch active tastings ${res.status}`);
  return res.json();
}
export async function fetchCompletedTastings() {
  const res = await fetch(`${API}/api/tastings/completed`);
  if (!res.ok) throw new Error(`fetch completed tastings ${res.status}`);
  return res.json();
}
export async function fetchTastingByCode(code) {
  const res = await fetch(`${API}/api/tastings/code/${encodeURIComponent(code)}`, {
    headers: authHeader()
  });
  if (!res.ok) throw new Error(`fetch by code ${res.status}`);
  return res.json();
}
export async function fetchTastingById(id) {
  const res = await fetch(`${API}/api/tastings/${id}`, { headers: authHeader() });
  if (!res.ok) throw new Error(`fetch by id ${res.status}`);
  return res.json();
}

// ---- Orga ----
export async function orgaLogin(tastingId, pin) {
  const res = await fetch(`${API}/api/tastings/${tastingId}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ organizerPin: pin })
  });
  if (!res.ok) throw new Error("invalid-pin");
  const data = await res.json();
  setToken(data.token);
  return data.token;
}
export async function toggleReleased(tastingId, released) {
  const res = await fetch(`${API}/api/tastings/${tastingId}/released`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ released })
  });
  if (!res.ok) throw new Error(`toggle released ${res.status}`);
  return res.json();
}
export async function toggleCompleted(tastingId, completed) {
  const res = await fetch(`${API}/api/tastings/${tastingId}/completed`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ completed })
  });
  if (!res.ok) throw new Error(`toggle completed ${res.status}`);
  return res.json();
}
export async function updateSetup(tastingId, payload) {
  const res = await fetch(`${API}/api/tastings/${tastingId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`update setup ${res.status}`);
  return res.json();
}

// ---- Ratings & Leaderboard ----
export async function submitRatings(tastingId, participant, ratings) {
  const res = await fetch(`${API}/api/tastings/${tastingId}/ratings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ participant, ratings })
  });
  if (!res.ok) throw new Error(`submit ratings ${res.status}`);
  return res.json();
}
export async function fetchLeaderboard(tastingId) {
  const res = await fetch(`${API}/api/tastings/${tastingId}/leaderboard`, { headers: authHeader() });
  if (!res.ok) throw new Error(`leaderboard ${res.status}`);
  return res.json();
}
