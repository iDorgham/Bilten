Security standards

Practices
- Validate and sanitize all inputs; use parameterized queries via Knex.
- Use `helmet`, strict CORS, and rate limiting.
- Store secrets in environment variables; never commit.
- JWTs: short-lived access tokens, refresh token rotation; secure cookie or httpOnly storage on web.
- File uploads: validate MIME/size; store on S3 with least-privilege IAM.

Compliance
- Follow OWASP ASVS basics; PCI considerations for payment flows.

