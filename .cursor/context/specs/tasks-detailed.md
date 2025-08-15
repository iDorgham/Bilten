# Bilten Detailed Tasks & TODO Backlog

Legend
- Status: TODO | WIP | DONE
- Milestone: M1 | M2 | M3
- Owner: role or name

## Epic: Authentication & Authorization

- [B-AUTH-001] Backend: Email/password auth with JWT + refresh (Status: DONE, Milestone: M1)
  - Todos
    - [x] POST /v1/auth/register with validation (zod/joi)
    - [x] POST /v1/auth/login returns access + refresh tokens
    - [x] Refresh rotation endpoint; revoke on reuse
    - [x] Password hashing (bcrypt), min strength rules
    - [x] Central error responses with stable codes
  - Acceptance
    - [x] Valid credentials login succeeds; invalid returns 401 with code=INVALID_CREDENTIALS
    - [x] Refresh token reuse triggers revocation
  - Dependencies: database users table; JWT secret

- [B-AUTH-002] Backend: RBAC middleware (attendee, organizer, admin) (Status: DONE, Milestone: M1)
  - Todos
    - [x] JWT verify middleware extracts roles/claims
    - [x] roleRequired(roles: string[]) guard
  - Acceptance
    - [x] Protected routes reject 403 for insufficient role

- [F-AUTH-003] Frontend: Login, Register pages, AuthContext, route guards (Status: DONE, Milestone: M1)
  - Todos
    - [x] Forms with validation, error display
    - [x] Persist tokens securely; auto-refresh logic
    - [x] Protect organizer routes; redirect to login
  - Acceptance
    - [x] E2E login succeeds and guard blocks anonymous access

## Epic: Events Management (Organizer)

- [B-EVT-010] Backend: Events CRUD (Status: DONE, Milestone: M1)
  - Todos
    - [x] POST/GET/PUT/DELETE /v1/events (owner-scoped)
    - [x] Validation: title, times, capacity constraints
    - [x] Ownership checks; soft-delete optional
  - Acceptance
    - [x] Organizer can create/update/delete only their events

- [B-EVT-011] Backend: Image upload to S3 (Status: DONE, Milestone: M1)
  - Todos
    - [x] Pre-signed URL flow; validate mime/size
    - [x] Store image_url; CloudFront ready
  - Acceptance
    - [x] CloudFront integration with optimization
    - [x] Cache invalidation and URL generation
    - [x] Image optimization service
  - Dependencies: AWS S3, CloudFront setup

- [F-EVT-012] Frontend: Create/Edit Event UI (Status: WIP, Milestone: M1)
  - Todos
    - [x] Multi-step form: details, tickets, media
    - [x] Image uploader (drag-drop), preview
    - [x] Client validation + server errors

## Epic: Tickets & Inventory

- [B-TIX-020] Backend: Ticket tiers and capacity (Status: DONE, Milestone: M1)
  - Todos
    - [x] tickets table, CRUD under event
    - [x] Capacity/remaining; transactional decrement on order
    - [ ] Promo codes model (phase M2)
  - Acceptance
    - [x] Oversell impossible under concurrent orders (DB constraints)

- [F-TIX-021] Frontend: Ticket config UI (Status: WIP, Milestone: M1)
  - Todos
    - [x] Add/edit tiers, price, capacity, sale windows

## Epic: Payments & Checkout

- [B-PAY-030] Stripe integration (Status: WIP, Milestone: M2)
  - Todos
    - [x] Payment intents + confirm
    - [ ] Add idempotency + webhooks

- [F-PAY-031] Frontend checkout flow (Status: DONE, Milestone: M2)
  - Todos
    - [x] Cart management
    - [x] Checkout form
    - [x] Payment integration
    - [x] Order confirmation
  - Acceptance
    - [x] Complete checkout flow from cart to order confirmation
    - [x] Stripe integration with secure payment processing
    - [x] Promo code application and validation
    - [x] Responsive design with glass morphism styling
    - [x] Error handling and loading states
    - [x] Basket clearing on successful payment

- [B-PROMO-032] Promo codes model (Status: DONE, Milestone: M2)
  - Todos
    - [x] Database schema and migrations
    - [x] CRUD operations
    - [x] Validation and calculation logic
    - [x] Usage tracking
    - [x] API endpoints
    - [x] Frontend integration
  - Acceptance
    - [x] Percentage and fixed amount discounts
    - [x] Usage limits and validation
    - [x] Event and ticket type restrictions

## Epic: Checkout & Payments

- [B-ORD-032] Backend: Orders and receipts (Status: DONE, Milestone: M2)
  - Todos
    - [x] orders, order_items tables
    - [ ] Email receipt on success (SendGrid)

## Epic: Search & Discovery

- [B-SRCH-040] Backend: Postgres FTS endpoints (Status: DONE, Milestone: M2)
  - Todos
    - [x] Text index on events; filters: category, location, date, price
    - [x] Sort by relevance/date; pagination
    - [x] Caching of common queries (Redis)
  - Acceptance
    - [x] Full-text search across events, articles, users
    - [x] Relevance scoring with ts_rank_cd
    - [x] Search suggestions and autocomplete
    - [x] Trending searches and analytics
  - Dependencies: PostgreSQL FTS migration, GIN indexes

- [F-SRCH-041] Frontend: Discover page + filters (Status: DONE, Milestone: M2)
  - Todos
    - [x] Search bar, facets, pill filters, empty states

- [B-SRCH-042] Plan migration path to OpenSearch (Status: WIP, Milestone: M3)
  - Todos
    - [x] Abstraction layer (ImageStorageService created)
    - [ ] Parity tests (partially implemented)
    - [ ] ETL draft (framework established)
  - Notes: PostgreSQL FTS implementation provides solid foundation for future migration

