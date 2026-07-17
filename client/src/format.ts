export function formatTime12h(hm: string): string {
  const [hStr, m] = hm.split(":");
  let h = Number(hStr);
  const period = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  return `${h}:${m}${period}`;
}
