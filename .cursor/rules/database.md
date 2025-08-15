Database standards (PostgreSQL + Knex)

Conventions
- Singular model concepts, plural table names (`users`, `events`, `tickets`).
- Primary keys `id` UUID or serial; timestamps `created_at`, `updated_at` (UTC).
- Foreign keys with `ON DELETE RESTRICT|CASCADE` as appropriate.

Migrations
- One change per migration; down migrations must faithfully revert.
- Use explicit column types and constraints (NOT NULL, CHECKs).

Indexes
- Add indexes for foreign keys and frequent filters; use partial indexes for soft-deleted rows if applicable.

