import { Link } from "react-router-dom";

const steps = [
  {
    title: "Open your availability",
    description: "Pick a day, a time window, and a session length. We slice it into bookable slots automatically.",
  },
  {
    title: "Share your link",
    description: "You get a personal booking page like presentationslots.app/book/you. Drop it in an email, a syllabus, anywhere.",
  },
  {
    title: "Confirm requests",
    description: "Bookings land as pending until you approve them — no double-bookings, no back-and-forth.",
  },
];

export default function Landing() {
  return (
    <div className="space-y-20 py-6">
      <section className="text-center max-w-2xl mx-auto space-y-6">
        <h1 className="text-4xl sm:text-5xl font-bold text-ink tracking-tight">
          Book presentation slots, without the back-and-forth.
        </h1>
        <p className="text-lg text-ink-light">
          Open up your availability, share one link, and let people pick a time that works. You confirm — no
          double-bookings, no email chains.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            to="/login?mode=signup"
            className="rounded-md bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-dark transition-colors"
          >
            Get started — it's free
          </Link>
          <Link
            to="/login"
            className="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-ink hover:bg-white transition-colors"
          >
            Sign in
          </Link>
        </div>
      </section>

      <section className="grid sm:grid-cols-3 gap-6">
        {steps.map((step, i) => (
          <div key={step.title} className="border-t-2 border-ink pt-3">
            <span className="text-xs font-semibold text-ink-light">0{i + 1}</span>
            <h2 className="font-semibold text-ink mb-1">{step.title}</h2>
            <p className="text-sm text-ink-light leading-relaxed">{step.description}</p>
          </div>
        ))}
      </section>

      <section className="border border-slate-200 rounded-md p-6 max-w-xl mx-auto text-center space-y-3">
        <p className="text-sm text-ink-light">Already have a link from someone?</p>
        <p className="text-sm text-ink">
          You don't need an account to book a slot — just open the link they shared with you. Use{" "}
          <Link to="/my-bookings" className="text-brand font-medium hover:underline">
            My Bookings
          </Link>{" "}
          to check the status of a request you already sent.
        </p>
      </section>
    </div>
  );
}
