## Task Manager

Central place to navigate and update tasks for Bilten. Use the quick links below to jump to the canonical lists, and update statuses where noted.

### Quick links
- [Detailed Tasks (canonical)](.//context/specs/tasks-detailed.md)
- [Task Breakdown (summary)](.//context/specs/tasks.md)
- [Progress Report](.//context/specs/tasks-progress.md)
- [Phase/Main Tasks](/.kiro/specs/main-tasks.md)

### Status legend
- **TODO**: Not started
- **WIP**: In progress
- **DONE**: Completed and merged

### Today's focus
- [x] Complete S3 image upload integration (B-EVT-011)
- [x] Finish frontend checkout flow (F-PAY-031)
- [x] Implement QR code generation for tickets (B-TKT-050)
- [x] Implement promo codes model (B-PROMO-032)

### Current snapshot
Note: Snapshot summarized from the current codebase; keep the truth in `tasks-detailed.md` up to date.

- **DONE**
  - B-AUTH-001 — Email/password auth with JWT + refresh (`src/routes/auth.js`, `bilten-backend/src/controllers/authController.js`)
  - B-AUTH-002 — RBAC middleware (`src/middleware/auth.js`, `bilten-backend/src/middleware/auth.js`)
  - F-AUTH-003 — Login/Register pages, AuthContext, route guards (`bilten-frontend/src/pages/Login.js`, `bilten-frontend/src/pages/Register.js`, `bilten-frontend/src/context/AuthContext.js`)
  - B-EVT-010 — Events CRUD with ownership checks (`src/routes/events.js`, `bilten-backend/src/controllers/eventsController.js`)
  - B-TIX-020 — Ticket CRUD + availability (`src/routes/tickets.js`)
  - B-ORD-032 — Orders and receipts (`database/migrations/004_create_orders_table.js`, `database/migrations/005_create_order_items_table.js`)
  - F-SRCH-041 — Events listing page (`bilten-frontend/src/pages/Events.js`)
  - B-ANL-080 — Analytics dashboards (`src/routes/analytics.js`)
  - F-ANL-081 — Frontend charts (`bilten-frontend/src/pages/Analytics.js`)
  - B-TKT-050 — Ticket QR generation (`src/utils/qrGenerator.js`, `src/controllers/qrController.js`, `src/routes/qr.js`)
  - B-PROMO-032 — Promo codes model (`src/routes/promo-codes.js`, `src/utils/promoCodeService.js`, `database/migrations/010_create_promo_codes_table.js`)
  - F-PAY-031 — Frontend checkout flow (`bilten-frontend/src/pages/Checkout.js`, `bilten-frontend/src/pages/Pasket.js`, `bilten-frontend/src/pages/OrderDetails.js`)
  - DB-110/DB-111 — Core migrations and seeds (`database/migrations/`, `database/seeds/`)
  - SEC-120 — Helmet/CORS done (`src/server.js`)
  - SEC-121 — Input validation with Joi (`bilten-backend/src/controllers/authController.js`)
  - SEC-122 — Environment-based secrets (`src/config/`)
  - SEC-123 — Stripe integration (`src/routes/payments.js`)
  - DEV-130 — Docker Compose present (`docker-compose.yml`)
  - DOC-151 — README onboarding present (`README.md`)

- **WIP**
  - B-EVT-011 — Uploads working via S3 util; switch to pre-signed flow (`src/routes/uploads.js`)
  - F-EVT-012 — Create form exists; Edit UI pending (`bilten-frontend/src/pages/CreateEvent.js`)
  - F-TIX-021 — Ticket config UI (`bilten-frontend/src/pages/OrganizerTicketManagement.js`)
  - B-PAY-030 — Stripe intents + confirm; add idempotency + webhooks (`src/routes/payments.js`)
  - B-MEDIA-060 — Upload pipeline; harden S3 policy (`src/utils/s3.js`)
  - DEV-131 — CI not configured here; scripts exist
  - QA-140 — Unit tests for routes/services (`tests/`)
  - DOC-150 — OpenAPI spec for /v1 (partial)

- **TODO**
  - B-SRCH-040 — Postgres FTS endpoints
  - B-SRCH-042 — OpenSearch migration plan
  - F-TKT-051 — QR display UI
  - B-NOTIF-070 — Email templates (SendGrid)
  - B-NOTIF-071 — SMS alerts (Twilio)
  - B-ADM-090 / F-ADM-091 — Admin consoles
  - M-SCAN-100 — Mobile scanner PWA
  - QA-141 — Integration tests
  - QA-142 — E2E tests
  - OBS-132 — APM + metrics (DONE)

### How to update statuses
- Edit `.cursor/context/specs/tasks-detailed.md` and append `Status: TODO|WIP|DONE` inside the task line, e.g.
  - `[B-AUTH-001] ... (Status: WIP, Milestone: M1)`
- Keep subtasks checklists under each item in sync as you implement.

### Conventions
- Use the IDs (e.g., `B-AUTH-001`) in commit messages and PR titles for traceability.
- Prefer updating `tasks-detailed.md` first; this page is a convenience index.


