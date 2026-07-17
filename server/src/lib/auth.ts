import type { Request, Response, NextFunction } from "express";

export const SESSION_COOKIE = "presentationslots_host";

declare global {
  namespace Express {
    interface Request {
      hostId?: string;
    }
  }
}

export function requireHost(req: Request, res: Response, next: NextFunction) {
  const hostId = req.signedCookies?.[SESSION_COOKIE];
  if (typeof hostId !== "string" || !hostId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  req.hostId = hostId;
  next();
}
