// Convierte un codigo ISO alpha-2 (ej. "CA") al emoji de bandera
// correspondiente, usando "regional indicator symbols" (truco estandar).
export function flagEmoji(code) {
  if (!code || code.length !== 2) return "";
  return [...code.toUpperCase()].map((c) => String.fromCodePoint(127397 + c.charCodeAt(0))).join("");
}