## Epic: Tickets Wallet & Check-in

- [B-TKT-050] Backend: Ticket QR generation (Status: DONE, Milestone: M2)
  - Todos
    - [x] Unique QR payload; verification endpoint
  - Acceptance
    - [x] Invalid/used tickets rejected with clear error

- [F-TKT-051] Frontend: My Tickets and QR display (Status: TODO, Milestone: M2)

## Epic: Media & File Storage

- [B-MEDIA-060] S3 storage policies & upload pipeline (Status: DONE, Milestone: M1)
  - Todos
    - [x] IAM least-privilege; size/mime validation
    - [x] Optional image optimization job

## Epic: Notifications (Phase)

- [B-NOTIF-070] Email (SendGrid) transactional templates (Status: TODO, Milestone: M3)
  - Todos
    - [ ] Order confirmation, password reset, event updates

- [B-NOTIF-071] SMS (Twilio) critical alerts (opt-in) (Status: TODO, Milestone: M3)

## Epic: Analytics & Reporting

- [B-TRACK-079] Backend: User activity tracking system (Status: DONE, Milestone: M2)
  - Todos
    - [x] User activity tracking endpoints
    - [x] Event interaction tracking
    - [x] Conversion tracking
    - [x] Performance monitoring
    - [x] Analytics and reporting APIs
  - Acceptance
    - [x] Comprehensive tracking across all user interactions
    - [x] Real-time analytics and heatmap data
    - [x] Campaign and A/B testing support
  - Dependencies: Database tracking tables, analytics service

- [B-ANL-080] Organizer sales & attendance dashboards (Status: DONE, Milestone: M3)
  - Todos
    - [x] Aggregations, endpoints; CSV export

- [F-ANL-081] Frontend charts (Status: DONE, Milestone: M3)

## Epic: Admin Consoles

- [B-ADM-090] Platform Admin minimal tools (Status: WIP, Milestone: M2)
  - Todos
    - [x] Users, events moderation; payouts overview (partially implemented)
    - [ ] Admin dashboard UI components
  - Notes: Backend admin endpoints available, frontend UI pending

- [F-ADM-091] UI pages for admin (Status: TODO, Milestone: M2)

- [F-ORG-092] Organizer Dashboard with tabs (Status: DONE, Milestone: M2)
  - Todos
    - [x] Tabbed dashboard interface (Overview, Events, Tickets, Promo Codes, Analytics, etc.)
    - [x] Promo Code Management integration
    - [x] Analytics and reporting views
    - [x] Event management tools
  - Acceptance
    - [x] Organizers can manage all aspects of their events
    - [x] Promo code creation and management
    - [x] Comprehensive analytics dashboard
  - Dependencies: Promo code system, analytics backend

## Epic: Mobile Scanner (Future)

- [M-SCAN-100] PWA scanning mode; native later (Status: TODO, Backlog)

## Epic: Database Architecture

- [DB-110] Migrations for core schema (users, events, tickets, orders) (Status: DONE, Milestone: M1)
  - Todos
    - [x] Constraints, indexes; timestamps

- [DB-111] Seed data for dev/demo (Status: DONE, Milestone: M1)

## Epic: Security & Compliance

- [SEC-120] Security headers, rate limiting, CORS (Status: DONE, Milestone: M1)
- [SEC-121] Input validation & output encoding (Status: DONE, Milestone: M1)
- [SEC-122] Secrets management via env; no secrets in VCS (Status: DONE, Milestone: M1)
- [SEC-123] PCI via Stripe; do not store PAN (Status: DONE, Milestone: M1)

## Epic: DevOps & Observability

- [DEV-130] Docker Compose for local stack (Status: DONE, Milestone: M1)
- [DEV-131] CI lint/test; pre-commit hooks (Status: WIP, Milestone: M1)
- [OBS-132] New Relic APM + CloudWatch metrics (Status: DONE, Milestone: M2)
  - Todos
    - [x] New Relic APM integration for backend
    - [x] New Relic Browser monitoring for frontend
    - [x] CloudWatch logging integration
    - [x] Custom monitoring service with Winston
    - [x] Health check endpoints
    - [x] Metrics tracking and alerting
    - [x] Monitoring dashboard component
    - [x] Database migrations for monitoring tables
    - [x] Frontend monitoring service
    - [x] Comprehensive documentation
  - Acceptance
    - [x] New Relic APM tracks application performance
    - [x] CloudWatch logs application events
    - [x] Health checks provide system status
    - [x] Custom metrics track business events
    - [x] Monitoring dashboard displays real-time data
    - [x] Alerting system detects issues automatically

## Epic: QA & Testing

- [QA-140] Unit tests for routes/services (Status: WIP, Milestone: M1→)
- [QA-141] Integration tests for auth, orders, payments (Status: TODO, Milestone: M2)
- [QA-142] E2E happy path checkout (Status: TODO, Milestone: M2)

## Epic: Documentation

- [DOC-150] OpenAPI spec for /v1 (Status: WIP, Milestone: M1)
- [DOC-151] Onboarding guide updates (Status: DONE, Milestone: M1)

---

Backlog Notes
- Frontend style: dark theme, Poppins font, glass buttons, 1px outlines applied to all new UI.
- PostgreSQL FTS implementation completed with comprehensive search capabilities.
- Organizer Dashboard with tabbed interface and promo code management completed.
- User activity tracking system implemented with real-time analytics.
- CloudFront integration for image optimization and delivery completed.
- Internationalization and advanced notifications are tracked but out of initial milestones.
