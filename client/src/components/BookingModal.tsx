import { useState } from "react";
import type { FormEvent } from "react";
import { createBooking } from "../api";
import { formatTime12h } from "../format";
import Modal from "./Modal";
import TextField from "./TextField";
import { ClockIcon, MailIcon, MessageIcon, UserIcon } from "./icons";

interface Props {
  date: string;
  startTime: string;
  endTime: string;
  slotId: string;
  onClose: () => void;
  onBooked: () => void;
}

export default function BookingModal({ date, startTime, endTime, slotId, onClose, onBooked }: Props) {
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [topic, setTopic] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createBooking({ slotId, studentName, studentEmail, topic });
      onBooked();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <h2 className="text-lg font-semibold text-ink">Request this slot</h2>
      <p className="flex items-center gap-1.5 mt-1 text-sm text-ink-light">
        <ClockIcon className="w-3.5 h-3.5" />
        {date} &middot; {formatTime12h(startTime)}–{formatTime12h(endTime)}
      </p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <TextField
          label="Your name"
          required
          icon={<UserIcon className="w-4 h-4" />}
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
        />
        <TextField
          label="Email"
          required
          type="email"
          icon={<MailIcon className="w-4 h-4" />}
          value={studentEmail}
          onChange={(e) => setStudentEmail(e.target.value)}
          hint="Use this later to check your booking status."
        />
        <TextField
          label="Presentation topic (optional)"
          icon={<MessageIcon className="w-4 h-4" />}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-md border border-slate-300 py-2 text-sm font-medium text-ink hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-md bg-brand py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {submitting ? "Requesting…" : "Request slot"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
