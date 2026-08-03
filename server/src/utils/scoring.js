import { todayStr, startOfWeek, startOfMonth, dateRange, addDays } from "./dates.js";

// Un dia cuenta como "cumplido" en dieta si se marco dietOk, o si se uso un
// shit meal/day permitido ese dia (no rompe la racha/cumplimiento).
export function isDayCompliant(log, group) {
  if (!log) return false;
  return log.steps >= group.minDailySteps && (log.dietOk || log.usedShitMeal || log.usedShitDay);
}

// Calcula el cumplimiento semanal, racha y uso de shit meals/days de un
// usuario dentro de un grupo, a partir de sus DailyLog (que son personales,
// no del grupo) evaluados contra las reglas de ESE grupo. `timezone` es el
// del usuario que esta MIRANDO (para que "hoy"/"esta semana" sean los suyos).
export function computeMemberStats(group, logs, timezone) {
  const today = todayStr(timezone);
  const weekStart = startOfWeek(today);
  const monthStart = startOfMonth(today);
  const byDate = new Map(logs.map((l) => [l.date, l]));

  const daysThisWeek = dateRange(weekStart, today);

  let stepsOkDays = 0;
  let dietOkDays = 0;
  let workoutsThisWeek = 0;
  let shitMealsUsedWeek = 0;

  for (const date of daysThisWeek) {
    const log = byDate.get(date);
    if (!log) continue;
    if (log.steps >= group.minDailySteps) stepsOkDays++;
    if (log.dietOk || log.usedShitMeal || log.usedShitDay) dietOkDays++;
    if (log.workoutDone) workoutsThisWeek++;
    if (log.usedShitMeal) shitMealsUsedWeek++;
  }

  let shitDaysUsedMonth = 0;
  for (const date of dateRange(monthStart, today)) {
    if (byDate.get(date)?.usedShitDay) shitDaysUsedMonth++;
  }

  const daysElapsed = daysThisWeek.length || 1;
  const stepsRate = stepsOkDays / daysElapsed;
  const dietRate = dietOkDays / daysElapsed;
  const workoutRate = group.minWeeklyWorkouts > 0 ? Math.min(1, workoutsThisWeek / group.minWeeklyWorkouts) : 1;
  const weeklyScore = Math.round(((stepsRate + dietRate + workoutRate) / 3) * 100);

  // Racha de dias consecutivos cumpliendo pasos + dieta (entrenamiento se
  // evalua semanal, no entra a la racha diaria). Si hoy todavia no se
  // registro nada, se cuenta desde ayer para no romper la racha a medio dia.
  let streak = 0;
  let cursor = byDate.has(today) ? today : addDays(today, -1);
  for (;;) {
    if (!isDayCompliant(byDate.get(cursor), group)) break;
    streak++;
    cursor = addDays(cursor, -1);
  }

  return {
    weeklyScore,
    streak,
    stepsOkDays,
    dietOkDays,
    workoutsThisWeek,
    daysElapsedThisWeek: daysElapsed,
    shitMealsUsedWeek,
    shitMealsAllowed: group.shitMealsPerWeek,
    shitDaysUsedMonth,
    shitDaysAllowed: group.shitDaysPerMonth,
  };
}
