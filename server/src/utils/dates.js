// Todas las fechas se manejan como strings "YYYY-MM-DD". Las funciones de
// aritmetica (addDays, startOfWeek, etc.) trabajan sobre el string y no les
// importa el huso horario. Solo todayStr() lee el reloj real, por eso acepta
// el huso horario (IANA) del usuario que esta mirando, para que "hoy" sea el
// suyo y no el del servidor (el grupo puede tener gente en varios paises).
export function todayStr(timezone) {
  if (timezone) {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  }
  return toDateStr(new Date());
}

export function toDateStr(d) {
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
  const day = d.getDay(); // 0 = domingo
  const diff = (day === 0 ? -6 : 1) - day; // retrocede hasta el lunes
  d.setDate(d.getDate() + diff);
  return toDateStr(d);
}

export function startOfMonth(dateStr) {
  return `${dateStr.slice(0, 7)}-01`;
}

export function endOfMonth(dateStr) {
  const [y, m] = dateStr.slice(0, 7).split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate(); // dia 0 del mes siguiente = ultimo dia de este mes
  return `${dateStr.slice(0, 7)}-${String(lastDay).padStart(2, "0")}`;
}

export function dateRange(startStr, endStr) {
  const dates = [];
  for (let d = startStr; d <= endStr; d = addDays(d, 1)) dates.push(d);
  return dates;
}
