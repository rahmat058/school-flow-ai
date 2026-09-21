# Design — Backend (API Contract)

The backend's "visual language" is its API contract — consistent shapes the frontend can rely on.

## URL conventions

- Global prefix `/api/v1`; plural, kebab-case resources: `/fees/structures`, `/report-cards`
- Nested actions as sub-resources: `/homework/:id/submit`, `/exams/:id/publish`
- Filters via query params: `?classId=&from=&to=&status=`

## Response envelope (success)

```json
{ "success": true, "data": { ... }, "meta": { "page": 1, "limit": 20, "total": 42 } }
```

- Single resource → `data` is an object; lists → `data` is an array + `meta` pagination
- `meta` omitted when not paginated

## Error envelope

```json
{ "success": false, "error": { "code": "FEE_NOT_FOUND", "message": "Invoice not found", "details": [] } }
```

- `code`: `SCREAMING_SNAKE`, namespaced by domain (`AUTH_*`, `FEE_*`, `ATTENDANCE_*`)
- Validation errors → 400 with `details` array of field messages
- Codes: 200 OK · 201 Created · 400 Validation · 401 Unauthenticated · 403 Forbidden · 404 Not Found · 409 Conflict · 429 Rate Limited · 500 Server Error

## Field naming & types

- `camelCase` everywhere in JSON
- IDs are UUID strings; dates ISO-8601 (`2026-09-21T10:30:00Z`); date-only as `YYYY-MM-DD`
- Money as integer **paise** (e.g. `150000` = ₹1,500.00) — never floats
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
