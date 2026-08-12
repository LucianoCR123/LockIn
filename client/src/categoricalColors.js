// Paleta categorica validada (8 tonos, orden fijo, CVD-safe) del skill de
// dataviz — LockIn no tenia una rampa de identidad propia (solo el morado
// de marca, reservado para UI/acciones), asi que usamos la referencia tal
// cual. Validada con validate_palette.js contra el fondo blanco de la app.
const CATEGORICAL_SLOTS = [
  "#2a78d6", // blue
  "#eb6834", // orange
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#e87ba4", // magenta
  "#008300", // green
  "#4a3aa7", // violet
  "#e34948", // red
];
const FALLBACK = "#898781"; // gris neutro para un 9no+ miembro (nunca se genera un tono nuevo)

// Asigna un color por ENTIDAD (userId), nunca por su posicion actual en el
// ranking — si mañana cambia de puesto, mantiene su color. El orden se fija
// alfabeticamente sobre el set de ids presentes, asi es estable entre
// refetches y cambios de periodo (dia/semana/mes).
export function buildColorMap(userIds) {
  const sortedIds = [...new Set(userIds)].sort();
  const map = new Map();
  sortedIds.forEach((id, i) => map.set(id, CATEGORICAL_SLOTS[i] ?? FALLBACK));
  return map;
}
