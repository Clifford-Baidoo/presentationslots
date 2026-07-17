# BookIt

A multi-tenant, Calendly-style booking app. Anyone can sign up as a **host**, open up blocks of availability, and get a personal shareable link (`/book/their-slug`) where other people can request a time slot — no account needed to book. Hosts confirm or decline requests from a dashboard; there are never any double-bookings.

Live at: https://presentationslots-server.vercel.app/

## What it does

- **Hosts** sign up with name/email/password, get a unique slug and a shareable booking page.
- A host opens a window of availability (a date, a start/end time, and a session length) and the app slices it into individual bookable slots automatically.
- Anyone with the link can request a slot with just their name, email, and an optional note — no account required.
- Requests land as **pending**; the host confirms or declines them from `/dashboard`. A slot can rack up multiple declined requests but only ever one active (pending/confirmed) booking at a time.
- Students/bookers can look up the status of their own requests across every host at `/my-bookings` using just their email.

## Tech stack

- **Server**: Express + Prisma (Postgres) + TypeScript, ESM
- **Client**: React + React Router + Tailwind v4 + Vite
- **Repo layout**: npm workspaces (`client/`, `server/`), plus a thin `api/` folder used only for the Vercel deployment (see below)

```
├── api/index.ts        # Vercel serverless function entry (wraps server/src/app.ts)
├── client/              # React app (Vite)
├── server/
│   ├── src/app.ts       # Express app (routes, middleware) — no .listen() here
│   ├── src/index.ts     # Local dev entry — imports app.ts and calls .listen()
│   └── prisma/          # schema + migrations
└── vercel.json          # Build/output config + routing for the single-Vercel deploy
```

## Local development

Prerequisites: Node 20+, and a Postgres database (a free [Neon](https://neon.tech) project works well — this app was built and tested against Neon).

```bash
npm install
cp server/.env.example server/.env   # fill in a real DATABASE_URL, and set COOKIE_SECRET
npm run migrate
npm run seed
npm run dev
```

`npm run dev` runs both the client (Vite, http://localhost:5173) and the server (http://localhost:3001) together, with Vite proxying `/api` to the server. Demo login after seeding: `demo@example.com` / `password123` (booking page: `/book/demo`).

### Environment variables (`server/.env`)

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | Postgres connection string |
| `COOKIE_SECRET` | yes (production) | Signs the host session cookie. Falls back to an insecure default locally — always set a real value in production. |
| `PORT` | no | Defaults to 3001. Ignored on Vercel, which assigns its own. |
| `CLIENT_ORIGIN` | only for split hosting | The client's origin, for CORS. Not needed when client + API share an origin (the single-Vercel setup below). |

The client reads one optional build-time variable, `VITE_API_URL` — see split hosting below.

## Deploying

The app supports two different deployment shapes, because it can run as either a single combined service or as two independent ones.

### Option 1 — Everything on one Vercel project (recommended, what's live now)

The client is built as static assets and the Express API runs as a single Vercel serverless function, both under one project/domain — no CORS, no cross-site cookies to worry about.

1. Push the repo to GitHub and import it at https://vercel.com/new.
2. **Root Directory**: leave blank (repo root). This matters — `vercel.json`, the `api/` function, and the client all need to be visible together; setting Root Directory to `client` or `server` breaks this.
3. **Framework Preset**: Other (also pinned via `"framework": null` in `vercel.json`, since Vercel's auto-detection can otherwise misidentify this as a plain Node.js app and break static output).
4. Project → **Storage** tab → create a Postgres database (Neon-backed) and connect it — this auto-injects `DATABASE_URL`.
5. Add `COOKIE_SECRET` under **Settings → Environment Variables**.
6. Deploy. Then run the migration once against that database from your machine:
   ```bash
   # with server/.env pointed at the same DATABASE_URL Vercel is using
   npm run migrate
   npm run seed   # optional, creates the demo account
   ```

`vercel.json` handles the rest: it builds both workspaces (`npm run build`), serves `client/dist` as static output, rewrites `/api/*` to the serverless function, and falls back everything else to `index.html` so client-side routes like `/book/:slug` work on a direct page load (not just in-app navigation).

### Option 2 — Split hosting (client and server on different platforms)

Useful if you'd rather run the API on a platform with a persistent Node process (Render, Railway, Fly.io, a plain VPS, a Docker container — anything that can run `npm run build -w server && npm run start -w server`), and the client anywhere that serves static files (Vercel, Netlify, Cloudflare Pages, etc.).

**Server**, wherever you host it:
- Build command: `npm install && npm run build -w server`
- Start command: `npm run migrate -w server && npm run start -w server`
- Env vars: `DATABASE_URL`, `COOKIE_SECRET`, and `CLIENT_ORIGIN` set to your client's URL (e.g. `https://bookit.vercel.app`) — this is required for CORS and for the session cookie to be sent cross-site.

**Client**, wherever you host it:
- Root directory `client`, build command `npm run build`, output directory `dist`.
- Env var `VITE_API_URL` set to your server's URL (e.g. `https://bookit-api.onrender.com`), so the client calls the API on a different origin instead of assuming same-origin `/api/...` paths.

The code already supports this mode out of the box (`sameSite`/`secure` cookie flags and CORS both switch to their cross-site-safe settings whenever `NODE_ENV=production`) — no code changes needed, just the env vars above.

## Notes

- SQLite was the original datastore during early development; the schema is Postgres-only now (`server/prisma/schema.prisma`) since Option 1 above runs on serverless functions with no persistent disk to hold a SQLite file.
- There's no Dockerfile checked in, but since the server is a plain Express/Node process with no platform-specific code, wrapping it in a container for Option 2 is just `FROM node`, `npm ci && npm run build -w server`, `CMD ["npm", "run", "start", "-w", "server"]`.
