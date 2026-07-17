import { Router } from "express";
import { prisma } from "../lib/db.js";
import { SESSION_COOKIE } from "../lib/auth.js";
import { hashPassword, verifyPassword } from "../lib/hash.js";
import { uniqueSlugFor } from "../lib/slug.js";

export const authRouter = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COOKIE_OPTIONS = {
  httpOnly: true,
  signed: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 1000 * 60 * 60 * 24 * 30,
};

function publicHost(host: { id: string; name: string; email: string; slug: string }) {
  return { id: host.id, name: host.name, email: host.email, slug: host.slug };
}

authRouter.post("/signup", async (req, res) => {
  const { name, email, password } = req.body ?? {};
  if (typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "Name is required" });
    return;
  }
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(normalizedEmail)) {
    res.status(400).json({ error: "A valid email is required" });
    return;
  }
  if (typeof password !== "string" || password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const existing = await prisma.host.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    res.status(409).json({ error: "An account with that email already exists" });
    return;
  }

  const host = await prisma.host.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: await hashPassword(password),
      slug: await uniqueSlugFor(name.trim()),
    },
  });

  res.cookie(SESSION_COOKIE, host.id, COOKIE_OPTIONS);
  res.status(201).json({ host: publicHost(host) });
});

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!normalizedEmail || typeof password !== "string") {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const host = await prisma.host.findUnique({ where: { email: normalizedEmail } });
  if (!host || !(await verifyPassword(password, host.passwordHash))) {
    res.status(401).json({ error: "Incorrect email or password" });
    return;
  }

  res.cookie(SESSION_COOKIE, host.id, COOKIE_OPTIONS);
  res.json({ host: publicHost(host) });
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(SESSION_COOKIE);
  res.json({ ok: true });
});

authRouter.get("/me", async (req, res) => {
  const hostId = req.signedCookies?.[SESSION_COOKIE];
  if (typeof hostId !== "string" || !hostId) {
    res.json({ authenticated: false });
    return;
  }
  const host = await prisma.host.findUnique({ where: { id: hostId } });
  if (!host) {
    res.clearCookie(SESSION_COOKIE);
    res.json({ authenticated: false });
    return;
  }
  res.json({ authenticated: true, host: publicHost(host) });
});
