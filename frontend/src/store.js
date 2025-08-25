const LS_KEY = "wtasting_v2";

export const initialTasting = {
  id: crypto.randomUUID(),
  title: "Blind Tasting #1",
  host: "Orga-Team",
  released: false,          // Rangliste erst nach Freigabe
  organizerPin: "",         // Orga-PIN (optional)
  drams: [
    { order: 1, name: "Sample A", broughtBy: "Alice" },
    { order: 2, name: "Sample B", broughtBy: "Bob"   },
  ],
  // ratings: Map participant -> { [order]: {points (0-100), notes, aromas[]} }
  ratings: {}
};

export const load = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || initialTasting; }
  catch { return initialTasting; }
};
export const save = (s) => localStorage.setItem(LS_KEY, JSON.stringify(s));

// Admin-Flag nur in Session speichern (Frontend-Mock)
const adminKey = (id) => `wt_admin_${id}`;
export const isAdmin = (id) => sessionStorage.getItem(adminKey(id)) === "1";
export const setAdmin = (id, on) => sessionStorage.setItem(adminKey(id), on ? "1" : "0");
