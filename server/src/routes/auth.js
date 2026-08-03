import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../db.js";
import { signToken, requireAuth } from "../middleware/auth.js";

const router = Router();

const isProd = process.env.NODE_ENV === "production";

function setAuthCookie(res, userId) {
  const token = signToken(userId);
  res.cookie("token", token, {
    httpOnly: true,
    // En producción el frontend (Vercel) y el backend (Render) viven en
    // dominios distintos, no solo puertos distintos como en local: hace
    // falta "none" + secure para que el navegador mande la cookie
    // cross-site. En local se queda en "lax" (sin secure, porque es http).
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

function serializeUser(user) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    country: user.country,
    city: user.city,
    timezone: user.timezone,
    createdAt: user.createdAt,
  };
}

router.post("/register", async (req, res) => {
  const { email, password, displayName, country, city, timezone } = req.body || {};

  if (!email || !password || !displayName) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "Ese email ya está registrado" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName,
      country: country || null,
      city: city || null,
      timezone: timezone || null,
    },
  });

  setAuthCookie(res, user.id);
  res.status(201).json(serializeUser(user));
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Faltan credenciales" });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Credenciales inválidas" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Credenciales inválidas" });

  setAuthCookie(res, user.id);
  res.json(serializeUser(user));
});

router.post("/logout", (_req, res) => {
  res.clearCookie("token");
  res.json({ ok: true });
});

router.get("/me", requireAuth, async (req, res) => {
  res.json(serializeUser(req.user));
});

router.patch("/profile", requireAuth, async (req, res) => {
  const { displayName, country, city } = req.body || {};
  const data = {};
  if (typeof displayName === "string" && displayName.trim()) data.displayName = displayName.trim();
  if (typeof country === "string") data.country = country || null;
  if (typeof city === "string") data.city = city.trim() || null;

  const user = await prisma.user.update({ where: { id: req.user.id }, data });
  res.json(serializeUser(user));
});

router.delete("/me", requireAuth, async (req, res) => {
  const userId = req.user.id;
  const ownedGroups = await prisma.group.count({ where: { createdById: userId } });
  if (ownedGroups > 0) {
    return res.status(409).json({
      error: "Eres dueño de un grupo. Bórralo (o pide a un admin que lo elimine) antes de borrar tu cuenta.",
    });
  }
  await prisma.cheer.deleteMany({ where: { OR: [{ senderId: userId }, { recipientId: userId }] } });
  await prisma.dailyLog.deleteMany({ where: { userId } });
  await prisma.groupMembership.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
  res.clearCookie("token");
  res.json({ ok: true });
});

export default router;
