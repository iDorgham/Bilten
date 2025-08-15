# Application Structure

## Frontend (bilten-frontend)
- src/
  - pages/: Home, Events, Login, Register, CreateEvent
  - components/: Navbar, shared UI (Button, Card, Input)
  - context/: AuthContext
  - services/: api client
  - styles: Tailwind config, global styles (dark + Poppins)

Routing
- Public: Home, Events (discover), Login, Register
- Authenticated attendee: My Tickets, Profile
- Organizer: Dashboard, Events, Create Event, Orders, Analytics

## Backend (api)
- src/
  - routes/: auth, users, events, tickets, payments, uploads, index
  - middleware/: auth, error handler, rate limit, cors, helmet
  - utils/: database, jwt, s3
  - server.js: express app bootstrap

API
- Base: /v1/
- JSON envelope: { success, data?, error? }

## Data Model (high level)
- users(id, role, email, password_hash, created_at)
- events(id, organizer_id, title, description, location, starts_at, ends_at, image_url, created_at)
- tickets(id, event_id, type, price_cents, currency, capacity, remaining, created_at)
- orders(id, user_id, status, total_cents, currency, created_at)
- order_items(id, order_id, ticket_id, quantity, price_cents)
