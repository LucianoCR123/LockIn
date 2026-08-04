// En produccion, el navegador solo le habla a Vercel (mismo dominio) y
// vercel.json reenvia /api/* al backend de Render por detras — asi la
// cookie de sesion queda "same-site" y no la bloquea Safari/ITP (bloquea
// cookies entre dominios distintos aunque sean SameSite=None). En
// local/LAN usa el mismo host con el que se cargo la pagina.
const API_BASE = import.meta.env.PROD ? "/api" : `${window.location.protocol}//${window.location.hostname}:4001/api`;

async function request(path, { method = "GET", body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : null;

  if (!res.ok) {
    throw new Error(data?.error || `Error ${res.status}`);
  }
  return data;
}

export const api = {
  register: (payload) => request("/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  logout: () => request("/auth/logout", { method: "POST" }),
  me: () => request("/auth/me"),
  updateProfile: (payload) => request("/auth/profile", { method: "PATCH", body: payload }),
  deleteAccount: () => request("/auth/me", { method: "DELETE" }),

  myGroups: () => request("/groups/mine"),
  createGroup: (payload) => request("/groups", { method: "POST", body: payload }),
  previewGroup: (inviteCode) => request(`/groups/preview/${inviteCode}`),
  joinGroup: (inviteCode) => request(`/groups/${inviteCode}/join`, { method: "POST", body: { acceptedRules: true } }),
  getGroup: (id) => request(`/groups/${id}`),
  getMembers: (id) => request(`/groups/${id}/members`),
  getDay: (id, date) => request(`/groups/${id}/day/${date}`),
  getCalendar: (id, month) => request(`/groups/${id}/calendar?month=${month}`),
  getFeed: (id) => request(`/groups/${id}/feed`),
  sendCheer: (id, payload) => request(`/groups/${id}/cheers`, { method: "POST", body: payload }),

  getToday: () => request("/logs/today"),
  saveToday: (payload) => request("/logs/today", { method: "PUT", body: payload }),
  getHistory: () => request("/logs/history"),
};
