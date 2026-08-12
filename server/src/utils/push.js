import webpush from "web-push";
import { prisma } from "../db.js";

let configured = false;

export function ensureVapidConfigured() {
  if (configured) return;
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails("mailto:lockin@example.com", process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  }
  configured = true;
}

// Manda un push a todas las suscripciones de una lista de usuarios. Si una
// suscripcion ya no es valida (el navegador la revoco), se borra sola.
export async function sendPushToUsers(userIds, payload) {
  if (!process.env.VAPID_PUBLIC_KEY || userIds.length === 0) return;
  ensureVapidConfigured();

  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId: { in: userIds } } });
  const body = JSON.stringify(payload);

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body
        );
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        } else {
          console.error("push error:", err.statusCode, err.body);
        }
      }
    })
  );
}
