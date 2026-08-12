// Largo de paso promedio para convertir pasos en distancia (aprox, ~30 in).
export const STEP_LENGTH_M = 0.762;

export function stepsToKm(steps) {
  return (steps * STEP_LENGTH_M) / 1000;
}

// Distancias reales conocidas, de menor a mayor, para el dato curioso.
// Cubre desde vueltas cortas hasta trayectos entre ciudades relevantes al
// grupo (Canadá, Colombia, Europa) y referencias universales.
const FUN_DISTANCES = [
  { km: 0.4, label: "una vuelta a una cancha de fútbol" },
  { km: 3.5, label: "cruzar el Central Park de punta a punta" },
  { km: 8, label: "la longitud de la isla de Manhattan" },
  { km: 15, label: "de una punta a otra de Bogotá" },
  { km: 21, label: "una media maratón" },
  { km: 42, label: "un maratón completo" },
  { km: 60, label: "de Medellín a Rionegro" },
  { km: 100, label: "de Toronto a Hamilton" },
  { km: 240, label: "de Bogotá a Medellín (en línea recta)" },
  { km: 344, label: "de Londres a París" },
  { km: 400, label: "de Toronto a Ottawa" },
  { km: 505, label: "de Madrid a Barcelona" },
  { km: 620, label: "de Bogotá a Cali" },
  { km: 1300, label: "de Toronto a Nueva York" },
  { km: 2900, label: "de Madrid a Moscú" },
  { km: 4000, label: "de costa a costa de Canadá (Toronto–Vancouver, una fracción)" },
];

// Retorna el fun-fact mas cercano por debajo o igual a la distancia dada
// (para que se sienta como "ya cruzaste X"), o el mas chico si aún no
// alcanza ninguno.
export function closestFunDistance(km) {
  if (km <= 0) return null;
  const reached = FUN_DISTANCES.filter((d) => d.km <= km);
  if (reached.length === 0) return FUN_DISTANCES[0];
  return reached[reached.length - 1];
}
