import { Router } from "express";
import { prisma } from "../lib/db.js";
import { requireHost } from "../lib/auth.js";
import { generateSlotTimes, isValidHM, isValidISODate } from "../lib/slots.js";

export const hostRouter = Router();

hostRouter.use(requireHost);

// ---- Availability days ----

hostRouter.get("/availability", async (req, res) => {
  const days = await prisma.availabilityDay.findMany({
    where: { hostId: req.hostId },
    orderBy: [{ date: "asc" }],
    include: {
      slots: {
        orderBy: { startTime: "asc" },
        include: { bookings: true },
      },
    },
  });
  res.json(days);
});

hostRouter.post("/availability", async (req, res) => {
  const { date, startTime, endTime, sessionMinutes } = req.body ?? {};
  if (!isValidISODate(date)) {
    res.status(400).json({ error: "date must be in YYYY-MM-DD format" });
    return;
  }
  if (!isValidHM(startTime) || !isValidHM(endTime)) {
    res.status(400).json({ error: "startTime and endTime must be in HH:MM (24h) format" });
    return;
  }
  const minutes = Number(sessionMinutes);
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 480) {
    res.status(400).json({ error: "sessionMinutes must be an integer between 1 and 480" });
    return;
  }
  const slotTimes = generateSlotTimes(startTime, endTime, minutes);
  if (slotTimes.length === 0) {
    res.status(400).json({ error: "endTime must be at least sessionMinutes after startTime" });
    return;
  }

  try {
    const day = await prisma.availabilityDay.create({
      data: {
        hostId: req.hostId!,
        date,
        startTime,
        endTime,
        sessionMinutes: minutes,
        slots: {
          create: slotTimes.map((s) => ({ hostId: req.hostId!, date, startTime: s.startTime, endTime: s.endTime })),
        },
      },
      include: { slots: true },
    });
    res.status(201).json(day);
  } catch (err) {
    // Most likely a @@unique([hostId, date, startTime]) collision with an existing window on this date.
    res.status(409).json({ error: "Could not create availability — it may overlap an existing window on this date." });
    return;
  }
});

hostRouter.delete("/availability/:id", async (req, res) => {
  const day = await prisma.availabilityDay.findUnique({
    where: { id: req.params.id },
    include: { slots: { include: { bookings: true } } },
  });
  if (!day || day.hostId !== req.hostId) {
    res.status(404).json({ error: "Availability day not found" });
    return;
  }
  const activeBookingCount = day.slots.reduce(
    (n, slot) => n + slot.bookings.filter((b) => b.status === "pending" || b.status === "confirmed").length,
    0
  );
  const force = req.query.force === "true";
  if (activeBookingCount > 0 && !force) {
    res.status(409).json({
      error: "Cannot delete: some slots have pending or confirmed bookings. Decline or cancel those first.",
      activeBookingCount,
    });
    return;
  }
  // force=true cascades through Slot -> Booking (schema onDelete: Cascade), removing
  // any pending/confirmed bookings along with the window rather than declining them
  // individually — same end state as the blocked path since there's no notification
  // to a student to defer.
  await prisma.availabilityDay.delete({ where: { id: day.id } });
  res.json({ ok: true });
});

// ---- Bookings ----

hostRouter.get("/bookings", async (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const bookings = await prisma.booking.findMany({
    where: {
      slot: { availabilityDay: { hostId: req.hostId } },
      ...(status ? { status } : {}),
    },
    orderBy: [{ createdAt: "desc" }],
    include: { slot: true },
  });
  res.json(bookings);
});

hostRouter.post("/bookings/:id/confirm", async (req, res) => {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: { slot: true },
  });
  if (!booking || booking.slot.hostId !== req.hostId) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }
  if (booking.status !== "pending") {
    res.status(409).json({ error: "Only a pending booking can be confirmed." });
    return;
  }
  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "confirmed", confirmedAt: new Date() },
    include: { slot: true },
  });
  res.json(updated);
});

// Declines a pending request, or cancels an already-confirmed booking. Either way
// the booking is marked declined (kept for the student's history) and the slot
// becomes bookable again.
hostRouter.post("/bookings/:id/decline", async (req, res) => {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: { slot: true },
  });
  if (!booking || booking.slot.hostId !== req.hostId) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }
  if (booking.status === "declined") {
    res.status(409).json({ error: "Booking is already declined." });
    return;
  }
  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "declined" },
    include: { slot: true },
  });
  res.json(updated);
});
