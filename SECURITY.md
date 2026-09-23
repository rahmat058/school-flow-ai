# Security Policy

School Flow AI is a full-stack **school management system** — a React frontend
(`frontend/`) and a NestJS + PostgreSQL (Supabase) backend
(`backend/`). It handles student, parent, and staff accounts plus attendance,
homework, exam results, and fee/payment data, so security reports are taken
seriously.

Architecture and design contracts: **[docs/backend/Architecture.md](./docs/backend/Architecture.md)** and **[docs/backend/Design.md](./docs/backend/Design.md)**.

## Supported versions

| Version                      | Supported                         |
| ---------------------------- | --------------------------------- |
| `main` (current development) | Yes                               |
| Older unpublished builds     | No — upgrade to the latest `main` |

Versions are not yet released; fix reports against `main` or your deployment
commit SHA.

## What we protect

- **Authentication** — JWT access (15m) + refresh (7d) via Passport.js;
  passwords are hashed with bcrypt and never returned in responses
- **Secrets** — `passwordHash`, OTPs, and tokens are stripped from API payloads;
  JWT/database/payment secrets live only in server-side environment variables
- **Multi-tenancy** — every table carries `schoolId`; services reject unscoped
  queries so one school can never read another school's data
- **Input validation** — global `ValidationPipe` with class-validator DTOs on
  every request body/query; no untyped `req.body`
- **Rate limiting** — `@nestjs/throttler` on auth, OTP, and AI endpoints
- **Transport hardening** — `helmet` security headers and a locked-down CORS
  policy on the API
- **Payments** — Stripe signature verification and SSLCommerz IPN verification are
  performed server-side; money is stored
  as integer paise, never as floats
- **Uploads** — files are validated and stored via Cloudinary, not on the app
  filesystem

If you are deploying this yourself, also keep `.env` out of version control and
rotate JWT, database, and payment keys if they are ever exposed.

## Reporting a vulnerability

**Do not open a public GitHub issue for security reports.**

1. Contact the maintainer privately via
   [GitHub](https://github.com/rahmat058) (a security advisory is preferred when
   available, or a private message).
2. Include: affected side (frontend/backend), version or commit SHA, steps to
   reproduce, and the impact (for example, cross-tenant data access or auth
   bypass).
3. Do **not** attach real student, parent, or payment data. Use a local or
   seeded test school and a minimal, redacted repro.

We will acknowledge reports as soon as practical and work on a fix for `main`.

## Out of scope

- Attacks that require a compromised or tampered deployment of this codebase
- Social engineering, phishing, or physical access to an unlocked machine
- Vulnerabilities in third-party services (Supabase, Stripe, SSLCommerz, Cloudinary) —
  report those to the respective vendor
- Findings from automated scanners with no demonstrated impact
- Denial of service through raw traffic volume against an unconfigured
  deployment

## Safe contributing

When filing bugs or pull requests:

- Do not paste real student/parent/staff data, tokens, OTPs, or `.env` values
- Reproduce against a local or seeded database, never a production instance
- Follow [CONTRIBUTING.md](./CONTRIBUTING.md) and the
  [Code of Conduct](./CODE_OF_CONDUCT.md)
