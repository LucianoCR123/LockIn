// Utilidades de fecha para el calendario (mismo enfoque que
// server/src/utils/dates.js: strings "YYYY-MM-DD", aritmetica sobre el
// string, sin depender de huso horario para sumar dias/semanas/meses).

function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

export function startOfWeek(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  return toDateStr(d);
}

export function endOfMonth(dateStr) {
  const [y, m] = dateStr.slice(0, 7).split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return `${dateStr.slice(0, 7)}-${String(lastDay).padStart(2, "0")}`;
}

export function dateRange(startStr, endStr) {
  const dates = [];
  for (let d = startStr; d <= endStr; d = addDays(d, 1)) dates.push(d);
  return dates;
}

export function shiftMonth(monthStr, delta) {
  const [y, m] = monthStr.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function formatDayLabel(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("es", { weekday: "short", day: "numeric" });
}

export function formatMonthLabel(monthStr) {
  const d = new Date(`${monthStr}-01T00:00:00`);
  return d.toLocaleDateString("es", { month: "long", year: "numeric" });
}
