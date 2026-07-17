import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ApiError, fetchHostBySlug } from "../api";
import type { PublicAvailabilityDay, PublicSlot } from "../api";
import { formatTime12h } from "../format";
import BookingModal from "../components/BookingModal";
import Avatar from "../components/Avatar";
import DateBadge from "../components/DateBadge";

const statusStyles: Record<PublicSlot["status"], string> = {
  open: "border-slate-200 text-ink hover:border-brand hover:text-brand",
  pending: "border-amber-200 bg-amber-50 text-amber-700 cursor-not-allowed",
  booked: "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed",
};

const statusLabel: Record<PublicSlot["status"], string> = {
  open: "Available",
  pending: "Awaiting confirmation",
  booked: "Booked",
};

function formatDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

export default function BookHost() {
  const { slug = "" } = useParams();
  const [hostName, setHostName] = useState<string | null>(null);
  const [days, setDays] = useState<PublicAvailabilityDay[] | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ date: string; slot: PublicSlot } | null>(null);
  const [justBooked, setJustBooked] = useState(false);

  function load() {
    fetchHostBySlug(slug)
      .then((r) => {
        setHostName(r.host.name);
        setDays(r.days);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load availability");
      });
  }

  useEffect(load, [slug]);

  function handleBooked() {
    setSelected(null);
    setJustBooked(true);
    load();
  }

  if (notFound) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <h1 className="text-xl font-semibold text-ink">No host found at this link</h1>
        <p className="text-sm text-ink-light mt-1">Double-check the link you were given.</p>
      </div>
    );
  }

  if (error) return <p className="max-w-3xl mx-auto text-red-600">{error}</p>;
  if (!days || !hostName)
    return <p className="max-w-3xl mx-auto text-ink-light">Loading availability…</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="border border-slate-200 rounded-md p-5 flex items-center gap-4">
        <Avatar name={hostName} className="w-14 h-14 text-lg" />
        <div>
          <h1 className="text-xl font-bold text-ink">Book time with {hostName}</h1>
          <p className="text-sm text-ink-light mt-0.5">
            Pick an open time below. Your request goes to {hostName} for confirmation — check{" "}
            <span className="font-medium text-ink">My Bookings</span> to see whether it's been approved.
          </p>
        </div>
      </div>

      {justBooked && (
        <div className="rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3">
          Request sent! Look it up under "My Bookings" with your email once it's confirmed.
        </div>
      )}

      {days.length === 0 && (
        <div className="border border-slate-200 rounded-md p-10 text-center">
          <p className="text-ink-light">No slots have been opened up yet. Check back later.</p>
        </div>
      )}

      {days.map((day) => (
        <div key={day.id} className="border border-slate-200 rounded-md p-5">
          <div className="flex items-center gap-3 mb-4">
            <DateBadge date={day.date} />
            <div>
              <h2 className="font-semibold text-ink">{formatDate(day.date)}</h2>
              <p className="text-xs text-ink-light">
                {formatTime12h(day.startTime)}–{formatTime12h(day.endTime)} &middot; {day.sessionMinutes} min sessions
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {day.slots.map((slot) => (
              <button
                key={slot.id}
                disabled={slot.status !== "open"}
                onClick={() => setSelected({ date: day.date, slot })}
                title={statusLabel[slot.status]}
                className={`rounded-md border px-2 py-2.5 text-xs font-semibold transition-colors ${statusStyles[slot.status]}`}
              >
                {formatTime12h(slot.startTime)}
              </button>
            ))}
          </div>
        </div>
      ))}

      {selected && (
        <BookingModal
          date={formatDate(selected.date)}
          startTime={selected.slot.startTime}
          endTime={selected.slot.endTime}
          slotId={selected.slot.id}
          onClose={() => setSelected(null)}
          onBooked={handleBooked}
        />
      )}
    </div>
  );
}
