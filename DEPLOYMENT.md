# Deployment Guide

This guide is provider-neutral. Use a managed platform, containers, or a reverse proxy that can run Node.js and serve static files. Never expose MongoDB directly to the internet.

## Production architecture

```text
Internet -> HTTPS reverse proxy / hosting platform
         -> frontend static files (frontend/dist)
         -> backend Node.js API (/api)
         -> authenticated, network-restricted MongoDB
```

TLS should terminate at the hosting platform or reverse proxy. The Node process does not manage certificates.

## 1. Prepare MongoDB

1. Create a dedicated production database and least-privilege application user.
2. Require authentication, strong credentials, encrypted connections, and a network allowlist limited to the backend.
3. Configure automated daily snapshots before importing production data.
4. Keep the connection string only in the backend secret store as `MONGO_URI`.
5. Start the application once in a controlled maintenance window so Mongoose can create declared indexes; inspect them for `User`, `Order`, `Delivery`, `Payment`, `Notification`, `TrackingEvent`, and `ActivityLog`.

## 2. Configure the backend

Copy `backend/.env.example` into the platform secret configuration and replace every placeholder:

```env
NODE_ENV=production
PORT=5000
MONGO_URI=<private authenticated connection string>
JWT_SECRET=<random secret of at least 32 characters>
CLIENT_URL=https://app.example.com
TRUST_PROXY=1
```

Use `TRUST_PROXY=1` only when exactly one trusted platform proxy is in front of Express. Multiple comma-separated `CLIENT_URL` origins are supported; never use `*`.

## 3. Configure the frontend

Set the build-time variable to the public HTTPS API endpoint:

```env
VITE_API_URL=https://api.example.com/api
```

Production builds fail if this variable is missing. No production URL is embedded in source control.

## 4. Install and build

Use clean, lockfile-based installs in CI when practical:

```bash
cd backend
npm install

cd ../frontend
npm install
npm run build
```

Deploy only `frontend/dist` as the frontend artifact. Run the backend from `backend` with `npm start`.

## 5. Domains, HTTPS, and routing

Point the frontend and API domains at their hosting targets and enable HTTPS redirects. Configure the frontend host to serve `index.html` for all routes that do not match a real static asset. Example rewrite semantics:

```text
/* -> /index.html (status 200)
```

Do not rewrite `/assets/*` or actual files. Nested routes such as `/admin/orders`, `/driver/deliveries`, `/customer/orders`, `/notifications`, and `/profile` must survive a direct refresh.

## 6. Start and verify the backend

```bash
cd backend
npm start
```

Startup is fail-fast: invalid environment configuration or an unavailable database exits with a non-zero status. Logs are structured JSON on stdout/stderr and are compatible with platform log collection and rotation.

Verify:

```text
GET https://api.example.com/api/health
200 {"success":true,"message":"Smart Delivery API is running"}
```

A database-unready process returns a generic 503 response and never exposes credentials.

## 7. CORS and security checks

- Confirm the exact `CLIENT_URL` receives the appropriate CORS headers.
- Confirm an unrelated origin receives 403.
- Check Helmet headers, 100 KB request limits, auth/tracking/payment rate limits, JWT expiry, RBAC, and ownership controls.
- Confirm `.env`, tokens, passwords, database credentials, uploads, and logs are absent from the deployed static artifact.

## 8. Go-live smoke test

1. Open Home, Register, Login, and Track Delivery over HTTPS.
2. Register/login a customer and create an order.
3. Confirm the order as admin and assign an available driver.
4. Accept, pick up, start transit, mark out for delivery, and deliver as the assigned driver.
5. Verify order, delivery, timeline, notifications, payment, dashboards, analytics, and reports agree.
6. Test COD pending/paid, a failed payment, and a bounded refund on disposable test records.
7. Verify admin, driver, and customer protected routes and role redirects.
8. Test maintenance mode, registration disablement, payment-method disablement, and user suspension, then restore intended settings.
9. Test mobile, tablet, and desktop layouts and inspect the browser console/network panel.

## 9. Monitoring

Monitor `/api/health`, process restarts, HTTP 5xx/429 rates, response latency, MongoDB connection events, authentication rejections, and payment failures. Alert on sustained downtime, repeated database disconnects, abnormal authentication failures, or elevated latency. Do not log tokens, passwords, secrets, full request bodies, or payment credentials.

## 10. Backup and recovery

- Run encrypted daily database backups; retain daily copies for 14 days and monthly copies for 12 months, adjusted to business/legal requirements.
- Keep at least one copy in a separate account or failure domain and restrict restore permissions.
- Back up persistent avatar/proof storage separately if local storage is retained.
- Perform a quarterly restore drill into an isolated database. Record backup time, restore time, record counts, index state, and application smoke-test results.

Recovery procedure:

1. Stop writes or enable maintenance mode.
2. Select the latest verified backup before the incident and restore it into a new isolated database.
3. Validate collection counts, representative orders/deliveries/payments, indexes, and referential consistency.
4. Point a staging backend at the restored database and run health/auth/order/tracking/payment smoke tests.
5. Switch production `MONGO_URI` only after approval, restart safely, monitor closely, and preserve the failed database for investigation.

Never test restores over the active production database.

## 11. Troubleshooting

- Startup exits with `configuration.invalid`: verify all required variables, explicit CORS origins, and a 32+ character production JWT secret.
- Startup exits after `database.connection_failed`: verify DNS/network allowlists, authentication, TLS settings, and database availability without printing the URI.
- Browser reports CORS failure: make the deployed frontend origin exactly match `CLIENT_URL`, including scheme and port.
- Nested route returns host 404: add the SPA fallback rewrite to `index.html`.
- Frontend calls the wrong API: rebuild with the correct `VITE_API_URL`; Vite variables are embedded at build time.
- Uploaded files disappear: provision persistent storage or migrate uploads to an approved durable store.
