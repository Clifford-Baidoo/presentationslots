import { prisma } from "./db.js";

export class SlotNotFoundError extends Error {}
export class SlotUnavailableError extends Error {}

const ACTIVE_STATUSES = ["pending", "confirmed"] as const;

// A slot can accumulate declined bookings over time, but only ever one active
// (pending/confirmed) booking. We check-then-insert inside a transaction rather
// than relying on a DB unique constraint, since declined rows must be kept for
// student history instead of being overwritten.
export async function createBooking(input: {
  slotId: string;
  studentName: string;
  studentEmail: string;
  topic: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const slot = await tx.slot.findUnique({ where: { id: input.slotId } });
    if (!slot) throw new SlotNotFoundError();

    const activeBooking = await tx.booking.findFirst({
      where: { slotId: input.slotId, status: { in: [...ACTIVE_STATUSES] } },
    });
    if (activeBooking) throw new SlotUnavailableError();

    return tx.booking.create({
      data: {
        slotId: input.slotId,
        studentName: input.studentName,
        studentEmail: input.studentEmail,
        topic: input.topic,
      },
      include: { slot: true },
    });
  });
}
