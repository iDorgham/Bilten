# Bilten PRD

## 1. Problem Statement
Event organizers need a single platform to create and manage events, sell tickets, and analyze performance. Attendees need reliable discovery and seamless ticket purchasing across web and mobile.

## 2. Goals
- Enable organizers to publish events and sell tickets within minutes
- Provide fast, relevant search and discovery for attendees
- Ensure secure, reliable payments and ticket delivery
- Offer analytics for organizers and a smooth end-to-end attendee journey

## 3. Non-Goals
- Native mobile apps (initially PWA first per decision log)
- In-person POS hardware integrations (phase 2+)

## 4. Users & Personas
- Organizer: publishes events, configures tickets, monitors sales
- Attendee: discovers, purchases, and manages tickets
- Admin: moderates content, manages users, oversees payouts

## 5. Success Metrics
- Search P95 latency <= 300 ms (cached), <= 800 ms (uncached)
- Checkout completion rate >= 70%
- Refund/chargeback rate <= 0.5%
- Organizer NPS >= 40; Attendee CSAT >= 4.5/5

## 6. Functional Requirements
- Authentication: Email/password with JWT + refresh; roles (attendee, organizer, admin)
- Organizer console: Event CRUD, ticket tiers, promo codes, capacity controls, check-in exports
- Attendee: Event discovery (search, filters), cart/checkout, tickets (QR), profile
- Payments: Stripe card + wallets; idempotent operations; webhook handling
- Media: Image upload to S3; auto optimization
- Notifications: Email (SendGrid), SMS (Twilio) for critical flows (optional phase)
- Analytics: Sales dashboard, attendance reports, export CSV

## 7. Non-Functional Requirements
- Security: OWASP basics, RBAC, rate limiting, input validation
- Availability: 99.9% target; graceful degradation on external failures
- Performance: API P95 <= 400 ms; image optimization and caching
- Privacy/Compliance: PCI via Stripe, GDPR considerations

## 8. Architecture Snapshot
- Backend: Node 18, Express, PostgreSQL (Knex), Redis cache; REST /v1/
- Frontend: React 18 + Tailwind; dark theme, Poppins, glass style, 1px outlines
- Infra: AWS ECS, RDS Postgres, S3 + CloudFront; monitoring via New Relic + CloudWatch

## 9. Key Flows
- Registration/Login -> JWT + refresh rotation
- Create Event -> Ticket tiers -> Publish
- Search/Discover -> Event Details -> Add to Cart -> Checkout -> Confirmation -> Ticket QR
- Webhooks: payment_intent.succeeded|failed -> order state transitions

## 10. Risks & Mitigations
- Payment failures: idempotency keys, retry logic, clear user messaging
- Overselling: database constraints + transactional decrement on availability
- Search scale: start Postgres FTS, plan OpenSearch migration

## 11. Milestones
- M1: MVP (Auth, Organizer event CRUD, Simple checkout)
- M2: Discovery + Filters, Tickets/QR, Organizer dashboard v1
- M3: Analytics, Notifications, Image optimization, PWA features

## 12. Open Questions
- Refund policies per organizer vs platform defaults
- Multi-currency rollout schedule
- Seat maps (future)
