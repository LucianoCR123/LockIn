import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { todayStr } from "../utils/dates.js";

const router = Router();

function serializeLog(log, date) {
  return {
    date,
    steps: log?.steps ?? 0,
    workoutDone: log?.workoutDone ?? false,
    dietOk: log?.dietOk ?? false,
    usedShitMeal: log?.usedShitMeal ?? false,
    usedShitDay: log?.usedShitDay ?? false,
    note: log?.note ?? "",
  };
}

router.get("/today", requireAuth, async (req, res) => {
  const date = todayStr(req.user.timezone);
  const log = await prisma.dailyLog.findUnique({ where: { userId_date: { userId: req.user.id, date } } });
  res.json(serializeLog(log, date));
});

router.put("/today", requireAuth, async (req, res) => {
  const date = todayStr(req.user.timezone);
  const { steps, workoutDone, dietOk, usedShitMeal, usedShitDay, note } = req.body || {};

  const data = {
    steps: Math.max(0, Number(steps) || 0),
    workoutDone: Boolean(workoutDone),
    dietOk: Boolean(dietOk),
    usedShitMeal: Boolean(usedShitMeal),
    usedShitDay: Boolean(usedShitDay),
    note: typeof note === "string" ? note.slice(0, 280) : "",
  };

  const log = await prisma.dailyLog.upsert({
    where: { userId_date: { userId: req.user.id, date } },
    update: data,
    create: { userId: req.user.id, date, ...data },
  });

  res.json(serializeLog(log, date));
});

router.get("/history", requireAuth, async (req, res) => {
  const logs = await prisma.dailyLog.findMany({
    where: { userId: req.user.id },
    orderBy: { date: "desc" },
    take: 30,
  });
  res.json(logs.map((l) => serializeLog(l, l.date)));
});

export default router;
