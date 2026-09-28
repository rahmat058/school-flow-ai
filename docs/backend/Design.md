# Design — Backend (API Contract)

The backend's "visual language" is its API contract — consistent shapes the frontend can rely on.

## URL conventions

- Global prefix `/api/v1`; plural, kebab-case resources: `/fees/structures`, `/report-cards`
- Nested actions as sub-resources: `/homework/:id/submit`, `/exams/:id/publish`, `/schools/:id/backup`
- The tenant resource carries its id (`/schools/:id` and its `settings`/`backup` sub-resources) and the service refuses a school that is not the caller's own; a person-addressed resource uses `me` (a person's own slice: `/attendance/me`, `/fees/me`, `/exams/me`, `/timetables/me`, `/progress/me`) rather than carrying an id, because the caller comes from the session — with an optional `?studentId=` where a guardian may pick one of their own children
- Filters via query params: `?classId=&from=&to=&status=`
- Report families are one route per report rather than a `?type=`: `/fees/reports/day-book`,
  `/fees/reports/class`, `/fees/reports/defaulters`, `/fees/reports/student-ledger`
- Methods: `PATCH` for partial updates — send only the fields that changed, and treat it as the default for every update route; `PUT` only where the body replaces a whole sub-resource (`PUT /timetables/:id` replaces its `periods`); a `PATCH` body is never required to carry every field
- Interactive docs: the OpenAPI document and Swagger UI are served at `/docs` with the raw JSON at `/docs/json` — outside the `/api/v1` prefix, generated from the controllers/DTOs, and off when `SWAGGER_ENABLED=false`

## Response envelope (success)

```json
{ "success": true, "message": "Schools retrieved", "data": { ... }, "meta": { "page": 1, "limit": 10, "totalItems": 42, "totalPage": 5, "links": { "self": "/schools?page=1&limit=10", "first": "/schools?page=1&limit=10", "last": "/schools?page=5&limit=10", "prev": null, "next": "/schools?page=2&limit=10" } } }
```

- `message` is a human-readable summary of what `data` carries. A route sets its own with `@ResponseMessage('…')`; without one the interceptor falls back to a method default (`GET` → "Data retrieved", `POST` → "Request processed", `PATCH`/`PUT` → "Resource updated", `DELETE` → "Resource deleted")
- Single resource → `data` is an object; lists → `data` is an array + `meta` pagination
- `meta` is omitted when not paginated, and carries **no** `links` on a single-resource read

## Pagination & links

- A list paginates through `meta`: **`limit` defaults to 10** and `page` to 1; `totalItems` is the full row count (not the page length) and `totalPage` is `max(1, ceil(totalItems / limit))`
- `meta.links.self`/`first`/`last`/`prev`/`next` are **API-relative** (no `/api/v1`) and keep the filters the request carried, overriding only `page`/`limit`; `prev`/`next` are `null` at the ends
- A single-resource response (get / create / update on a resource route) carries `links` **inside `data`** — `self` (the collection), `get`/`update`/`delete` (the item) — added by the interceptor for a controller marked `@Resource('<base>')`:

```json
{
  "id": "…",
  "name": "…",
  "links": { "self": "/schools", "get": "/schools/…", "update": "/schools/…", "delete": "/schools/…" }
}
```

- Auth, health and registration responses carry neither `meta` nor `links`

## Error envelope

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Invoice not found",
  "error": { "code": "FEE_NOT_FOUND", "message": "Invoice not found", "details": ["amountPaise"] }
}
```

- The top-level `message` repeats `error.message` — the actual thrown message — so a client reads one field for either outcome
- `statusCode` carries the numeric HTTP status in the body as well as on the response, so a client can read it without inspecting the transport
- `code`: `SCREAMING_SNAKE`, namespaced by domain (`AUTH_*`, `FEE_*`, `ATTENDANCE_*`)
- `details` is a `string[]` of **field names**, present on the 400 validation codes; the full catalogue of the mock's 60 codes is in `Access.md` §4
- Codes: 200 OK · 201 Created · 400 Validation · 401 Unauthenticated · 403 Forbidden · 404 Not Found · 409 Conflict · 429 Rate Limited · 500 Server Error

## Response headers

- Every response carries a `Cache-Control` directive, written globally by a response interceptor (not per route), chosen by whether the route is public:
  - **Public routes** (`@Public()` — registration, login, refresh, logout, health) → `public, max-age=60`, so a shared cache or CDN may hold them for a minute
  - **Authenticated routes** (everything else) → `private, max-age=5`, so the browser may reuse a response for a few seconds but no shared cache stores per-user data
- The header is set before the handler runs, so error responses carry it too
- Standard security headers (`helmet`) apply to every response as well

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
