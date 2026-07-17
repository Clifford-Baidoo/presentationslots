import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ApiError, hostCreateAvailability, hostDeleteAvailability, hostFetchAvailability } from "../api";
import type { HostAvailabilityDay } from "../api";
import { formatTime12h } from "../format";
import ConfirmDialog from "../components/ConfirmDialog";
import DateBadge from "../components/DateBadge";
import { TrashIcon } from "../components/icons";

type DeleteState =
  | { step: "confirm"; day: HostAvailabilityDay }
  | { step: "confirmForce"; day: HostAvailabilityDay; activeBookingCount: number }
  | { step: "error"; message: string };

export default function HostAvailability() {
  const [days, setDays] = useState<HostAvailabilityDay[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("16:00");
  const [sessionMinutes, setSessionMinutes] = useState(15);

  const [deleteState, setDeleteState] = useState<DeleteState | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  function load() {
    hostFetchAvailability()
      .then(setDays)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }

  useEffect(load, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await hostCreateAvailability({ date, startTime, endTime, sessionMinutes });
      setDate("");
      load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function performDelete(day: HostAvailabilityDay, force: boolean) {
    setDeleteBusy(true);
    try {
      await hostDeleteAvailability(day.id, force);
      setDeleteState(null);
      load();
    } catch (err) {
      if (!force && err instanceof ApiError && err.status === 409) {
        const count = (err.body as { activeBookingCount?: number } | undefined)?.activeBookingCount;
        if (typeof count === "number") {
          setDeleteState({ step: "confirmForce", day, activeBookingCount: count });
          return;
        }
      }
      setDeleteState({ step: "error", message: err instanceof Error ? err.message : "Failed to delete" });
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="border border-slate-200 rounded-md p-5 space-y-3">
        <h2 className="font-semibold text-ink">Open a new window</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-ink">Date</label>
            <input
              required
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Start time</label>
            <input
              required
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">End time</label>
            <input
              required
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-ink">Minutes per session</label>
            <input
              required
              type="number"
              min={1}
              max={480}
              value={sessionMinutes}
              onChange={(e) => setSessionMinutes(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>
        </div>
        {formError && <p className="text-sm text-red-600">{formError}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {submitting ? "Creating…" : "Generate slots"}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {!days && <p className="text-ink-light text-sm">Loading…</p>}

      {days && days.length === 0 && (
        <div className="border border-slate-200 rounded-md p-10 text-center">
          <p className="text-ink-light text-sm">No availability windows yet.</p>
        </div>
      )}

      {days && days.length > 0 && (
        <div className="space-y-3">
          {days.map((day) => (
            <div
              key={day.id}
              className="border border-slate-200 rounded-md p-4 flex items-center gap-4"
            >
              <DateBadge date={day.date} />
              <div className="flex-1">
                <p className="font-medium text-ink">{day.date}</p>
                <p className="text-xs text-ink-light">
                  {formatTime12h(day.startTime)}–{formatTime12h(day.endTime)} &middot; {day.sessionMinutes} min
                  &middot; {day.slots.length} slots
                </p>
              </div>
              <button
                onClick={() => setDeleteState({ step: "confirm", day })}
                className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 shrink-0"
              >
                <TrashIcon className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {deleteState?.step === "confirm" && (
        <ConfirmDialog
          title="Delete this window?"
          description={`This removes ${deleteState.day.date} (${formatTime12h(deleteState.day.startTime)}–${formatTime12h(
            deleteState.day.endTime
          )}) and all ${deleteState.day.slots.length} of its slots.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          destructive
          busy={deleteBusy}
          onConfirm={() => performDelete(deleteState.day, false)}
          onCancel={() => setDeleteState(null)}
        />
      )}

      {deleteState?.step === "confirmForce" && (
        <ConfirmDialog
          title="This window has active bookings"
          description={`${deleteState.activeBookingCount} slot${deleteState.activeBookingCount === 1 ? "" : "s"} ${
            deleteState.activeBookingCount === 1 ? "has" : "have"
          } a pending or confirmed booking. Deleting will remove ${
            deleteState.activeBookingCount === 1 ? "it" : "them"
          } too.`}
          confirmLabel="Delete anyway"
          cancelLabel="Cancel"
          destructive
          busy={deleteBusy}
          onConfirm={() => performDelete(deleteState.day, true)}
          onCancel={() => setDeleteState(null)}
        />
      )}

      {deleteState?.step === "error" && (
        <ConfirmDialog
          title="Couldn't delete"
          description={deleteState.message}
          confirmLabel="OK"
          onConfirm={() => setDeleteState(null)}
        />
      )}
    </div>
  );
}
