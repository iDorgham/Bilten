# Delivery Plan

## Milestones
- M1 (Weeks 1-3): Auth, Organizer Event CRUD, Basic Payments
  - Backend: auth, events, tickets (CRUD), payments test flow
  - Frontend: login/register, organizer create event
- M2 (Weeks 4-6): Discovery, Cart/Checkout, Tickets/QR
  - Backend: search endpoints (FTS), orders, webhooks
  - Frontend: events list with filters, cart/checkout, ticket view
- M3 (Weeks 7-9): Analytics, Notifications, PWA polish
  - Backend: analytics endpoints, email templates
  - Frontend: dashboard charts, PWA manifest/service worker

## Dependencies
- Stripe keys, S3 bucket, Postgres instance, Email/SMS providers

## Risks
- Payment integration delays -> feature flags; test mode first
- Search performance -> add caching; consider OpenSearch later
