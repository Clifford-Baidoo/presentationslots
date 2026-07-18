import { useEffect, useState } from "react";
import { hostFetchBookings } from "../api";
import type { Booking } from "../api";
import { formatTime12h } from "../format";
import Avatar from "../components/Avatar";

const statusStyle: Record<Booking["status"], string> = {
  pending: "text-amber-700 bg-amber-50 border-amber-200",
  confirmed: "text-emerald-700 bg-emerald-50 border-emerald-200",
  declined: "text-ink-light bg-slate-100 border-slate-200",
};

export default function HostSchedule() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hostFetchBookings()
      .then(setBookings)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!bookings) return <p className="text-ink-light text-sm">Loading…</p>;

  if (bookings.length === 0) {
    return (
      <div className="border border-slate-200 rounded-md p-10 text-center">
        <p className="text-ink-light text-sm">No bookings yet.</p>
      </div>
    );
  }

  const sorted = [...bookings].sort((a, b) =>
    `${a.slot.date} ${a.slot.startTime}`.localeCompare(`${b.slot.date} ${b.slot.startTime}`)
  );

  return (
    <div className="space-y-3">
      {sorted.map((b) => (
        <div key={b.id} className="border border-slate-200 rounded-md p-4 flex items-center gap-4">
          <Avatar name={b.studentName} className="w-9 h-9 text-xs shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-ink">{b.studentName}</p>
            <p className="text-sm text-ink-light">{b.studentEmail}</p>
            {b.topic && <p className="text-sm text-ink-light mt-0.5">"{b.topic}"</p>}
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-medium text-ink">{b.slot.date}</p>
            <p className="text-xs text-ink-light">
              {formatTime12h(b.slot.startTime)}–{formatTime12h(b.slot.endTime)}
            </p>
            <span
              className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-md border capitalize ${statusStyle[b.status]}`}
            >
              {b.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
