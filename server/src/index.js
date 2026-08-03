import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.js";
import groupRoutes from "./routes/groups.js";
import logRoutes from "./routes/logs.js";

const app = express();

// Refleja el origin de la request (solo dev/demo): permite abrir la app desde
// el celular en la misma WiFi usando la IP LAN de la Mac, no solo localhost.
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/logs", logRoutes);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Error interno" });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API escuchando en http://localhost:${port}`));
