import { Router } from "express";
import { prisma } from "../lib/db.js";
import { todayISODate } from "../lib/slots.js";
import { createBooking, SlotNotFoundError, SlotUnavailableError } from "../lib/booking.js";

export const publicRouter = Router();

// ---- Availability browsing, scoped to one host's shareable link ----

function slotStatus(bookings: { status: string }[]): "open" | "pending" | "booked" {
  if (bookings.some((b) => b.status === "confirmed")) return "booked";
  if (bookings.some((b) => b.status === "pending")) return "pending";
  return "open";
}

publicRouter.get("/hosts/:slug", async (req, res) => {
  const host = await prisma.host.findUnique({ where: { slug: req.params.slug } });
  if (!host) {
    res.status(404).json({ error: "No host found at this link" });
    return;
  }

  const days = await prisma.availabilityDay.findMany({
    where: { hostId: host.id, date: { gte: todayISODate() } },
    orderBy: [{ date: "asc" }],
    include: {
      slots: {
        orderBy: { startTime: "asc" },
        include: { bookings: { select: { status: true } } },
      },
    },
  });

  res.json({
    host: { name: host.name, slug: host.slug },
    days: days.map((day) => ({
      id: day.id,
      date: day.date,
      startTime: day.startTime,
      endTime: day.endTime,
      sessionMinutes: day.sessionMinutes,
      slots: day.slots.map((slot) => ({
        id: slot.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: slotStatus(slot.bookings),
      })),
    })),
  });
});

// ---- Booking a slot ----

publicRouter.post("/bookings", async (req, res) => {
  const { slotId, studentName, studentEmail, topic } = req.body ?? {};
  if (typeof slotId !== "string" || !slotId) {
    res.status(400).json({ error: "slotId is required" });
    return;
  }
  if (typeof studentName !== "string" || !studentName.trim()) {
    res.status(400).json({ error: "studentName is required" });
    return;
  }
  const email = typeof studentEmail === "string" ? studentEmail.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "A valid studentEmail is required" });
    return;
  }

  try {
    const booking = await createBooking({
      slotId,
      studentName: studentName.trim(),
      studentEmail: email,
      topic: typeof topic === "string" && topic.trim() ? topic.trim() : null,
    });
    res.status(201).json(booking);
  } catch (err) {
    if (err instanceof SlotNotFoundError) {
      res.status(404).json({ error: "Slot not found" });
      return;
    }
    if (err instanceof SlotUnavailableError) {
      res.status(409).json({ error: "That slot is no longer available. Please pick another." });
      return;
    }
    throw err;
  }
});

// ---- Student self-service lookup by email, across all hosts ----

publicRouter.get("/bookings", async (req, res) => {
  const email = typeof req.query.email === "string" ? req.query.email.trim().toLowerCase() : "";
  if (!email) {
    res.status(400).json({ error: "email query parameter is required" });
    return;
  }
  const bookings = await prisma.booking.findMany({
    where: { studentEmail: email },
    orderBy: { createdAt: "desc" },
    include: { slot: { include: { availabilityDay: { include: { host: true } } } } },
  });
  res.json(
    bookings.map((b) => ({
      id: b.id,
      status: b.status,
      studentName: b.studentName,
      studentEmail: b.studentEmail,
      topic: b.topic,
      createdAt: b.createdAt,
      confirmedAt: b.confirmedAt,
      slot: { date: b.slot.date, startTime: b.slot.startTime, endTime: b.slot.endTime },
      host: { name: b.slot.availabilityDay.host.name, slug: b.slot.availabilityDay.host.slug },
    }))
  );
});
