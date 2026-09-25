# Design — Backend (API Contract)

The backend's "visual language" is its API contract — consistent shapes the frontend can rely on.

## URL conventions

- Global prefix `/api/v1`; plural, kebab-case resources: `/fees/structures`, `/report-cards`
- Nested actions as sub-resources: `/homework/:id/submit`, `/exams/:id/publish`, `/schools/current/backup`
- A resource the caller **is** addresses itself as `current` (the tenant: `/schools/current` and its `settings`/`backup` sub-resources) or `me` (a person's own slice: `/attendance/me`, `/fees/me`, `/exams/me`, `/timetables/me`, `/progress/me`) rather than carrying an id, because the caller comes from the session — with an optional `?studentId=` where a guardian may pick one of their own children
- Filters via query params: `?classId=&from=&to=&status=`
- Report families are one route per report rather than a `?type=`: `/fees/reports/day-book`,
  `/fees/reports/class`, `/fees/reports/defaulters`, `/fees/reports/student-ledger`
- Methods: `PATCH` for partial updates — send only the fields that changed, and treat it as the default for every update route; `PUT` only where the body replaces a whole sub-resource (`PUT /timetables/:id` replaces its `periods`); a `PATCH` body is never required to carry every field

## Response envelope (success)

```json
{ "success": true, "data": { ... }, "meta": { "page": 1, "limit": 10, "total": 42 } }
```

- Single resource → `data` is an object; lists → `data` is an array + `meta` pagination
- Pagination is `meta { page, limit, total }`; **`limit` defaults to 10**, `page` to 1
- `meta` omitted when not paginated

## Error envelope

```json
{ "success": false, "error": { "code": "FEE_NOT_FOUND", "message": "Invoice not found", "details": ["amountPaise"] } }
```

- `code`: `SCREAMING_SNAKE`, namespaced by domain (`AUTH_*`, `FEE_*`, `ATTENDANCE_*`)
- `details` is a `string[]` of **field names**, present on the 400 validation codes; the full catalogue of the mock's 60 codes is in `Access.md` §4
- Codes: 200 OK · 201 Created · 400 Validation · 401 Unauthenticated · 403 Forbidden · 404 Not Found · 409 Conflict · 429 Rate Limited · 500 Server Error

## Field naming & types

- `camelCase` everywhere in JSON
- IDs are UUID strings; dates ISO-8601 (`2026-09-21T10:30:00Z`); date-only as `YYYY-MM-DD`
- Money as an integer minor unit, with a `*Paise` field suffix (`amountPaise`, `paidPaise`) — never a float. The demo school declares `currency: 'USD'` while the fields are suffixed `*Paise` — a rupee-vs-dollar mismatch recorded as an open question in `Schema.md` §1, not resolved here
- Enum values `SCREAMING_SNAKE` (`PRESENT`, `PENDING`, `UNIT`)
- Sensitive fields (`passwordHash`, OTP codes) never appear in responses

## Auth headers

- `Authorization: Bearer <accessToken>`; refresh via `POST /auth/refresh`
- Socket.io handshake: `auth: { token }` on connection

## Socket events

- Client → server: `chat:join`, `chat:message`, `chat:typing`, `chat:read`
- Server → client: `chat:message`, `notification:new`, `attendance:marked`
- Payloads mirror REST DTO shapes

## File uploads

- `multipart/form-data` to resource endpoint (`/materials`); response returns stored `fileUrl`
- Max 10MB; allowed: PDF, JPG, PNG, DOCX

## Versioning & compatibility

- Breaking changes require `/api/v2` — never mutate v1 contracts
- New optional fields may be added freely; never rename or remove fields in v1
