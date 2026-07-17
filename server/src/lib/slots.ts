const HM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidHM(value: unknown): value is string {
  return typeof value === "string" && HM_RE.test(value);
}

function toMinutes(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}

function toHM(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Slices [startTime, endTime) into consecutive sessionMinutes-long chunks.
// Any leftover time shorter than a full session is dropped.
export function generateSlotTimes(
  startTime: string,
  endTime: string,
  sessionMinutes: number
): Array<{ startTime: string; endTime: string }> {
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  const slots: Array<{ startTime: string; endTime: string }> = [];
  for (let t = start; t + sessionMinutes <= end; t += sessionMinutes) {
    slots.push({ startTime: toHM(t), endTime: toHM(t + sessionMinutes) });
  }
  return slots;
}

export function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidISODate(value: unknown): value is string {
  return typeof value === "string" && DATE_RE.test(value);
}
