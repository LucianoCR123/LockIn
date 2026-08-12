import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { todayStr } from "../utils/dates.js";
import { sendPushToUsers } from "../utils/push.js";

const router = Router();

function serializeLog(log, date) {
  return {
    date,
    steps: log?.steps ?? 0,
    workoutDone: log?.workoutDone ?? false,
    dietOk: log?.dietOk ?? false,
    usedShitMeal: log?.usedShitMeal ?? false,
    usedShitDay: log?.usedShitDay ?? false,
    photoUrl: log?.photoUrl ?? null,
    groupIds: log?.groupIds ?? [],
    note: log?.note ?? "",
  };
}

function logsDiffer(a, b) {
  if (!a) return true;
  const fields = ["steps", "workoutDone", "dietOk", "usedShitMeal", "usedShitDay"];
  return fields.some((f) => a[f] !== b[f]);
}

async function notifyGroupmatesOfCheckin(userId, displayName, log) {
  const memberships = await prisma.groupMembership.findMany({
    where: { userId, acceptedRulesAt: { not: null } },
    select: { groupId: true },
  });
  if (memberships.length === 0) return;

  // Solo avisa en los grupos a los que cuenta este check-in.
  const scoped = log.groupIds.length > 0 ? log.groupIds : memberships.map((m) => m.groupId);

  const groupmates = await prisma.groupMembership.findMany({
    where: { groupId: { in: scoped }, acceptedRulesAt: { not: null }, userId: { not: userId } },
    select: { userId: true },
  });
  const otherUserIds = [...new Set(groupmates.map((m) => m.userId))];
  if (otherUserIds.length === 0) return;

  const parts = [`${log.steps.toLocaleString()} pasos`];
  if (log.workoutDone) parts.push("gym");
  if (log.dietOk) parts.push("dieta");
  sendPushToUsers(otherUserIds, {
    title: "LockIn",
    body: `${displayName} registró su día: ${parts.join(" · ")}`,
  }).catch((err) => console.error("push checkin error:", err));
}

router.get("/today", requireAuth, async (req, res) => {
  const date = todayStr(req.user.timezone);
  const log = await prisma.dailyLog.findUnique({ where: { userId_date: { userId: req.user.id, date } } });
  res.json(serializeLog(log, date));
});

router.put("/today", requireAuth, async (req, res) => {
  const date = todayStr(req.user.timezone);
  const { steps, workoutDone, dietOk, usedShitMeal, usedShitDay, note, photoUrl, groupIds } = req.body || {};

  const previous = await prisma.dailyLog.findUnique({ where: { userId_date: { userId: req.user.id, date } } });

  // Solo se aceptan grupos a los que el usuario realmente pertenece. Lista
  // vacia = cuenta para todos sus grupos.
  let scopedGroupIds = previous?.groupIds ?? [];
  if (Array.isArray(groupIds)) {
    const myGroups = await prisma.groupMembership.findMany({
      where: { userId: req.user.id, acceptedRulesAt: { not: null } },
      select: { groupId: true },
    });
    const myGroupIds = new Set(myGroups.map((m) => m.groupId));
    const requested = groupIds.filter((id) => myGroupIds.has(id));
    scopedGroupIds = requested.length === myGroupIds.size ? [] : requested;
  }

  const data = {
    steps: Math.max(0, Number(steps) || 0),
    workoutDone: Boolean(workoutDone),
    dietOk: Boolean(dietOk),
    usedShitMeal: Boolean(usedShitMeal),
    usedShitDay: Boolean(usedShitDay),
    note: typeof note === "string" ? note.slice(0, 280) : "",
    photoUrl: typeof photoUrl === "string" && photoUrl ? photoUrl : previous?.photoUrl || null,
    groupIds: scopedGroupIds,
  };

  const log = await prisma.dailyLog.upsert({
    where: { userId_date: { userId: req.user.id, date } },
    update: data,
    create: { userId: req.user.id, date, ...data },
  });

  if (logsDiffer(previous, data)) {
    notifyGroupmatesOfCheckin(req.user.id, req.user.displayName, log);
  }

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
