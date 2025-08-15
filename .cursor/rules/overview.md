Project rules overview

Scope
- Applies to all code in this repository: backend (`/src`), frontend (`/bilten-frontend`), infra and docs.
- Mirrors high-level decisions in `.kiro/steering/*.md` and `team/*.md`.

Principles
- Ship features quickly while maintaining security and quality.
- Prefer clarity and explicitness over cleverness.
- Keep docs succinct; update when behavior changes.

Architecture snapshots
- Stack: Node.js + Express, PostgreSQL, Knex, React frontend, Stripe, AWS S3 (see `.kiro/steering/tech.md`).
- API: REST, versioned under `/v1/`, consistent JSON, proper HTTP codes (see `.kiro/steering/product.md`).

Conventions
- Naming: kebab-case for files; clear, descriptive identifiers in code.
- Error handling: central middleware; never leak stack traces in prod.
- Config via environment variables; secrets never committed.

