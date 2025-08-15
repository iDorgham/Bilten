Testing standards

Tools
- Backend: Jest + Supertest.
- Frontend: React Testing Library + Jest.

Requirements
- New routes/services require unit tests; critical paths need integration tests.
- Keep tests deterministic; avoid network calls (mock external services like Stripe/S3).

Commands
- Backend: `npm test` from repo root.
- Frontend: `npm test` inside `bilten-frontend`.

