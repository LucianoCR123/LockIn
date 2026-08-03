import jwt from "jsonwebtoken";
import { prisma } from "../db.js";

const JWT_SECRET = process.env.JWT_SECRET;

export function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "30d" });
}

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ error: "No autenticado" });
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return res.status(401).json({ error: "No autenticado" });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "No autenticado" });
  }
}
