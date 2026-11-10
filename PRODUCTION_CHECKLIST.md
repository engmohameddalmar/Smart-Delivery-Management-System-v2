# Production Checklist

Check every item against the actual deployment. Attach evidence or a ticket reference where your release process supports it.

## Environment

- [ ] `NODE_ENV=production` is set.
- [ ] `VITE_API_URL` points to the HTTPS production API and the frontend was rebuilt.
- [ ] `CLIENT_URL` contains only exact trusted HTTPS origins.
- [ ] Secrets are held in the platform secret store, not source control or static assets.
- [ ] `TRUST_PROXY` matches the real proxy topology.

## Database and backups

- [ ] MongoDB authentication, TLS, least privilege, and network restrictions are enabled.
- [ ] Production indexes were inspected for all seven core collections.
- [ ] Automated daily backup completed successfully.
- [ ] Retention and off-site/failure-domain copies are configured.
- [ ] A restore drill was completed in an isolated database and verified.
- [ ] Persistent upload storage has its own backup/retention policy.

## Security

- [ ] Helmet headers are present and `X-Powered-By` is absent.
- [ ] Untrusted CORS origins are rejected.
- [ ] Global and sensitive-route rate limits activate without blocking normal use.
- [ ] JSON/form and upload size/type limits are enforced.
- [ ] Password hashing, JWT expiry/version invalidation, input/ObjectId validation, RBAC, and ownership checks passed.
- [ ] Malformed JSON, invalid/expired/missing JWT, wrong role/owner, negative amounts, excessive refunds, and large pagination are rejected safely.
- [ ] Production 500 responses contain no stack, file path, database detail, or secret.

## Frontend

- [ ] Clean production build succeeds with no broken imports.
- [ ] Static CSS, JS, icons, and permitted images load over HTTPS.
- [ ] SPA rewrites preserve refreshes on public, admin, driver, customer, profile, and notification routes.
- [ ] Unknown routes show the application 404 page.
- [ ] Mobile, tablet, and desktop navigation/forms/tables/charts have been visually tested.
- [ ] Production bundle contains no localhost/127.0.0.1 API target.

## Backend and monitoring

- [ ] `npm start` connects to production MongoDB and starts successfully.
- [ ] Missing configuration and database failure exit safely with non-zero status.
- [ ] `/api/health` is monitored and returns the documented lightweight response.
- [ ] Structured stdout/stderr logs are collected and retained with rotation.
- [ ] Alerts cover uptime, 5xx errors, latency, database disconnects, auth failures, and payment failures.
- [ ] Unknown API routes return consistent JSON 404 responses.

## Authentication and users

- [ ] Registration, login, logout, expiry, protected routes, and role redirects passed.
- [ ] Customer, driver, and admin permissions were tested independently.
- [ ] Suspended users cannot log in or use existing protected sessions; reactivation restores access.
- [ ] Registration setting blocks both UI and API when disabled.

## Orders, deliveries, and tracking

- [ ] Customer order creation and ownership isolation passed.
- [ ] Admin confirmation and driver assignment passed.
- [ ] Driver accept, pickup, transit, out-for-delivery, delivered, failed, and rejection rules passed.
- [ ] Order and delivery statuses stay synchronized through one complete delivery.
- [ ] Public valid/invalid tracking and the protected timeline passed without privacy leakage.

## Payments and notifications

- [ ] COD pending and assigned-driver COD paid flows passed.
- [ ] Failed payment and bounded refund flows passed.
- [ ] Disabled payment methods are hidden in the UI and rejected by the API.
- [ ] Payment records, order status, analytics, reports, and notifications stay synchronized.
- [ ] Notification unread/read-all/delete controls passed for the owning user.

## Administration and reporting

- [ ] Dashboard, users, customers, drivers, orders, deliveries, payments, settings, and activity logs load successfully.
- [ ] Reports, CSV exports, analytics date filters, and pagination passed against production-like data volume.
- [ ] Maintenance mode blocks public use while preserving admin login/access, then restores cleanly.
- [ ] Audit logs record important administrative actions without sensitive data.

## Final release

- [ ] Health, login, complete order-to-delivery, tracking, payment, analytics, and report smoke tests passed after deployment.
- [ ] Browser console/network checks show no unexplained errors or mixed content.
- [ ] Backup exists immediately before go-live and the restore procedure owner is available.
- [ ] Rollback owner, release owner, and incident contacts are confirmed.
- [ ] Go-live decision and any accepted risks are documented.
