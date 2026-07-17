import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { authMe } from "../api";
import type { Host } from "../api";

// Layout mounts once for the whole app (Outlet swaps only the page below it), so
// without a location dependency its auth check would never re-run after a
// login/logout navigation and the nav would show stale state.
export function useAuth() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [host, setHost] = useState<Host | null>(null);

  useEffect(() => {
    authMe()
      .then((r) => setHost(r.authenticated && r.host ? r.host : null))
      .catch(() => setHost(null))
      .finally(() => setLoading(false));
  }, [location.pathname]);

  return { loading, host, authenticated: host !== null };
}
