import { Router } from "express";
import crypto from "node:crypto";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { computeMemberStats, isDayCompliant } from "../utils/scoring.js";
import { todayStr, startOfMonth, endOfMonth } from "../utils/dates.js";

const router = Router();

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin 0/O/1/I para evitar confusion

async function generateInviteCode() {
  for (;;) {
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
    }
    const existing = await prisma.group.findUnique({ where: { inviteCode: code } });
    if (!existing) return code;
  }
}

function serializeGroup(group) {
  return {
    id: group.id,
    name: group.name,
    inviteCode: group.inviteCode,
    createdById: group.createdById,
    rules: {
      minDailySteps: group.minDailySteps,
      minWeeklyWorkouts: group.minWeeklyWorkouts,
      shitMealsPerWeek: group.shitMealsPerWeek,
      shitDaysPerMonth: group.shitDaysPerMonth,
    },
  };
}

function serializeLogFields(log) {
  return {
    steps: log?.steps ?? 0,
    workoutDone: log?.workoutDone ?? false,
    dietOk: log?.dietOk ?? false,
    usedShitMeal: log?.usedShitMeal ?? false,
    usedShitDay: log?.usedShitDay ?? false,
  };
}

async function requireMembership(req, res, next) {
  const membership = await prisma.groupMembership.findUnique({
    where: { userId_groupId: { userId: req.user.id, groupId: req.params.id } },
  });
  if (!membership || !membership.acceptedRulesAt) {
    return res.status(403).json({ error: "No perteneces a este grupo" });
  }
  req.membership = membership;
  next();
}

router.post("/", requireAuth, async (req, res) => {
  const { name, minDailySteps, minWeeklyWorkouts, shitMealsPerWeek, shitDaysPerMonth } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: "El grupo necesita un nombre" });

  const inviteCode = await generateInviteCode();
  const group = await prisma.group.create({
    data: {
      name: name.trim(),
      inviteCode,
      createdById: req.user.id,
      minDailySteps: Number(minDailySteps) || 10000,
      minWeeklyWorkouts: Number(minWeeklyWorkouts) || 5,
      shitMealsPerWeek: Number.isFinite(Number(shitMealsPerWeek)) ? Number(shitMealsPerWeek) : 1,
      shitDaysPerMonth: Number.isFinite(Number(shitDaysPerMonth)) ? Number(shitDaysPerMonth) : 0,
    },
  });

  await prisma.groupMembership.create({
    data: { userId: req.user.id, groupId: group.id, acceptedRulesAt: new Date() },
  });

  res.status(201).json(serializeGroup(group));
});

router.get("/mine", requireAuth, async (req, res) => {
  const memberships = await prisma.groupMembership.findMany({
    where: { userId: req.user.id, acceptedRulesAt: { not: null } },
    include: { group: { include: { _count: { select: { memberships: true } } } } },
    orderBy: { joinedAt: "asc" },
  });

  res.json(
    memberships.map((m) => ({
      ...serializeGroup(m.group),
      memberCount: m.group._count.memberships,
    }))
  );
});

router.get("/preview/:inviteCode", requireAuth, async (req, res) => {
  const group = await prisma.group.findUnique({
    where: { inviteCode: req.params.inviteCode.toUpperCase() },
    include: { createdBy: true, _count: { select: { memberships: true } } },
  });
  if (!group) return res.status(404).json({ error: "No existe un grupo con ese código" });

  const membership = await prisma.groupMembership.findUnique({
    where: { userId_groupId: { userId: req.user.id, groupId: group.id } },
  });

  res.json({
    ...serializeGroup(group),
    memberCount: group._count.memberships,
    createdByName: group.createdBy.displayName,
    alreadyMember: Boolean(membership?.acceptedRulesAt),
  });
});

router.post("/:inviteCode/join", requireAuth, async (req, res) => {
  if (req.body?.acceptedRules !== true) {
    return res.status(400).json({ error: "Debes aceptar las reglas del grupo para unirte" });
  }

  const group = await prisma.group.findUnique({ where: { inviteCode: req.params.inviteCode.toUpperCase() } });
  if (!group) return res.status(404).json({ error: "No existe un grupo con ese código" });

  const membership = await prisma.groupMembership.upsert({
    where: { userId_groupId: { userId: req.user.id, groupId: group.id } },
    update: { acceptedRulesAt: new Date() },
    create: { userId: req.user.id, groupId: group.id, acceptedRulesAt: new Date() },
  });

  res.status(201).json({ ...serializeGroup(group), joinedAt: membership.joinedAt });
});

router.get("/:id", requireAuth, requireMembership, async (req, res) => {
  const group = await prisma.group.findUnique({ where: { id: req.params.id } });
  res.json(serializeGroup(group));
});

router.get("/:id/members", requireAuth, requireMembership, async (req, res) => {
  const group = await prisma.group.findUnique({ where: { id: req.params.id } });
  const memberships = await prisma.groupMembership.findMany({
    where: { groupId: group.id, acceptedRulesAt: { not: null } },
    include: { user: true },
  });

  const timezone = req.user.timezone;
  const monthStart = startOfMonth(todayStr(timezone));
  const today = todayStr(timezone);

  const members = await Promise.all(
    memberships.map(async (m) => {
      const logs = await prisma.dailyLog.findMany({
        where: { userId: m.userId, date: { gte: monthStart, lte: today } },
      });
      const todayLog = logs.find((l) => l.date === today) || null;
      const stats = computeMemberStats(group, logs, timezone);
      return {
        userId: m.userId,
        displayName: m.user.displayName,
        country: m.user.country,
        city: m.user.city,
        joinedAt: m.joinedAt,
        today: serializeLogFields(todayLog),
        stats,
      };
    })
  );

  members.sort((a, b) => b.stats.weeklyScore - a.stats.weeklyScore);
  res.json(members);
});

