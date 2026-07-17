import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive ? "bg-brand-light text-brand" : "text-ink-light hover:bg-slate-100 hover:text-ink"
  }`;

export default function Layout() {
  const { loading, authenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2 font-semibold text-ink">
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="5" width="18" height="16" rx="3" stroke="white" strokeWidth="2" />
                <path d="M3 10H21" stroke="white" strokeWidth="2" />
                <path d="M8 3V6" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <path d="M16 3V6" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            BookIt
          </NavLink>
          <nav className="flex items-center gap-1">
            <NavLink to="/my-bookings" className={linkClass}>
              My Bookings
            </NavLink>
            {!loading &&
              (authenticated ? (
                <NavLink to="/dashboard" className={linkClass}>
                  Dashboard
                </NavLink>
              ) : (
                <NavLink
                  to="/login"
                  className="ml-1 rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark transition-colors"
                >
                  Sign in
                </NavLink>
              ))}
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
