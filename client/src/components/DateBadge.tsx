interface DateBadgeProps {
  date: string; // YYYY-MM-DD
  className?: string;
}

export default function DateBadge({ date, className }: DateBadgeProps) {
  const d = new Date(`${date}T00:00:00`);
  const weekday = d.toLocaleDateString(undefined, { weekday: "short" });
  const day = d.getDate();
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-md border border-slate-200 text-ink shrink-0 ${className ?? "w-12 h-12"}`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wide leading-none">{weekday}</span>
      <span className="text-base font-bold leading-none mt-0.5">{day}</span>
    </div>
  );
}
