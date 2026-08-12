import { prisma } from "../db.js";
import { todayStr } from "./dates.js";
import { sendPushToUsers } from "./push.js";

function isEmptyLog(log) {
  return !log || (log.steps === 0 && !log.workoutDone && !log.dietOk && !log.usedShitMeal && !log.usedShitDay);
}

// Corre cada vez que /api/cron/tick recibe una llamada (ver routes/cron.js).
// Para cada usuario con huso horario conocido, si ahi son las 9pm, no se le
// ha avisado hoy (en SU fecha), y no ha registrado nada hoy, le manda un
// push. Se corre a demanda (no con setInterval) porque Render duerme el
// servicio — un servicio externo (cron-job.org) es el que la dispara.
export async function checkAndSendEveningReminders() {
  const users = await prisma.user.findMany({ where: { timezone: { not: null } } });
  const toRemind = [];

  for (const user of users) {
    const hour = Number(
      new Intl.DateTimeFormat("en-US", { timeZone: user.timezone, hour: "2-digit", hour12: false }).format(new Date())
    );
    if (hour !== 21) continue;

    const today = todayStr(user.timezone);
    if (user.lastReminderDate === today) continue;

    const log = await prisma.dailyLog.findUnique({ where: { userId_date: { userId: user.id, date: today } } });
    if (!isEmptyLog(log)) continue;

    toRemind.push({ user, today });
  }

  if (toRemind.length === 0) return { remindedCount: 0 };

  await sendPushToUsers(
    toRemind.map((r) => r.user.id),
    { title: "LockIn", body: "¡No dejes que se acabe el día! Registra tu progreso de hoy 💪" }
  );

  await Promise.all(
    toRemind.map((r) => prisma.user.update({ where: { id: r.user.id }, data: { lastReminderDate: r.today } }))
  );

  return { remindedCount: toRemind.length };
}
