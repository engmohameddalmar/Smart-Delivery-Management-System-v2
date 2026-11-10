# Smart Delivery Management System

A full-stack delivery operations platform for customers, drivers, and administrators. It covers order creation, dispatch, delivery tracking, payments, notifications, analytics, account administration, and auditable system configuration.

## Features

- JWT authentication with customer, driver, and admin authorization
- Customer orders and privacy-safe public tracking timelines
- Driver assignment, validated delivery transitions, and proof of delivery
- Payment records, COD collection, refunds, and order/payment synchronization
- In-app notifications with unread state and deletion controls
- Admin dashboards, date-filtered analytics, reports, and CSV export
- User profiles, avatars, password changes, user administration, and soft deletion
- Runtime settings, maintenance mode, activity logs, and responsive role dashboards

Payment methods other than COD are simulated records. The project does not connect to a real payment gateway, email provider, SMS provider, or live GPS service. Automated password-reset email is therefore intentionally not presented as a working feature.

## Technology stack

- Frontend: React 18, Vite, Tailwind CSS, React Router, Axios, Lucide React
- Backend: Node.js, Express, MongoDB, Mongoose, JWT, bcryptjs, Multer
- Security: Helmet, strict CORS allowlist, request limits, rate limiting, role/ownership middleware

## Architecture

```text
frontend/src/
  components/     Reusable UI, charts, order and delivery components
  context/        Authentication and application state
  layouts/        Public and role-specific shells
  pages/          Public, customer, driver, and admin routes
  services/       Configured API client
backend/
  config/         Database and environment validation
  controllers/    Request handlers and business rules
  middleware/     Authentication, authorization, uploads, errors, limits
  models/         MongoDB schemas and indexes
  routes/         Versioned API surface under /api
  uploads/        Runtime-uploaded files (not committed)
  utils/          Seeding, identifiers, notifications, and helpers
```

## Local setup

Prerequisites: Node.js 18+ and MongoDB 6+.

1. Copy `backend/.env.example` to `backend/.env` and set private values.
2. Copy `frontend/.env.example` to `frontend/.env` if the API is not at the development default.
3. Install dependencies and seed the first administrator:

```bash
cd backend
npm install
npm run seed:admin
npm run dev
```

4. In another terminal, start the frontend:

```bash
cd frontend
npm install
npm run dev
```

The default frontend is `http://localhost:5173`; the API is `http://localhost:5000/api`. The admin seed is idempotent and never overwrites an existing account. Public registration can only create customers.

## Environment variables

Backend (`backend/.env`):

| Variable | Required | Purpose |
| --- | --- | --- |
| `NODE_ENV` | Yes | `development`, `test`, or `production` |
| `PORT` | No | API port; defaults to `5000` |
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Signing secret; production requires at least 32 characters |
| `CLIENT_URL` | Yes | Comma-separated allowed browser origins |
| `TRUST_PROXY` | No | Set to `1` behind one trusted reverse proxy |
| `ADMIN_NAME` | Seed only | Initial administrator name |
| `ADMIN_EMAIL` | Seed only | Initial administrator email |
| `ADMIN_PASSWORD` | Seed only | Strong initial administrator password |

Frontend (`frontend/.env`):

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | Production | Public API base, including `/api` |

Never commit `.env` files, production credentials, or signing secrets.

## Roles and access

- Customer: manages their profile, creates permitted orders, views only their orders/payments/tracking, and receives notifications.
- Driver: sees only assigned deliveries, performs allowed state transitions, records proof/COD, and controls availability.
- Admin: manages dispatch, orders, users, payments, reports, analytics, settings, and activity logs.

The backend is authoritative: every sensitive endpoint checks role and, where applicable, resource ownership. Hiding a frontend link is not treated as authorization.

## API overview

- `/api/auth` — registration, login, session restoration, logout
- `/api/users` — own profile and admin user management
- `/api/orders` — order CRUD, customer history, status and tracking
- `/api/deliveries` — dispatch, assignments, driver workflow, proof of delivery
- `/api/tracking` — rate-limited public tracking and protected customer tracking
- `/api/payments` — role-scoped payment records and validated status transitions
- `/api/notifications` — current-user notification center
- `/api/analytics` and `/api/reports` — admin-only metrics and exports
- `/api/settings` and `/api/activity-logs` — protected configuration and audit history
- `/api/health` — service readiness response

Successful API responses use `success` and `data`; failures use a sanitized `message`. Production errors do not expose stack traces.

## Verification

Build the production frontend:

```bash
cd frontend
npm run build
```

Start the backend against a dedicated test database and exercise health, auth, ownership, role protection, state transitions, tracking, payments, notifications, reports, CORS, headers, request limits, and rate limits. Dependency checks:

```bash
cd frontend
npm audit
cd ../backend
npm audit --omit=dev
```

The repository currently has no lint script or dedicated unit-test runner; production build, Node syntax validation, audit, and API integration checks are the release gates.

## Production deployment

1. Provision MongoDB with authentication, backups, restricted network access, monitoring, and sufficient indexes.
2. Set `NODE_ENV=production`, a random 32+ character `JWT_SECRET`, the production `MONGO_URI`, exact HTTPS `CLIENT_URL`, and strong one-time seed credentials.
3. Set `VITE_API_URL` before `npm run build`; deploy `frontend/dist` to a static host configured to fall back to `index.html` for SPA routes.
4. Run the backend with a process manager or container as a non-root user. Persist or replace local upload storage; ephemeral disks will lose uploaded avatars/proofs.
5. Terminate TLS at a trusted reverse proxy. Set `TRUST_PROXY=1` only when that proxy topology is accurate.
6. Restrict inbound traffic, configure logs/alerts, rotate secrets, and never expose MongoDB publicly.
7. Verify the health endpoint, allowed and rejected origins, every role, mobile layouts, uploads, CSV downloads, and restore-from-backup before launch.

The API applies Helmet security headers, a strict CORS allowlist, 100 KB JSON/form limits, file type/size checks, global and sensitive-route rate limits, centralized sanitized errors, JWT token-version invalidation after password changes, and audit logging for administrative actions.

## Health check

`GET /api/health` returns:

```json
{ "success": true, "message": "Smart Delivery API is running" }
```

## Deployment, backup, and troubleshooting

Use [DEPLOYMENT.md](DEPLOYMENT.md) for the provider-neutral production procedure, HTTPS/proxy architecture, SPA rewrites, monitoring, daily backup retention, isolated restore validation, and common startup/CORS/routing troubleshooting. Use [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) as the evidence-based go-live gate.
