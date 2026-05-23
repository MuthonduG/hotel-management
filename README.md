# Hotel PMS

Web-based **property management** workspace for a single hotel: staff sign in, see an operations overview, manage **guests and reservations**, **rooms and housekeeping status**, **reports**, **property settings**, and **staff accounts**. The UI is a dark “ops console” (sidebar, main area, optional status column on wide screens). Data lives in **PostgreSQL** and is served by a small **Express** API.

**This repo is a monorepo:** React frontend + Node backend + Docker Compose for Postgres and the API.

## What you can do with it

| Area | Purpose |
|------|--------|
| **Overview** | Role-aware snapshot: available rooms, arrivals/departures, housekeeping load, revenue estimate (from live data when the API is up). |
| **Guests & arrivals** | Guest registry, reservations, check-in / check-out flows; ties to room inventory. |
| **Rooms** | Room list, status (vacant, occupied, dirty, maintenance, etc.), rates, housekeeping notes. |
| **Reports** | Aggregated metrics: room mix, bookings, pipeline revenue, occupancy-style figures. |
| **Staff accounts** | Create and manage hotel staff (roles, suspend/activate) after the bootstrap admin exists. |
| **Settings** | Property name, timezone, default check-in/out times. |

**Auth:** JWT-based staff login. First-time access uses a **bootstrap system administrator** configured in environment variables (there is no public self-service setup page).

## Tech stack

| Part | Stack |
|------|--------|
| Frontend | React (Vite), Ant Design, TanStack Query, Zustand, React Router |
| Backend | Node.js, Express, PostgreSQL (`pg`), bcrypt, JWT |
| Local / deploy | Docker Compose: Postgres 16 + API image; frontend often run on the host in dev |

## Repository layout

- **`frontend/`** – React SPA (`npm run dev` here, or `npm run dev:frontend` from the repo root).
- **`backend/`** – Express API (`npm run dev` here, or `npm run dev:backend` from root).

Configure **`frontend/.env`** (see `frontend/.env.example`) and **`backend/.env`** (see `backend/.env.example`) when not using only Docker defaults.

## Roles (summary)

The product is built around a **SystemAdmin → General Manager → department managers → line staff** model. Typical mapping:

| Who | Typically creates |
|-----|-------------------|
| SystemAdmin | General Manager (first handoff), recovery for other roles |
| General Manager | Department heads |
| Front Office Manager | Receptionists |
| Housekeeping Manager | Housekeeping staff |
| Maintenance Manager | Maintenance staff |

(Revenue Manager and Accountant are oriented toward reporting in this build, not provisioning every role type.)

## Quick start (development)

From the repo root:

- `npm run dev` – frontend dev server (needs `frontend/.env` with API URL).
- `npm run dev:backend` – API with `--watch` (PostgreSQL must be reachable; use Docker or local Postgres).

Initialize / migrate schema on a **host Postgres** when needed:

```bash
npm run backend:init-db
```

That applies `backend/db/schema.sql`, `migrate_legacy_roles.sql`, and `migrate_pms_tables.sql`.

## Docker (PostgreSQL + API)

From the **repo root**:

```bash
docker compose up --build
```

Or: `npm run docker:up` – builds the backend image and starts Postgres and the API. A new Postgres volume runs bundled SQL via `docker-entrypoint-initdb.d`.

- API: `http://localhost:4000`
- Postgres: `localhost:5432` (defaults often `hotel` / `hotel` / `hotel` – **change for production**).

Set secrets in a root **`.env`** (see `docker.env.example`): especially **`JWT_SECRET`**, **`BOOTSTRAP_ADMIN_PASSWORD`**, and database credentials.

**Frontend in dev:** point Vite at the API, e.g. `VITE_API_BASE_URL=http://localhost:4000/api` in `frontend/.env`.

### Bootstrap IT account

There is **no** public first-time setup page. Use **`BOOTSTRAP_ADMIN_*`** variables; on first boot with an empty `staff` table, a **SystemAdmin** account is created **once**.

- Required: `BOOTSTRAP_ADMIN_USERNAME`, `BOOTSTRAP_ADMIN_PASSWORD`
- Optional: `BOOTSTRAP_ADMIN_NAME`, `BOOTSTRAP_ADMIN_EMAIL`

After login, provision the GM and teams under **Staff accounts**. Prefer **suspend** over delete for departing staff when you need an immediate lockout.

### Existing Postgres volumes (migrations)

Init scripts **do not** re-run after the volume exists. Apply SQL once when you upgrade schema:

```bash
npm run docker:migrate-db
```

Adds legacy role/status columns (`migrate_legacy_roles.sql`).

```bash
npm run docker:migrate-pms
```

Adds PMS tables (rooms, guests, reservations, property settings).

Each command pipes the matching file under `backend/db/` into Postgres (default user/db `hotel`). If your Compose `.env` changes `POSTGRES_USER` or `POSTGRES_DB`, adjust the `psql` invocation accordingly. Nuclear option for local dev only: `docker compose down -v` then bring the stack back up (**wipes the database**).

### Other Compose helpers

- `npm run docker:up:detached` – same stack in the background  
- `npm run docker:down` – stop containers (volume kept unless you add `-v`)

## Production build

- `npm run build` – production build of the frontend (`frontend/`)

---

**Security note:** Intended for demos / internal tooling unless you harden JWT secrets, HTTPS, backups, RBAC, and omit committed `.env` files with real passwords.
