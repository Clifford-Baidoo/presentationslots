import { PrismaClient } from "@prisma/client";
import { generateSlotTimes } from "../src/lib/slots.js";
import { hashPassword } from "../src/lib/hash.js";

const prisma = new PrismaClient();

function isoDateInDays(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

async function main() {
  await prisma.booking.deleteMany();
  await prisma.slot.deleteMany();
  await prisma.availabilityDay.deleteMany();
  await prisma.host.deleteMany();

  const host = await prisma.host.create({
    data: {
      name: "Demo Host",
      email: "demo@example.com",
      passwordHash: await hashPassword("password123"),
      slug: "demo",
    },
  });

  const windows = [
    { date: isoDateInDays(1), startTime: "09:00", endTime: "12:00", sessionMinutes: 15 },
    { date: isoDateInDays(2), startTime: "13:00", endTime: "16:00", sessionMinutes: 20 },
  ];

  for (const w of windows) {
    const slotTimes = generateSlotTimes(w.startTime, w.endTime, w.sessionMinutes);
    await prisma.availabilityDay.create({
      data: {
        ...w,
        hostId: host.id,
        slots: {
          create: slotTimes.map((s) => ({ hostId: host.id, date: w.date, startTime: s.startTime, endTime: s.endTime })),
        },
      },
    });
  }

  console.log(`Seeded host "${host.name}" (/book/${host.slug}, password: password123) with ${windows.length} availability day(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
