import { Router } from "express";
import { checkAndSendEveningReminders } from "../utils/reminders.js";

const router = Router();

// Lo golpea un servicio externo (cron-job.org) cada 10-15 min. El "key"
// evita que cualquiera dispare notificaciones a lo tonto.
router.get("/tick", async (req, res) => {
  if (!process.env.CRON_SECRET || req.query.key !== process.env.CRON_SECRET) {
    return res.status(403).json({ error: "No autorizado" });
  }
  const result = await checkAndSendEveningReminders();
  res.json({ ok: true, ...result });
});

export default router;
