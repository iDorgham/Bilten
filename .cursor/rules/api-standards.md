API standards

Versioning and URLs
- All endpoints under `/v1/`. Breaking changes require new version.

Requests
- Accept/Content-Type: `application/json`.
- Authentication: `Authorization: Bearer <jwt>`.
- Idempotency: provide `Idempotency-Key` for payment-like operations.

Responses
- Success: `200/201` with `{ success: true, data }`.
- Validation error: `400` with `{ success: false, error: { code: "VALIDATION_ERROR", message, details } }`.
- Auth: `401/403`; Not found: `404`; Conflict: `409`.

Pagination
- Query params: `page`, `limit` (max 100). Return `total`, `page`, `limit`.

Errors
- Do not leak stack traces; include stable `code` and user-safe `message`.

