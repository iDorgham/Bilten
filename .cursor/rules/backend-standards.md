Backend standards

Runtime and libraries
- Node.js 18+, Express.js, Knex.js (PostgreSQL), JWT auth, Stripe, Multer + S3 for uploads.

Project structure
- Keep route modules under `src/routes`, middleware in `src/middleware`, utilities in `src/utils`.
- Export an Express Router per file; mount under `/v1/`.

Coding
- Prefer async/await; handle errors via `next(err)` to centralized handler.
- Validate inputs on boundaries; never trust request bodies.
- Log with structured messages; avoid logging secrets.

Responses
- JSON shape: `{ success: boolean, data?: T, error?: { code, message, details? } }`.
- Use semantic HTTP status codes; errors include stable `code` values.

Security
- Helmet, CORS with explicit origins, rate limiting on auth and payments.
- JWT bearer required on protected routes; role-based checks in middleware.

Migrations
- Use Knex migrations for schema; seeds only for local/dev.

