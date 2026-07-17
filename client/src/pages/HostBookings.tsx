import { useEffect, useState } from "react";
import { hostConfirmBooking, hostDeclineBooking, hostFetchBookings } from "../api";
import type { Booking } from "../api";
import { formatTime12h } from "../format";
import Avatar from "../components/Avatar";

const tabs = [
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "declined", label: "Declined" },
] as const;

export default function HostBookings() {
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("pending");
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    hostFetchBookings(tab)
      .then(setBookings)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }

  useEffect(() => {
    setBookings(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function handleConfirm(id: string) {
    setBusyId(id);
    try {
      await hostConfirmBooking(id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to confirm");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDecline(id: string) {
    setBusyId(id);
    try {
      await hostDeclineBooking(id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to decline");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`pb-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t.key ? "border-ink text-ink" : "border-transparent text-ink-light hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {!bookings && <p className="text-ink-light text-sm">Loading…</p>}
      {bookings && bookings.length === 0 && (
        <div className="border border-slate-200 rounded-md p-10 text-center">
          <p className="text-ink-light text-sm">Nothing here.</p>
        </div>
      )}

      {bookings && bookings.length > 0 && (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="border border-slate-200 rounded-md p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Avatar name={b.studentName} className="w-9 h-9 text-xs mt-0.5" />
                  <div>
                    <p className="font-medium text-ink">{b.studentName}</p>
                    <p className="text-sm text-ink-light">{b.studentEmail}</p>
                    {b.topic && <p className="text-sm text-ink-light mt-1">"{b.topic}"</p>}
                    <p className="text-xs text-ink-light mt-1">
                      {b.slot.date} &middot; {formatTime12h(b.slot.startTime)}–{formatTime12h(b.slot.endTime)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {b.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleConfirm(b.id)}
                        disabled={busyId === b.id}
                        className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => handleDecline(b.id)}
                        disabled={busyId === b.id}
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-ink hover:bg-slate-50 disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </>
                  )}
                  {b.status === "confirmed" && (
                    <button
                      onClick={() => handleDecline(b.id)}
                      disabled={busyId === b.id}
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-ink hover:bg-slate-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
