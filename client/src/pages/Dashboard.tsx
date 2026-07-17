import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { authLogout } from "../api";
import { useAuth } from "../hooks/useAuth";
import HostAvailability from "./HostAvailability";
import HostBookings from "./HostBookings";

export default function Dashboard() {
  const navigate = useNavigate();
  const { loading, host } = useAuth();
  const [tab, setTab] = useState<"availability" | "bookings">("bookings");
  const [copied, setCopied] = useState(false);

  if (loading) return <p className="text-ink-light">Loading…</p>;
  if (!host) return <Navigate to="/login" replace />;

  const bookingLink = `${window.location.origin}/book/${host.slug}`;

  async function handleLogout() {
    await authLogout();
    navigate("/");
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(bookingLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Welcome, {host.name}</h1>
          <p className="text-sm text-ink-light">Manage your availability and requests here.</p>
        </div>
        <button onClick={handleLogout} className="text-xs font-medium text-ink-light hover:text-ink">
          Log out
        </button>
      </div>

      <div className="border border-slate-200 rounded-md p-4">
        <p className="text-xs font-medium text-ink-light mb-2">Your shareable booking link</p>
        <div className="flex gap-2">
          <input
            readOnly
            value={bookingLink}
            onFocus={(e) => e.currentTarget.select()}
            className="flex-1 rounded-md border border-slate-300 bg-surface px-3 py-2 text-sm text-ink"
          />
          <button
            onClick={handleCopy}
            className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark shrink-0"
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-200">
        <button
          onClick={() => setTab("bookings")}
          className={`pb-2 text-sm font-medium border-b-2 -mb-px ${
            tab === "bookings" ? "border-ink text-ink" : "border-transparent text-ink-light hover:text-ink"
          }`}
        >
          Bookings
        </button>
        <button
          onClick={() => setTab("availability")}
          className={`pb-2 text-sm font-medium border-b-2 -mb-px ${
            tab === "availability" ? "border-ink text-ink" : "border-transparent text-ink-light hover:text-ink"
          }`}
        >
          Availability
        </button>
      </div>

      {tab === "bookings" ? <HostBookings /> : <HostAvailability />}
    </div>
  );
}