router.get("/:id/day/:date", requireAuth, requireMembership, async (req, res) => {
  const { date } = req.params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: "Fecha inválida" });

  const memberships = await prisma.groupMembership.findMany({
    where: { groupId: req.params.id, acceptedRulesAt: { not: null } },
    include: { user: true },
  });

  const logs = await prisma.dailyLog.findMany({
    where: { userId: { in: memberships.map((m) => m.userId) }, date },
  });
  const byUser = new Map(logs.map((l) => [l.userId, l]));

  res.json(
    memberships.map((m) => ({
      userId: m.userId,
      displayName: m.user.displayName,
      country: m.user.country,
      city: m.user.city,
      log: byUser.has(m.userId) ? serializeLogFields(byUser.get(m.userId)) : null,
    }))
  );
});

router.get("/:id/calendar", requireAuth, requireMembership, async (req, res) => {
  const month = /^\d{4}-\d{2}$/.test(req.query.month || "") ? req.query.month : todayStr(req.user.timezone).slice(0, 7);
  const monthStart = `${month}-01`;
  const monthEnd = endOfMonth(monthStart);

  const memberIds = (
    await prisma.groupMembership.findMany({
      where: { groupId: req.params.id, acceptedRulesAt: { not: null } },
      select: { userId: true },
    })
  ).map((m) => m.userId);

  const group = await prisma.group.findUnique({ where: { id: req.params.id } });
  const logs = await prisma.dailyLog.findMany({
    where: { userId: { in: memberIds }, date: { gte: monthStart, lte: monthEnd } },
  });

  const byDate = new Map();
  for (const log of logs) {
    if (!byDate.has(log.date)) byDate.set(log.date, []);
    byDate.get(log.date).push(log);
  }

  const summary = {};
  for (const [date, dayLogs] of byDate.entries()) {
    summary[date] = {
      loggedCount: dayLogs.length,
      compliantCount: dayLogs.filter((l) => isDayCompliant(l, group)).length,
      totalMembers: memberIds.length,
    };
  }

  res.json(summary);
});

router.get("/:id/feed", requireAuth, requireMembership, async (req, res) => {
  const group = await prisma.group.findUnique({ where: { id: req.params.id } });
  const memberIds = (
    await prisma.groupMembership.findMany({
      where: { groupId: group.id, acceptedRulesAt: { not: null } },
      select: { userId: true },
    })
  ).map((m) => m.userId);

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [logs, cheers] = await Promise.all([
    prisma.dailyLog.findMany({
      where: { userId: { in: memberIds }, updatedAt: { gte: sevenDaysAgo } },
      include: { user: true },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
    prisma.cheer.findMany({
      where: { groupId: group.id },
      include: { sender: true, recipient: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const events = [
    ...logs.map((l) => ({
      type: "checkin",
      at: l.updatedAt,
      userId: l.userId,
      displayName: l.user.displayName,
      country: l.user.country,
      city: l.user.city,
      date: l.date,
      steps: l.steps,
      workoutDone: l.workoutDone,
      dietOk: l.dietOk,
      usedShitMeal: l.usedShitMeal,
      usedShitDay: l.usedShitDay,
    })),
    ...cheers.map((c) => ({
      type: "cheer",
      at: c.createdAt,
      cheerType: c.type,
      text: c.text,
      senderId: c.senderId,
      senderName: c.sender.displayName,
      recipientId: c.recipientId,
      recipientName: c.recipient?.displayName || null,
    })),
  ].sort((a, b) => new Date(b.at) - new Date(a.at));

  res.json(events.slice(0, 60));
});

router.post("/:id/cheers", requireAuth, requireMembership, async (req, res) => {
  const { recipientId, type, text } = req.body || {};
  const validTypes = ["encouragement", "congrats", "custom"];
  if (!validTypes.includes(type)) return res.status(400).json({ error: "Tipo de mensaje inválido" });
  if (!text || !text.trim()) return res.status(400).json({ error: "El mensaje no puede estar vacío" });

  if (recipientId) {
    const recipientMembership = await prisma.groupMembership.findUnique({
      where: { userId_groupId: { userId: recipientId, groupId: req.params.id } },
    });
    if (!recipientMembership) return res.status(400).json({ error: "Ese usuario no pertenece al grupo" });
  }

  const cheer = await prisma.cheer.create({
    data: {
      groupId: req.params.id,
      senderId: req.user.id,
      recipientId: recipientId || null,
      type,
      text: text.trim().slice(0, 280),
    },
    include: { sender: true, recipient: true },
  });

  res.status(201).json({
    id: cheer.id,
    type: cheer.type,
    text: cheer.text,
    createdAt: cheer.createdAt,
    senderId: cheer.senderId,
    senderName: cheer.sender.displayName,
    recipientId: cheer.recipientId,
    recipientName: cheer.recipient?.displayName || null,
  });
});

export default router;
