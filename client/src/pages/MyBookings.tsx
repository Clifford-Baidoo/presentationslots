import { useState } from "react";
import type { FormEvent } from "react";
import { fetchMyBookings } from "../api";
import type { Booking } from "../api";
import { formatTime12h } from "../format";
import TextField from "../components/TextField";
import DateBadge from "../components/DateBadge";
import { MailIcon } from "../components/icons";

const statusBadge: Record<Booking["status"], string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  declined: "bg-slate-100 text-ink-light border-slate-200",
};

export default function MyBookings() {
  const [email, setEmail] = useState("");
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const results = await fetchMyBookings(email.trim());
      setBookings(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">My bookings</h1>
        <p className="text-sm text-ink-light mt-1">Enter the email you booked with to see your request status.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 items-start">
        <div className="flex-1">
          <TextField
            required
            type="email"
            icon={<MailIcon className="w-4 h-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {bookings && bookings.length === 0 && (
        <div className="border border-slate-200 rounded-md p-10 text-center">
          <p className="text-ink-light text-sm">No bookings found for that email.</p>
        </div>
      )}

      {bookings && bookings.length > 0 && (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="border border-slate-200 rounded-md p-4 flex items-center gap-4"
            >
              <DateBadge date={b.slot.date} />
              <div className="flex-1">
                <p className="font-medium text-ink">
                  {formatTime12h(b.slot.startTime)}–{formatTime12h(b.slot.endTime)}
                </p>
                {b.host && <p className="text-sm text-ink-light">with {b.host.name}</p>}
                {b.topic && <p className="text-sm text-ink-light">{b.topic}</p>}
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border shrink-0 ${statusBadge[b.status]}`}>
                {b.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
