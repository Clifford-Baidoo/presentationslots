import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { publicRouter } from "./routes/public.js";
import { authRouter } from "./routes/auth.js";
import { hostRouter } from "./routes/host.js";

const COOKIE_SECRET = process.env.COOKIE_SECRET || "dev-secret-change-me";
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;

export const app = express();

if (process.env.NODE_ENV === "production") {
  app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
} else {
  app.use(cors({ origin: true, credentials: true }));
}

app.use(express.json());
app.use(cookieParser(COOKIE_SECRET));

app.use("/api/auth", authRouter);
app.use("/api/host", hostRouter);
app.use("/api", publicRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});
