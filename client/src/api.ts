export type SlotStatus = "open" | "pending" | "booked";

export interface PublicSlot {
  id: string;
  startTime: string;
  endTime: string;
  status: SlotStatus;
}

export interface PublicAvailabilityDay {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  sessionMinutes: number;
  slots: PublicSlot[];
}

export interface HostAvailabilityDay {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  sessionMinutes: number;
  slots: { id: string }[];
}

export interface Host {
  id: string;
  name: string;
  email: string;
  slug: string;
}

export interface Booking {
  id: string;
  status: "pending" | "confirmed" | "declined";
  studentName: string;
  studentEmail: string;
  topic: string | null;
  createdAt: string;
  confirmedAt: string | null;
  slot: { date: string; startTime: string; endTime: string };
  host?: { name: string; slug: string };
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

const API_BASE = import.meta.env.VITE_API_URL ?? "";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json() : undefined;
  if (!res.ok) {
    throw new ApiError((body && body.error) || `Request failed (${res.status})`, res.status, body);
  }
  return body as T;
}

// ---- Auth ----

export const authSignup = (data: { name: string; email: string; password: string }) =>
  request<{ host: Host }>("/api/auth/signup", { method: "POST", body: JSON.stringify(data) });

export const authLogin = (data: { email: string; password: string }) =>
  request<{ host: Host }>("/api/auth/login", { method: "POST", body: JSON.stringify(data) });

export const authLogout = () => request<{ ok: true }>("/api/auth/logout", { method: "POST" });

export const authMe = () => request<{ authenticated: boolean; host?: Host }>("/api/auth/me");

// ---- Public ----

export const fetchHostBySlug = (slug: string) =>
  request<{ host: { name: string; slug: string }; days: PublicAvailabilityDay[] }>(
    `/api/hosts/${encodeURIComponent(slug)}`
  );

export const createBooking = (data: {
  slotId: string;
  studentName: string;
  studentEmail: string;
  topic: string;
}) => request<Booking>("/api/bookings", { method: "POST", body: JSON.stringify(data) });

export const fetchMyBookings = (email: string) =>
  request<Booking[]>(`/api/bookings?email=${encodeURIComponent(email)}`);

// ---- Host dashboard ----

export const hostFetchAvailability = () => request<HostAvailabilityDay[]>("/api/host/availability");

export const hostCreateAvailability = (data: {
  date: string;
  startTime: string;
  endTime: string;
  sessionMinutes: number;
}) => request<HostAvailabilityDay>("/api/host/availability", { method: "POST", body: JSON.stringify(data) });

export const hostDeleteAvailability = (id: string, force = false) =>
  request<{ ok: true }>(`/api/host/availability/${id}${force ? "?force=true" : ""}`, { method: "DELETE" });

export const hostFetchBookings = (status?: string) =>
  request<Booking[]>(`/api/host/bookings${status ? `?status=${status}` : ""}`);

export const hostConfirmBooking = (id: string) =>
  request<Booking>(`/api/host/bookings/${id}/confirm`, { method: "POST" });

export const hostDeclineBooking = (id: string) =>
  request<Booking>(`/api/host/bookings/${id}/decline`, { method: "POST" });
