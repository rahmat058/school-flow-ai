# Database Schema (ERD) — Backend

PostgreSQL (Supabase) schema for School Flow AI, derived from the data models in
[`PRD.md`](./PRD.md) §3 and the feature modules in §4.

**Source of truth:** the actual schema lives in `backend/supabase/migrations/`. This file is the
reference ERD — when you change a table, add a migration **and** update the matching table section
here.

> ⚠️ No migrations exist yet — `backend/` currently holds only `package.json` and docs, so every table
> below is a **design target**, not a description of a live database.

**How to read this file.** Each PRD feature has its own section: a feature-level ERD first, then one
subsection per table with a metadata tag, its full column list, its **keys**, its **indexes**, its
**constraints**, and its own ERD. Per-table ERDs draw identity + foreign-key columns; the authoritative
column list is the column table immediately above each diagram.

Two consolidated references close the document: §13 **Foreign Key Map** (every FK with its `on delete`
action) and §14 **Index Plan** (every index, per table). For the whole schema in one diagram, see §19.

## 1. Conventions

**Identifiers:** `snake_case`, plural table names (`fee_invoices`, `conversation_participants`).

`PRD.md` §3 names models in PascalCase with camelCase fields (`FeeInvoice.schoolId`) because that came
from the original Prisma plan, which was dropped in favour of raw Supabase SQL — see
[`Memory.md`](./Memory.md). Raw SQL identifiers are therefore snake_case. The API stays camelCase per
[`Design.md`](./Design.md), so **services map between the two** — `fee_invoices.fee_structure_id` →
`feeStructureId` in JSON. Never expose column names directly.

| Concept     | Postgres type                                    | Notes                                             |
| ----------- | ------------------------------------------------ | ------------------------------------------------- |
| Primary key | `uuid default gen_random_uuid()`                 | all tables                                        |
| Tenant      | `school_id uuid not null references schools(id)` | every tenant table                                |
| Money       | `integer` (paise)                                | never `float` — `150000` = ₹1,500.00              |
| Timestamps  | `timestamptz`                                    | `created_at default now()`, `updated_at` on write |
| Date only   | `date`                                           | ISO `YYYY-MM-DD`                                  |
| Time of day | `time`                                           | timetable periods, event windows                  |
| Soft delete | `deleted_at timestamptz null`                    | profiles + content only                           |
| Arbitrary   | `jsonb`                                          | `schools.settings`, `ai_conversations.messages`   |
| Fixed sets  | Postgres enum                                    | §2 — values `SCREAMING_SNAKE` per `Design.md`     |
| Arrays      | `text[]` / enum[]                                | rendered `text_array` / enum name in ERDs         |

**Primary keys.** Every table has a surrogate `id uuid` primary key **except `notice_classes`**, which
uses the natural composite key `(notice_id, class_id)` — a join row has no identity of its own, and both
of those columns are also foreign keys, so they carry the `PK, FK` marker. `parent_students` keeps a
surrogate `id` plus `unique (parent_id, student_id)` because it carries attributes (`relation`,
`is_primary`).

**Foreign keys.** FKs are declared in the column table (`Key` = `FK`) and listed per table under
**Keys**, with their `on delete` action. The full list is §13. The action policy:

| Situation                                                    | Action     | Why                                                                   |
| ------------------------------------------------------------ | ---------- | --------------------------------------------------------------------- |
| `schools.id` from any tenant table                           | `restrict` | a school purge must be deliberate, never an accidental cascade        |
| Attribution columns (`*_by_id`) that are nullable            | `set null` | the row survives its author; history stays intact                     |
| Optional links (`class_teacher_id`, `class_id`)              | `set null` | the dependent row is valid without the link                           |
| Composition — child has no meaning alone                     | `cascade`  | e.g. `periods` under `timetables`, `fee_heads` under `fee_structures` |
| Anything with history (attendance, invoices, results, marks) | `restrict` | never silently destroy financial or academic records                  |

**Indexes.** Every tenant table is indexed on `school_id` — as a single-column index or as the leading
column of a composite, which is what the tenant guard needs (`PRD.md` §3). See §14 for the full plan.

**Diagram notation:** mermaid ERD supports only `PK`/`FK`/`UK`. Composite keys and partial indexes
cannot be drawn, so they are listed under each table. Solid lines (`||--o{`) are enforced FKs; dotted
lines (`||..o{`) are logical links with no constraint.

**Phases** in the table tags come from [`Phases.md`](./Phases.md). Timetable is the one feature with no
phase assigned — see §18.

## 2. Enums

| Enum                  | Values                                                                                                                 | Column                          |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `role`                | `ADMIN`, `TEACHER`, `STUDENT`, `PARENT`                                                                                | `users.role`                    |
| `subscription_status` | `TRIAL`, `ACTIVE`, `SUSPENDED`, `CANCELLED`                                                                            | `schools.subscription_status`   |
| `record_status`       | `ACTIVE`, `INACTIVE`                                                                                                   | `teachers`/`students`/`parents` |
| `gender`              | `MALE`, `FEMALE`, `OTHER`                                                                                              | `students.gender`               |
| `blood_group`         | `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`                                                                       | `students.blood_group`          |
| `parent_relation`     | `FATHER`, `MOTHER`, `GUARDIAN`                                                                                         | `parent_students.relation`      |
| `otp_purpose`         | `REGISTER`, `RESET_PASSWORD`, `INVITE`                                                                                 | `otps.purpose`                  |
| `attendance_status`   | `PRESENT`, `ABSENT`, `LEAVE`, `LATE`                                                                                   | `attendance.status`             |
| `fee_frequency`       | `MONTHLY`, `QUARTERLY`, `ANNUAL`, `ONE_TIME`                                                                           | `fee_heads.frequency`           |
| `invoice_status`      | `PENDING`, `PARTIAL`, `PAID`, `OVERDUE`                                                                                | `fee_invoices.status`           |
| `payment_status`      | `PENDING`, `PAID`, `FAILED`, `REFUNDED`                                                                                | `fee_payments.status`           |
| `payment_provider`    | `STRIPE`, `SSLCOMMERZ`, `MANUAL`                                                                                       | `fee_payments.provider`         |
| `payment_method`      | `CARD`, `MOBILE_BANKING`, `NET_BANKING`, `CASH`, `CHEQUE`, `DEMAND_DRAFT`, `ONLINE`                                    | `fee_payments.method`           |
| `concession_type`     | `PERCENTAGE`, `FIXED`                                                                                                  | `concessions.type`              |
| `concession_category` | `SIBLING`, `MERIT`, `SC_ST`, `CUSTOM`, `STAFF_WARD`                                                                    | `concessions.category`          |
| `concession_status`   | `PENDING`, `APPROVED`, `REJECTED`                                                                                      | `concessions.status`            |
| `material_type`       | `PDF`, `NOTES`, `WORKSHEET`, `PAPER`                                                                                   | `study_materials.type`          |
| `exam_type`           | `UNIT`, `MID`, `FINAL`, `ANNUAL`                                                                                       | `exams.type`                    |
| `exam_kind`           | `TEST`, `EXAM`                                                                                                         | `exams.kind`                    |
| `weekday`             | `MON`, `TUE`, `WED`, `THU`, `FRI`, `SAT`, `SUN`                                                                        | `timetables.day`                |
| `notice_audience`     | `ALL`, `TEACHERS`, `STUDENTS`, `PARENTS`                                                                               | `notices`/`events.audience`     |
| `notice_priority`     | `HIGH`, `MEDIUM`, `LOW`                                                                                                | `notices.priority`              |
| `permission_group`    | `STUDENTS`, `ATTENDANCE`, `EXAMS`, `HOMEWORK`, `TIMETABLE`, `FEES`, `NOTICES`, `MATERIALS`, `COMMUNICATION`, `REPORTS` | `permissions.group`             |
| `ai_feature`          | `CHAT`, `REPORT_COMMENT`, `FEE_REMINDER`, `NOTICE`, `EVENT_PLAN`, `HOMEWORK_HELP`, `QUIZ`                              | `ai_conversations.feature`      |

## 3. Feature ERD — Foundation & Auth

`PRD.md` §4.1 (registration + OTP), §4.2 (auth/RBAC + the permission catalogue), and the §4.3 profile
tables. Phases 1–2.

**Logins.** Enrolling a student provisions **two** `users` rows, not one: the student's own email and the
guardian's email — both of which the enrolment form collects. The email **is** the login (an address is never
generated for it), so the credentials that reach an inbox are the ones the account expects. Each is created
**unverified** (`is_verified = false`) with its password emailed alongside the invite, and sign-in is refused
until the emailed code confirms it. No profile table carries an email column of its own: `students`,
`teachers` and `parents` all read it from `users`. A real API mints one password per invite; the demo emails
the shared demo password so the flow can actually be exercised.

```mermaid
erDiagram
  schools ||--o{ users : "employs"
  schools ||--o{ teachers : "employs"
  schools ||--o{ students : "enrols"
  schools ||--o{ parents : "registers"
  users ||--|| teachers : "profile"
  users ||--|| students : "profile"
  users ||--|| parents : "profile"
  users ||--o{ refresh_tokens : "issues"
  schools ||--o{ otps : "scopes"
  users ||..o{ otps : "matched by email"
  students ||--o{ parent_students : "has guardians"
  parents ||--o{ parent_students : "has children"
  schools ||--o{ user_permissions : "scopes"
  users ||--o{ user_permissions : "holds"
  users ||--o{ user_permissions : "grants"
  permissions ||--o{ user_permissions : "granted as"
```

### `schools`

<!-- table: schools · module: SchoolsModule · prd: §4.1 · phase: 1 · tenant: root · soft-delete: yes -->

Tenant root. One row per registered school; `settings` holds the academic year, grading scheme, fee
heads, and branding. Created in the registration transaction together with the admin `users` row and
the first `otps` row.

| Column                | Type                  | Null | Key | Notes                    |
| --------------------- | --------------------- | ---- | --- | ------------------------ |
| `id`                  | `uuid`                | no   | PK  | `gen_random_uuid()`      |
| `name`                | `text`                | no   |     |                          |
| `slug`                | `text`                | no   | UK  | auto-generated from name |
| `address`             | `text`                | yes  |     |                          |
| `contact_email`       | `text`                | yes  |     |                          |
| `contact_phone`       | `text`                | yes  |     |                          |
| `logo_url`            | `text`                | yes  |     | Cloudinary               |
| `subscription_status` | `subscription_status` | no   |     | default `TRIAL`          |
| `settings`            | `jsonb`               | no   |     | default `'{}'`           |
| `created_at`          | `timestamptz`         | no   |     | default `now()`          |
| `updated_at`          | `timestamptz`         | no   |     | trigger                  |
| `deleted_at`          | `timestamptz`         | yes  |     | soft delete              |

**Keys** — PK `id` · no foreign keys (this _is_ the tenant) · `unique (slug)`.

**Indexes** — `unique (slug)`, `(subscription_status)`.

**Constraints** — the only table without `school_id`; every other tenant table's `school_id` points
here with `on delete restrict`.

```mermaid
erDiagram
  schools ||--o{ users : "employs"
  schools ||--o{ classes : "owns"
  schools ||--o{ fee_invoices : "issues"
  schools {
    uuid id PK
    text slug UK
  }
  users {
    uuid id PK
    uuid school_id FK
  }
  classes {
    uuid id PK
    uuid school_id FK
  }
  fee_invoices {
    uuid id PK
    uuid school_id FK
  }
```

_Every other tenant table also references `schools`; only a sample is drawn here._

### `users`

<!-- table: users · module: AuthModule · prd: §4.2 · phase: 1 · tenant: yes · soft-delete: yes -->

Authentication identity for all four roles. Profile data lives in `teachers` / `students` / `parents`;
this table holds credentials and RBAC only. `password_hash` (bcrypt, 12 rounds) must never appear in a
response — strip it via select/serializer.

| Column          | Type          | Null | Key | Notes             |
| --------------- | ------------- | ---- | --- | ----------------- |
| `id`            | `uuid`        | no   | PK  |                   |
| `school_id`     | `uuid`        | no   | FK  | → `schools.id`    |
| `email`         | `text`        | no   | UK  | globally unique   |
| `password_hash` | `text`        | no   |     | bcrypt, 12 rounds |
| `role`          | `role`        | no   |     | `ADMIN`…`PARENT`  |
| `is_verified`   | `boolean`     | no   |     | default `false`   |
| `last_login_at` | `timestamptz` | yes  |     |                   |
| `created_at`    | `timestamptz` | no   |     |                   |
| `updated_at`    | `timestamptz` | no   |     |                   |
| `deleted_at`    | `timestamptz` | yes  |     | soft delete       |

**Keys** — PK `id` · FK `school_id` → `schools.id` (restrict) · `unique (email)`.

**Indexes** — `unique (email)`, `(school_id, role)`.

**Constraints** — `is_verified` gates login until the registration OTP is confirmed. Global email
uniqueness is the `PRD.md` §3 reading; per-school is the alternative in §18.

```mermaid
erDiagram
  schools ||--o{ users : "employs"
  users ||--|| teachers : "profile"
  users ||--|| students : "profile"
  users ||--|| parents : "profile"
  users ||--o{ refresh_tokens : "issues"
  users {
    uuid id PK
    uuid school_id FK
    text email UK
  }
  refresh_tokens {
    uuid id PK
    uuid user_id FK
  }
```

### `otps`

<!-- table: otps · module: SchoolsModule · prd: §4.1 · phase: 1 · tenant: yes · soft-delete: no -->

One-time codes for registration and password reset, stored bcrypt-hashed. Ephemeral: 10-minute expiry,
max 5 attempts, 60-second resend cooldown, and rows are purged once expired.

| Column        | Type          | Null | Key | Notes                                |
| ------------- | ------------- | ---- | --- | ------------------------------------ |
| `id`          | `uuid`        | no   | PK  |                                      |
| `school_id`   | `uuid`        | yes  | FK  | → `schools.id`                       |
| `email`       | `text`        | no   |     | matched, not FK'd                    |
| `code_hash`   | `text`        | no   |     | bcrypt                               |
| `purpose`     | `otp_purpose` | no   |     | `REGISTER`/`RESET_PASSWORD`/`INVITE` |
| `attempts`    | `integer`     | no   |     | default `0`, max 5                   |
| `expires_at`  | `timestamptz` | no   |     | created + 10 min                     |
| `consumed_at` | `timestamptz` | yes  |     | set on success                       |
| `created_at`  | `timestamptz` | no   |     |                                      |

**Keys** — PK `id` · FK `school_id` → `schools.id` (cascade) · **no FK to `users`** — codes are matched
by `email`, because a registration OTP precedes the admin's first login.

**Indexes** — `(email, purpose)` (verify/resend lookup), `(expires_at)` (purge job), `(school_id)`.

**Constraints** — a row is usable only while `consumed_at is null and expires_at > now()`.
`school_id` is nullable because a reset OTP can be issued before the linkage is confirmed.

```mermaid
erDiagram
  schools ||--o{ otps : "scopes"
  users ||..o{ otps : "matched by email"
  otps {
    uuid id PK
    uuid school_id FK
    text email
    otp_purpose purpose
  }
```

### `refresh_tokens`

<!-- table: refresh_tokens · module: AuthModule · prd: §4.2 · phase: 1 · tenant: via user · soft-delete: no -->

Server-side store for refresh tokens. Only the hash is persisted; rotation revokes the old row and
inserts a new one, so a replayed token fails.

| Column       | Type          | Null | Key | Notes           |
| ------------ | ------------- | ---- | --- | --------------- |
| `id`         | `uuid`        | no   | PK  |                 |
| `user_id`    | `uuid`        | no   | FK  | → `users.id`    |
| `token_hash` | `text`        | no   | UK  |                 |
| `expires_at` | `timestamptz` | no   |     | issued + 7d     |
| `revoked_at` | `timestamptz` | yes  |     | set on rotation |
| `user_agent` | `text`        | yes  |     | audit           |
| `ip_address` | `text`        | yes  |     | audit           |
| `created_at` | `timestamptz` | no   |     |                 |

**Keys** — PK `id` · FK `user_id` → `users.id` (cascade — tokens are worthless without their user) ·
`unique (token_hash)`.

**Indexes** — `unique (token_hash)`, `(user_id, expires_at)`.

**Constraints** — tenant scope is inherited through `users`, so there is no `school_id` column. Not in
`PRD.md` §3 — added because §4.2 requires server-side refresh storage (§18).

```mermaid
erDiagram
  users ||--o{ refresh_tokens : "issues"
  refresh_tokens {
    uuid id PK
    uuid user_id FK
    text token_hash UK
  }
  users {
    uuid id PK
  }
```

### `teachers`

<!-- table: teachers · module: UsersModule · prd: §4.3 · phase: 2 · tenant: yes · soft-delete: yes -->

Teacher profile, 1:1 with `users`. `employee_no` comes from a per-school sequence. Referenced as class
teacher, subject teacher, and homework author.

| Column             | Type            | Null | Key | Notes               |
| ------------------ | --------------- | ---- | --- | ------------------- |
| `id`               | `uuid`          | no   | PK  |                     |
| `school_id`        | `uuid`          | no   | FK  | → `schools.id`      |
| `user_id`          | `uuid`          | no   | FK  | → `users.id`, 1:1   |
| `employee_no`      | `text`          | no   | UK  | per-school sequence |
| `first_name`       | `text`          | no   |     |                     |
| `last_name`        | `text`          | no   |     |                     |
| `phone`            | `text`          | yes  |     |                     |
| `qualification`    | `text`          | yes  |     |                     |
| `subject`          | `text`          | yes  |     | Primary subject     |
| `experience_years` | `integer`       | yes  |     | Whole years         |
| `joined_at`        | `date`          | yes  |     |                     |
| `status`           | `record_status` | no   |     | default `ACTIVE`    |
| `created_at`       | `timestamptz`   | no   |     |                     |
| `updated_at`       | `timestamptz`   | no   |     |                     |
| `deleted_at`       | `timestamptz`   | yes  |     | soft delete         |

**Keys** — PK `id` · FK `school_id` → `schools.id` (restrict), `user_id` → `users.id` (cascade) ·
`unique (user_id)` (the 1:1 guard), `unique (school_id, employee_no)`.

**Indexes** — `unique (user_id)`, `unique (school_id, employee_no)`, `(school_id, status)`.

**Constraints** — hard-deleting a user removes the profile; normal removal is the `deleted_at` soft
delete.

```mermaid
erDiagram
  schools ||--o{ teachers : "employs"
  users ||--|| teachers : "profile"
  teachers ||--o{ classes : "class teacher"
  teachers ||--o{ subjects : "teaches"
  teachers ||--o{ homework : "creates"
  teachers ||--o{ teacher_classes : "assigned to"
  classes ||--o{ teacher_classes : "has"
  teacher_classes {
    uuid id PK
    uuid teacher_id FK
    uuid class_id FK
  }

  teachers {
    uuid id PK
    uuid school_id FK
    uuid user_id FK
    text employee_no UK
  }
```

### `students`

<!-- table: students · module: UsersModule · prd: §4.3 · phase: 2 · tenant: yes · soft-delete: yes -->

Student profile, 1:1 with `users`. `class_id` is the student's **current** class — the roster.
`admission_no` comes from a per-school sequence.

| Column          | Type            | Null | Key | Notes                         |
| --------------- | --------------- | ---- | --- | ----------------------------- |
| `id`            | `uuid`          | no   | PK  |                               |
| `school_id`     | `uuid`          | no   | FK  | → `schools.id`                |
| `user_id`       | `uuid`          | no   | FK  | → `users.id`, 1:1             |
| `class_id`      | `uuid`          | yes  | FK  | → `classes.id`, nullable      |
| `admission_no`  | `text`          | no   | UK  | per-school sequence           |
| `roll_no`       | `integer`       | no   | UK  | unique within the class (§14) |
| `first_name`    | `text`          | no   |     |                               |
| `last_name`     | `text`          | no   |     |                               |
| `date_of_birth` | `date`          | yes  |     |                               |
| `gender`        | `gender`        | yes  |     |                               |
| `blood_group`   | `blood_group`   | yes  |     | enum, §2                      |
| `status`        | `record_status` | no   |     | default `ACTIVE`              |
| `created_at`    | `timestamptz`   | no   |     |                               |
| `updated_at`    | `timestamptz`   | no   |     |                               |
| `deleted_at`    | `timestamptz`   | yes  |     | soft delete                   |

**Keys** — PK `id` · FK `school_id` → `schools.id` (restrict), `user_id` → `users.id` (cascade),
`class_id` → `classes.id` (set null) · `unique (user_id)`, `unique (school_id, admission_no)`.

**Indexes** — `unique (user_id)`, `unique (school_id, admission_no)`, `(school_id, status)`,
`(class_id)`, and `unique (class_id, roll_no) where deleted_at is null` — partial, so a removed
student's roll number frees up without the old row blocking it.

**Constraints** — `POST /classes/:id/assign-students` rewrites `class_id` for many students. Per-year
enrollment history would need a join table — see §18. A roll number must be unique within its class
and at least 1; the API answers 409 `STUDENT_ROLL_TAKEN` rather than letting the index error surface.

```mermaid
erDiagram
  classes ||--o{ students : "rosters"
  users ||--|| students : "profile"
  students ||--o{ parent_students : "has guardians"
  students ||--o{ attendance : "is marked in"
  students {
    uuid id PK
    uuid school_id FK
    uuid user_id FK
    uuid class_id FK
    text admission_no UK
    integer roll_no UK
  }
```

### `parents`

<!-- table: parents · module: UsersModule · prd: §4.3 · phase: 2 · tenant: yes · soft-delete: yes -->

Parent/guardian profile, 1:1 with `users`. Linked to children through `parent_students`. The guard's
email is the linked `users.email` — the profile itself carries phone and address.

| Column       | Type            | Null | Key | Notes             |
| ------------ | --------------- | ---- | --- | ----------------- |
| `id`         | `uuid`          | no   | PK  |                   |
| `school_id`  | `uuid`          | no   | FK  | → `schools.id`    |
| `user_id`    | `uuid`          | no   | FK  | → `users.id`, 1:1 |
| `first_name` | `text`          | no   |     |                   |
| `last_name`  | `text`          | no   |     |                   |
| `phone`      | `text`          | yes  |     |                   |
| `address`    | `text`          | yes  |     |                   |
| `occupation` | `text`          | yes  |     |                   |
| `status`     | `record_status` | no   |     | default `ACTIVE`  |
| `created_at` | `timestamptz`   | no   |     |                   |
| `updated_at` | `timestamptz`   | no   |     |                   |
| `deleted_at` | `timestamptz`   | yes  |     | soft delete       |

**Keys** — PK `id` · FK `school_id` → `schools.id` (restrict), `user_id` → `users.id` (cascade) ·
`unique (user_id)` (1:1).

**Indexes** — `unique (user_id)`, `(school_id, status)`.

**Constraints** — no natural business key; a phone number is not unique across parents.

```mermaid
erDiagram
  schools ||--o{ parents : "registers"
  users ||--|| parents : "profile"
  parents ||--o{ parent_students : "has children"
  parents {
    uuid id PK
    uuid school_id FK
    uuid user_id FK
  }
```

### `parent_students`

<!-- table: parent_students · module: UsersModule · prd: §4.3 · phase: 2 · tenant: yes · soft-delete: no -->

Join table resolving parent ↔ child (many-to-many). Drives the parent dashboard: attendance, fees,
homework, and results for each linked child.

| Column       | Type              | Null | Key | Notes               |
| ------------ | ----------------- | ---- | --- | ------------------- |
| `id`         | `uuid`            | no   | PK  |                     |
| `school_id`  | `uuid`            | no   | FK  | → `schools.id`      |
| `parent_id`  | `uuid`            | no   | FK  | → `parents.id`      |
| `student_id` | `uuid`            | no   | FK  | → `students.id`     |
| `relation`   | `parent_relation` | no   |     | `FATHER`…`GUARDIAN` |
| `is_primary` | `boolean`         | no   |     | default `false`     |
| `created_at` | `timestamptz`     | no   |     |                     |

**Keys** — PK `id` (surrogate, because the row carries attributes) · FK `school_id` → `schools.id`
(restrict), `parent_id` → `parents.id` (cascade), `student_id` → `students.id` (cascade) ·
`unique (parent_id, student_id)`.

**Indexes** — `unique (parent_id, student_id)`, `(student_id)` (child → guardians), `(school_id)`.

**Constraints** — partial unique index on `(student_id)` where `is_primary` — one primary contact per
student.

```mermaid
erDiagram
  parents ||--o{ parent_students : "has children"
  students ||--o{ parent_students : "has guardians"
  parent_students {
    uuid id PK
    uuid parent_id FK
    uuid student_id FK
    parent_relation relation
  }
```

### `permissions`

<!-- table: permissions · module: AuthModule · prd: §4.2 · phase: 1 · tenant: no · soft-delete: no -->

The platform-wide catalogue of assignable permissions. Rows are seeded, not user-edited: `key` is what a
route checks (`@RequirePermission('students.edit')`), and `group`/`label`/`sort_order` are what the Roles &
Permissions editor renders. There is deliberately no `school_id` — the catalogue is identical for every
school (§16).

| Column       | Type               | Null | Key | Notes                  |
| ------------ | ------------------ | ---- | --- | ---------------------- |
| `id`         | `uuid`             | no   | PK  |                        |
| `key`        | `text`             | no   | UK  | e.g. `students.edit`   |
| `group`      | `permission_group` | no   |     | the editor's heading   |
| `label`      | `text`             | no   |     | human label            |
| `sort_order` | `integer`          | no   |     | order within the group |
| `created_at` | `timestamptz`      | no   |     |                        |

**Keys** — PK `id` · `unique (key)`.

**Indexes** — `unique (key)`, `(group, sort_order)`.

**Constraints** — `check (key ~ '^[a-z_]+(\.[a-z_]+)+$')` — a dotted `resource.action` key, so a typo cannot
create a permission that no route ever checks.

```mermaid
erDiagram
  permissions ||--o{ user_permissions : "granted as"
  permissions {
    uuid id PK
    text key UK
    permission_group group
  }
```

### `user_permissions`

<!-- table: user_permissions · module: AuthModule · prd: §4.2 · phase: 1 · tenant: yes · soft-delete: no -->

One granted permission for one account — the **effective** set. A new account is seeded from the role matrix
in `PRD.md` §2 at creation, and this table is authoritative afterwards, which is what lets the editor turn a
role default **off**: the `PUT` replaces the set rather than merging into it.

| Column          | Type          | Null | Key | Notes                      |
| --------------- | ------------- | ---- | --- | -------------------------- |
| `id`            | `uuid`        | no   | PK  |                            |
| `school_id`     | `uuid`        | no   | FK  | → `schools.id`             |
| `user_id`       | `uuid`        | no   | FK  | → `users.id`               |
| `permission_id` | `uuid`        | no   | FK  | → `permissions.id`         |
| `granted_by_id` | `uuid`        | yes  | FK  | → `users.id`, who saved it |
| `created_at`    | `timestamptz` | no   |     |                            |

**Keys** — PK `id` · FK `school_id` → `schools.id` (restrict), `user_id` → `users.id` (cascade),
`permission_id` → `permissions.id` (cascade — retiring a catalogue row drops its grants), `granted_by_id` →
`users.id` (set null) · `unique (user_id, permission_id)`.

**Indexes** — `unique (user_id, permission_id)`, `(school_id)`, `(permission_id)`.

**Constraints** — none beyond the unique. A grant is removed, never soft-deleted, so there is no `deleted_at`.

```mermaid
erDiagram
  users ||--o{ user_permissions : "holds"
  users ||--o{ user_permissions : "grants"
  permissions ||--o{ user_permissions : "granted as"
  user_permissions {
    uuid id PK
    uuid school_id FK
    uuid user_id FK
    uuid permission_id FK
    uuid granted_by_id FK
  }
```

## 4. Feature ERD — Classes & Subjects

`PRD.md` §4.4. Phase 2.

```mermaid
erDiagram
  schools ||--o{ classes : "owns"
  schools ||--o{ subjects : "owns"
  teachers ||--o{ classes : "leads"
  classes ||--o{ subjects : "offers"
  teachers ||--o{ subjects : "teaches"
  classes ||--o{ students : "rosters"
```

### `teacher_classes`

<!-- table: teacher_classes · module: UsersModule · prd: §4.3 · phase: 2 · tenant: yes · soft-delete: no -->

Which classes a teacher takes. Separate from `classes.class_teacher_id`, which records the one
homeroom teacher per class — a teacher can teach in several classes without leading any of them.

| Column       | Type          | Null | Key | Notes                |
| ------------ | ------------- | ---- | --- | -------------------- |
| `id`         | `uuid`        | no   | PK  |                      |
| `school_id`  | `uuid`        | no   | FK  | → `schools.id`       |
| `teacher_id` | `uuid`        | no   | FK  | → `teachers.id`      |
| `class_id`   | `uuid`        | no   | FK  | → `classes.id`       |
| `created_at` | `timestamptz` | no   |     | assignment timestamp |

**Keys** — PK `id` · FK `school_id` → `schools.id` (restrict), `teacher_id` → `teachers.id`
(cascade), `class_id` → `classes.id` (cascade) · `unique (teacher_id, class_id)`.

**Indexes** — `unique (teacher_id, class_id)`, `(school_id)`, `(class_id)`.

**Constraints** — a teacher appears at most once per class. The enrolment form sends the whole set it
ended with, so an edit replaces the rows rather than merging them.

```mermaid
erDiagram
  teachers ||--o{ teacher_classes : "assigned to"
  classes ||--o{ teacher_classes : "has"
  teacher_classes {
    uuid id PK
    uuid teacher_id FK
    uuid class_id FK
  }
```

### `classes`

<!-- table: classes · module: ClassesModule · prd: §4.4 · phase: 2 · tenant: yes · soft-delete: no -->

A grade + section for one academic year (e.g. grade 5, section A, 2026). The class teacher is
assignable after creation; students attach via `students.class_id`.

| Column             | Type          | Null | Key | Notes           |
| ------------------ | ------------- | ---- | --- | --------------- |
| `id`               | `uuid`        | no   | PK  |                 |
| `school_id`        | `uuid`        | no   | FK  | → `schools.id`  |
| `class_teacher_id` | `uuid`        | yes  | FK  | → `teachers.id` |
| `academic_year`    | `text`        | no   |     | e.g. `2026`     |
| `grade`            | `integer`     | no   |     | e.g. `5`        |
| `section`          | `text`        | no   |     | e.g. `A`        |
| `created_at`       | `timestamptz` | no   |     |                 |
| `updated_at`       | `timestamptz` | no   |     |                 |

**Keys** — PK `id` · FK `school_id` → `schools.id` (restrict), `class_teacher_id` → `teachers.id`
(set null) · `unique (school_id, grade, section, academic_year)`.

**Indexes** — `unique (school_id, grade, section, academic_year)`, `(school_id)`, `(class_teacher_id)`.

**Constraints** — `class_teacher_id` is nullable so a class can exist before a teacher is assigned.

```mermaid
erDiagram
  classes ||--o{ students : "rosters"
  classes ||--o{ subjects : "offers"
  teachers ||--o{ classes : "leads"
  classes {
    uuid id PK
    uuid school_id FK
    uuid class_teacher_id FK
    text academic_year
  }
```

### `subjects`

<!-- table: subjects · module: ClassesModule · prd: §4.4 · phase: 2 · tenant: yes · soft-delete: no -->

A subject taught to one class by one teacher. Timetable periods, homework, exams, and results all hang
off `subjects`.

| Column       | Type          | Null | Key | Notes           |
| ------------ | ------------- | ---- | --- | --------------- |
| `id`         | `uuid`        | no   | PK  |                 |
| `school_id`  | `uuid`        | no   | FK  | → `schools.id`  |
| `class_id`   | `uuid`        | no   | FK  | → `classes.id`  |
| `teacher_id` | `uuid`        | yes  | FK  | → `teachers.id` |
| `name`       | `text`        | no   |     |                 |
| `code`       | `text`        | no   |     | e.g. `MATH-5A`  |
| `created_at` | `timestamptz` | no   |     |                 |
| `updated_at` | `timestamptz` | no   |     |                 |

**Keys** — PK `id` · FK `school_id` → `schools.id` (restrict), `class_id` → `classes.id` (restrict —
subjects carry exams and results), `teacher_id` → `teachers.id` (set null) ·
`unique (school_id, class_id, code)`.

**Indexes** — `unique (school_id, class_id, code)`, `(school_id)`, `(class_id)`, `(teacher_id)`.

**Constraints** — `teacher_id` is nullable until a teacher is assigned.

```mermaid
erDiagram
  classes ||--o{ subjects : "offers"
  teachers ||--o{ subjects : "teaches"
  subjects ||--o{ periods : "scheduled"
  subjects ||--o{ homework : "covers"
  subjects ||--o{ results : "is scored in"
  subjects {
    uuid id PK
    uuid school_id FK
    uuid class_id FK
    uuid teacher_id FK
    text code
  }
```

## 5. Feature ERD — Attendance

`PRD.md` §4.5. Phase 3.

```mermaid
erDiagram
  schools ||--o{ attendance : "scopes"
  classes ||--o{ attendance : "registers"
  students ||--o{ attendance : "is marked in"
  users ||--o{ attendance : "marks"
```

### `attendance`

<!-- table: attendance · module: AttendanceModule · prd: §4.5 · phase: 3 · tenant: yes · soft-delete: no -->

One row per student per class per day. Bulk marking upserts on the unique key, so re-marking the same
register is idempotent. Monthly %/defaulters are aggregations, not stored columns.

| Column            | Type                | Null | Key | Notes             |
| ----------------- | ------------------- | ---- | --- | ----------------- |
| `id`              | `uuid`              | no   | PK  |                   |
| `school_id`       | `uuid`              | no   | FK  | → `schools.id`    |
| `class_id`        | `uuid`              | no   | FK  | → `classes.id`    |
| `student_id`      | `uuid`              | no   | FK  | → `students.id`   |
| `marked_by_id`    | `uuid`              | no   | FK  | → `users.id`      |
| `attendance_date` | `date`              | no   |     |                   |
| `status`          | `attendance_status` | no   |     | `PRESENT`…`LATE`  |
| `note`            | `text`              | yes  |     | leave/late reason |
| `created_at`      | `timestamptz`       | no   |     |                   |
| `updated_at`      | `timestamptz`       | no   |     |                   |

**Keys** — PK `id` · FK `school_id` → `schools.id` (restrict), `class_id` → `classes.id` (restrict),
`student_id` → `students.id` (restrict), `marked_by_id` → `users.id` (restrict) ·
`unique (class_id, student_id, attendance_date)`.

**Indexes** — `unique (class_id, student_id, attendance_date)`, `(school_id, attendance_date)`,
`(class_id, attendance_date)`, `(student_id, attendance_date)`.

**Constraints** — the unique key is the duplicate guard from `PRD.md` §4.5; bulk marking is an upsert on
it. `class_id` is stored **in addition to** `students.class_id` on purpose: history must stay correct
after a student changes class mid-year. Writes emit `attendance:marked` over Socket.io to linked
parents.

```mermaid
erDiagram
  classes ||--o{ attendance : "registers"
  students ||--o{ attendance : "is marked in"
  users ||--o{ attendance : "marks"
  attendance {
    uuid id PK
    uuid school_id FK
    uuid class_id FK
    uuid student_id FK
    uuid marked_by_id FK
    date attendance_date
  }
```

## 6. Feature ERD — Homework & Study Materials

`PRD.md` §4.7 and §4.13. Phase 3.

```mermaid
erDiagram
  classes ||--o{ homework : "is assigned"
  subjects ||--o{ homework : "covers"
  teachers ||--o{ homework : "creates"
  homework ||--o{ homework_submissions : "receives"
  students ||--o{ homework_submissions : "submits"
  users ||--o{ homework_submissions : "grades"
  classes ||--o{ study_materials : "is for"
  subjects ||--o{ study_materials : "is for"
  users ||--o{ study_materials : "uploads"
```

### `homework`

<!-- table: homework · module: HomeworkModule · prd: §4.7 · phase: 3 · tenant: yes · soft-delete: yes -->

An assignment posted by a teacher to one class + subject. `attachments` holds Cloudinary URLs;
`due_date` is the late-submission boundary, and `max_marks` is the optional ceiling a graded
submission is scored against.

| Column        | Type          | Null | Key | Notes           |
| ------------- | ------------- | ---- | --- | --------------- |
| `id`          | `uuid`        | no   | PK  |                 |
| `school_id`   | `uuid`        | no   | FK  | → `schools.id`  |
| `class_id`    | `uuid`        | no   | FK  | → `classes.id`  |
| `subject_id`  | `uuid`        | no   | FK  | → `subjects.id` |
| `teacher_id`  | `uuid`        | no   | FK  | → `teachers.id` |
| `title`       | `text`        | no   |     |                 |
| `description` | `text`        | yes  |     |                 |
| `due_date`    | `date`        | no   |     |                 |
| `max_marks`   | `integer`     | yes  |     | Optional marks  |
| `attachments` | `text[]`      | no   |     | default `'{}'`  |
| `created_at`  | `timestamptz` | no   |     |                 |
| `updated_at`  | `timestamptz` | no   |     |                 |
| `deleted_at`  | `timestamptz` | yes  |     | soft delete     |

**Keys** — PK `id` · FK `school_id` → `schools.id` (restrict), `class_id` → `classes.id` (restrict),
`subject_id` → `subjects.id` (restrict), `teacher_id` → `teachers.id` (restrict).

**Indexes** — `(school_id, class_id, due_date)`, `(class_id, subject_id, due_date)`, `(teacher_id)`.

**Constraints** — no natural key; deletion is soft so submissions keep their parent.
`check (max_marks is null or max_marks > 0)`.

```mermaid
erDiagram
  classes ||--o{ homework : "is assigned"
  subjects ||--o{ homework : "covers"
  teachers ||--o{ homework : "creates"
  homework ||--o{ homework_submissions : "receives"
  homework {
    uuid id PK
    uuid school_id FK
    uuid class_id FK
    uuid subject_id FK
    uuid teacher_id FK
    date due_date
    integer max_marks
  }
```

### `homework_submissions`

<!-- table: homework_submissions · module: HomeworkModule · prd: §4.7 · phase: 3 · tenant: yes · soft-delete: no -->

A student's answer to one assignment. `is_late` is computed on insert against `homework.due_date`.
Teacher tracking (submitted vs pending) is a count aggregate over this table.

| Column         | Type          | Null | Key | Notes           |
| -------------- | ------------- | ---- | --- | --------------- |
| `id`           | `uuid`        | no   | PK  |                 |
| `school_id`    | `uuid`        | no   | FK  | → `schools.id`  |
| `homework_id`  | `uuid`        | no   | FK  | → `homework.id` |
| `student_id`   | `uuid`        | no   | FK  | → `students.id` |
| `files`        | `text[]`      | no   |     | default `'{}'`  |
| `submitted_at` | `timestamptz` | no   |     |                 |
| `is_late`      | `boolean`     | no   |     | default `false` |
| `grade`        | `text`        | yes  |     |                 |
| `remarks`      | `text`        | yes  |     |                 |
| `graded_by_id` | `uuid`        | yes  | FK  | → `users.id`    |
| `graded_at`    | `timestamptz` | yes  |     |                 |
| `created_at`   | `timestamptz` | no   |     |                 |
| `updated_at`   | `timestamptz` | no   |     |                 |

**Keys** — PK `id` · FK `school_id` → `schools.id` (restrict), `homework_id` → `homework.id` (cascade),
`student_id` → `students.id` (restrict), `graded_by_id` → `users.id` (set null) ·
`unique (homework_id, student_id)`.

**Indexes** — `unique (homework_id, student_id)`, `(school_id)`, `(student_id)`.

**Constraints** — one submission per student per assignment; `grade` / `remarks` / `graded_*` are null
until graded.

```mermaid
erDiagram
  homework ||--o{ homework_submissions : "receives"
  students ||--o{ homework_submissions : "submits"
  users ||--o{ homework_submissions : "grades"
  homework_submissions {
    uuid id PK
    uuid homework_id FK
    uuid student_id FK
    uuid graded_by_id FK
    boolean is_late
  }
```

### `study_materials`

<!-- table: study_materials · module: MaterialsModule · prd: §4.13 · phase: 3 · tenant: yes · soft-delete: yes -->

Uploaded learning resources (PDFs, notes, worksheets, previous-year papers). Files are validated to
PDF/JPG/PNG/DOCX ≤ 10MB and stored in Cloudinary; this table keeps the `file_url` and metadata.

| Column            | Type            | Null | Key | Notes           |
| ----------------- | --------------- | ---- | --- | --------------- |
| `id`              | `uuid`          | no   | PK  |                 |
| `school_id`       | `uuid`          | no   | FK  | → `schools.id`  |
| `class_id`        | `uuid`          | no   | FK  | → `classes.id`  |
| `subject_id`      | `uuid`          | no   | FK  | → `subjects.id` |
| `uploaded_by_id`  | `uuid`          | no   | FK  | → `users.id`    |
| `title`           | `text`          | no   |     |                 |
| `description`     | `text`          | yes  |     |                 |
| `type`            | `material_type` | no   |     | `PDF`…`PAPER`   |
| `file_url`        | `text`          | no   |     | Cloudinary      |
| `file_size_bytes` | `integer`       | yes  |     | ≤ 10MB          |
| `created_at`      | `timestamptz`   | no   |     |                 |
| `updated_at`      | `timestamptz`   | no   |     |                 |
| `deleted_at`      | `timestamptz`   | yes  |     | soft delete     |

**Keys** — PK `id` · FK `school_id` → `schools.id` (restrict), `class_id` → `classes.id` (restrict),
`subject_id` → `subjects.id` (restrict), `uploaded_by_id` → `users.id` (restrict).

**Indexes** — `(school_id, class_id, subject_id, type)`, `(uploaded_by_id)`.

**Constraints** — `DELETE /materials/:id` removes the stored asset as well as the row.

```mermaid
erDiagram
  classes ||--o{ study_materials : "is for"
  subjects ||--o{ study_materials : "is for"
  users ||--o{ study_materials : "uploads"
  study_materials {
    uuid id PK
    uuid class_id FK
    uuid subject_id FK
    material_type type
    text file_url
  }
```

## 7. Feature ERD — Timetable

`PRD.md` §4.8. **No phase assigned in `Phases.md`** — see §18.

```mermaid
erDiagram
  classes ||--o{ timetables : "has"
  timetables ||--o{ periods : "contains"
  subjects ||--o{ periods : "schedules"
  teachers ||--o{ periods : "teaches"
```

### `timetables`

<!-- table: timetables · module: TimetablesModule · prd: §4.8 · phase: none · tenant: yes · soft-delete: no -->

One weekly timetable per class per academic year. A day's periods are created nested; the parent row is
the conflict-detection boundary. The rows themselves are the same across the week's days and are handled
class-wide — see the `periods` notes below.

| Column          | Type          | Null | Key | Notes          |
| --------------- | ------------- | ---- | --- | -------------- |
| `id`            | `uuid`        | no   | PK  |                |
| `school_id`     | `uuid`        | no   | FK  | → `schools.id` |
| `class_id`      | `uuid`        | no   | FK  | → `classes.id` |
| `academic_year` | `text`        | no   |     |                |
| `day`           | `weekday`     | no   |     | `MON`…`SUN`    |
| `created_at`    | `timestamptz` | no   |     |                |
| `updated_at`    | `timestamptz` | no   |     |                |

**Keys** — PK `id` · FK `school_id` → `schools.id` (restrict), `class_id` → `classes.id` (cascade —
periods belong to the class's timetable) · `unique (class_id, day, academic_year)`.

**Indexes** — `unique (class_id, day, academic_year)`, `(school_id)`.

**Constraints** — teacher double-booking is validated in the service before save (it spans rows, so it
is not expressible as a constraint).

```mermaid
erDiagram
  classes ||--o{ timetables : "has"
  timetables ||--o{ periods : "contains"
  timetables {
    uuid id PK
    uuid school_id FK
    uuid class_id FK
    weekday day
  }
```

### `periods`

<!-- table: periods · module: TimetablesModule · prd: §4.8 · phase: none · tenant: yes · soft-delete: no -->

A single slot inside a day. Break rows carry `is_break = true` with no subject or teacher. The rows
are managed **class-wide**: adding or removing one writes it to every day's timetable in a single
transaction and it is addressed by its `order_index`, so the week keeps one period structure.

| Column         | Type      | Null | Key | Notes                    |
| -------------- | --------- | ---- | --- | ------------------------ |
| `id`           | `uuid`    | no   | PK  |                          |
| `school_id`    | `uuid`    | no   | FK  | → `schools.id`           |
| `timetable_id` | `uuid`    | no   | FK  | → `timetables.id`        |
| `subject_id`   | `uuid`    | yes  | FK  | → `subjects.id`          |
| `teacher_id`   | `uuid`    | yes  | FK  | → `teachers.id`          |
| `start_time`   | `time`    | no   |     |                          |
| `end_time`     | `time`    | no   |     |                          |
| `is_break`     | `boolean` | no   |     | default `false`          |
| `order_index`  | `integer` | no   |     | display order within day |
| `room`         | `text`    | yes  |     |                          |
| `label`        | `text`    | yes  |     | label; else `Period n`   |

**Keys** — PK `id` · FK `school_id` → `schools.id` (restrict), `timetable_id` → `timetables.id`
(cascade), `subject_id` → `subjects.id` (set null), `teacher_id` → `teachers.id` (set null).

**Indexes** — `(timetable_id, order_index)`, `(school_id)`, `(teacher_id)` (the teacher's weekly view).

**Constraints** — `subject_id` / `teacher_id` are required unless `is_break`; `check (end_time >
start_time)`. A null `label` on a teaching row is exposed as `Period n`, counted over teaching rows
only — so the first period after a break keeps its number rather than skipping it. Break rows always
carry a `label` ("Short Break", "Lunch Break"), since there is no number to derive.

```mermaid
erDiagram
  timetables ||--o{ periods : "contains"
  subjects ||--o{ periods : "schedules"
  teachers ||--o{ periods : "teaches"
  periods {
    uuid id PK
    uuid timetable_id FK
    uuid subject_id FK
    uuid teacher_id FK
    time start_time
    text label
  }
```

## 8. Feature ERD — Fees

`PRD.md` §4.6. Phase 4.

```mermaid
erDiagram
  schools ||--o{ fee_structures : "defines"
  classes ||--o{ fee_structures : "applies to"
  fee_structures ||--o{ fee_heads : "composed of"
  students ||--o{ fee_invoices : "is billed"
  fee_structures ||--o{ fee_invoices : "generates"
  fee_heads ||--o{ fee_invoices : "billed as"
  fee_invoices ||--o{ fee_payments : "is settled by"
  students ||--o{ fee_payments : "pays"
  users ||--o{ fee_payments : "records"
  students ||--o{ concessions : "is granted"
  fee_heads ||--o{ concessions : "discounts"
  users ||--o{ concessions : "approves"
  schools ||--o{ receipt_sequences : "numbers"
```

### `fee_structures`

<!-- table: fee_structures · module: FeesModule · prd: §4.6 · phase: 4 · tenant: yes · soft-delete: no -->

A named fee plan for one class in one academic year (e.g. "Grade 5 — 2026"). Its heads define what is
charged; invoices are generated from it per student.

| Column          | Type          | Null | Key | Notes          |
| --------------- | ------------- | ---- | --- | -------------- |
| `id`            | `uuid`        | no   | PK  |                |
| `school_id`     | `uuid`        | no   | FK  | → `schools.id` |
| `class_id`      | `uuid`        | no   | FK  | → `classes.id` |
| `academic_year` | `text`        | no   |     |                |
| `name`          | `text`        | no   |     |                |
| `created_at`    | `timestamptz` | no   |     |                |
| `updated_at`    | `timestamptz` | no   |     |                |

**Keys** — PK `id` · FK `school_id` → `schools.id` (restrict), `class_id` → `classes.id` (restrict) ·
`unique (school_id, class_id, academic_year, name)`.

**Indexes** — `unique (school_id, class_id, academic_year, name)`, `(class_id)`.

**Constraints** — a structure may not be deleted while invoices reference it (restrict).

```mermaid
erDiagram
  classes ||--o{ fee_structures : "applies to"
  fee_structures ||--o{ fee_heads : "composed of"
  fee_structures ||--o{ fee_invoices : "generates"
  fee_structures {
    uuid id PK
    uuid school_id FK
    uuid class_id FK
    text academic_year
  }
```

### `fee_heads`

<!-- table: fee_heads · module: FeesModule · prd: §4.6 · phase: 4 · tenant: yes · soft-delete: no -->

A line item inside a structure — tuition, transport, lab, etc. A **child table** rather than the JSONB
array `PRD.md` §3 allowed, so collection reports can group by head. The head also owns the **due date**
the class is charged against — the date the Fee structure screen edits and the "Add fee head" form
collects — while the invoice it raises may carry a later, per-student date.

| Column             | Type            | Null | Key | Notes                 |
| ------------------ | --------------- | ---- | --- | --------------------- |
| `id`               | `uuid`          | no   | PK  |                       |
| `school_id`        | `uuid`          | no   | FK  | → `schools.id`        |
| `fee_structure_id` | `uuid`          | no   | FK  | → `fee_structures.id` |
| `name`             | `text`          | no   |     |                       |
| `amount_paise`     | `integer`       | no   |     | paise                 |
| `frequency`        | `fee_frequency` | no   |     | `MONTHLY`…`ONE_TIME`  |
| `due_date`         | `date`          | no   |     | ISO `YYYY-MM-DD`      |
| `description`      | `text`          | yes  |     |                       |
| `created_at`       | `timestamptz`   | no   |     |                       |

**Keys** — PK `id` · FK `school_id` → `schools.id` (restrict), `fee_structure_id` → `fee_structures.id`
(cascade) · `unique (fee_structure_id, name)`.

**Indexes** — `unique (fee_structure_id, name)`, `(school_id)`, `(fee_structure_id)`.

**Constraints** — `check (amount_paise >= 0)`; a head is deleted with its structure. Raising an invoice
copies the head's `due_date` onto `fee_invoices.due_date`, which the collect flow may override per student.

```mermaid
erDiagram
  fee_structures ||--o{ fee_heads : "composed of"
  fee_heads ||--o{ fee_invoices : "billed as"
  fee_heads ||--o{ concessions : "discounts"
  fee_heads {
    uuid id PK
    uuid fee_structure_id FK
    text name
    integer amount_paise
    fee_frequency frequency
    date due_date
  }
```

### `fee_invoices`

<!-- table: fee_invoices · module: FeesModule · prd: §4.6 · phase: 4 · tenant: yes · soft-delete: no -->

A billable demand for one student, generated in bulk per class. `paid_paise` accumulates across payments
so `PARTIAL` can be topped up; `receipt_no` is assigned on the first successful payment from
`receipt_sequences` inside the payment transaction. `fee_head_id` records which head the demand was
raised from — it is what titles the row on the collect screen and the ledger — and is null for a
lump-sum demand.

| Column             | Type             | Null | Key | Notes                    |
| ------------------ | ---------------- | ---- | --- | ------------------------ |
| `id`               | `uuid`           | no   | PK  |                          |
| `school_id`        | `uuid`           | no   | FK  | → `schools.id`           |
| `student_id`       | `uuid`           | no   | FK  | → `students.id`          |
| `fee_structure_id` | `uuid`           | no   | FK  | → `fee_structures.id`    |
| `fee_head_id`      | `uuid`           | yes  | FK  | → `fee_heads.id`         |
| `amount_paise`     | `integer`        | no   |     | gross, before concession |
| `discount_paise`   | `integer`        | no   |     | default `0`              |
| `paid_paise`       | `integer`        | no   |     | default `0`              |
| `due_date`         | `date`           | no   |     |                          |
| `status`           | `invoice_status` | no   |     | default `PENDING`        |
| `receipt_no`       | `text`           | yes  |     | null until first payment |
| `issued_at`        | `timestamptz`    | yes  |     |                          |
| `notes`            | `text`           | yes  |     |                          |
| `created_at`       | `timestamptz`    | no   |     |                          |
| `updated_at`       | `timestamptz`    | no   |     |                          |

**Keys** — PK `id` · FK `school_id` → `schools.id` (restrict), `student_id` → `students.id` (restrict),
`fee_structure_id` → `fee_structures.id` (restrict), `fee_head_id` → `fee_heads.id` (set null) ·
`unique (school_id, receipt_no)` (partial, where `receipt_no is not null`).

**Indexes** — `unique (school_id, receipt_no)` partial, `(student_id, status)` (the pending/history
path), `(school_id, status, due_date)`, `(fee_structure_id)`, `(fee_head_id)`.

**Constraints** — `check (paid_paise <= amount_paise - discount_paise)`. Invoices are never deleted —
they are financial records. `fee_head_id` and `fee_structure_id` are kept together on purpose: the head
titles the row, the structure groups it for reporting, and a head removed later must not orphan the
invoice — hence `set null`.

```mermaid
erDiagram
  students ||--o{ fee_invoices : "is billed"
  fee_structures ||--o{ fee_invoices : "generates"
  fee_invoices ||--o{ fee_payments : "is settled by"
  receipt_sequences ||..o{ fee_invoices : "numbers"
  fee_invoices {
    uuid id PK
    uuid student_id FK
    uuid fee_structure_id FK
    uuid fee_head_id FK
    invoice_status status
    text receipt_no
  }
```

### `fee_payments`

<!-- table: fee_payments · module: FeesModule · prd: §4.6 · phase: 4 · tenant: yes · soft-delete: no -->

A settlement against an invoice — online via Stripe/SSLCommerz, or offline recorded by an admin
(`MANUAL`, with `recorded_by_id`). Webhook confirmation updates the invoice in one transaction.

| Column              | Type               | Null | Key | Notes                     |
| ------------------- | ------------------ | ---- | --- | ------------------------- |
| `id`                | `uuid`             | no   | PK  |                           |
| `school_id`         | `uuid`             | no   | FK  | → `schools.id`            |
| `invoice_id`        | `uuid`             | no   | FK  | → `fee_invoices.id`       |
| `student_id`        | `uuid`             | no   | FK  | → `students.id`           |
| `recorded_by_id`    | `uuid`             | yes  | FK  | → `users.id`, manual only |
| `amount_paise`      | `integer`          | no   |     |                           |
| `provider`          | `payment_provider` | no   |     | `STRIPE`…`MANUAL`         |
| `method`            | `payment_method`   | no   |     | `CARD`…`ONLINE`           |
| `provider_order_id` | `text`             | yes  |     | checkout session/order    |
| `provider_txn_id`   | `text`             | yes  |     | webhook transaction id    |
| `status`            | `payment_status`   | no   |     | default `PENDING`         |
| `paid_at`           | `timestamptz`      | yes  |     |                           |
| `remarks`           | `text`             | yes  |     | cheque/DD reference       |
| `created_at`        | `timestamptz`      | no   |     |                           |
| `updated_at`        | `timestamptz`      | no   |     |                           |

**Keys** — PK `id` · FK `school_id` → `schools.id` (restrict), `invoice_id` → `fee_invoices.id`
(restrict), `student_id` → `students.id` (restrict), `recorded_by_id` → `users.id` (set null) ·
`unique (provider, provider_txn_id)` (partial, where `provider_txn_id is not null`).

**Indexes** — `unique (provider, provider_txn_id)` partial, `(invoice_id)`, `(provider_order_id)`,
`(school_id, paid_at)`.

**Constraints** — the partial unique key is the **webhook idempotency guard**; a replayed event must not
double-credit the invoice. `check (amount_paise > 0)`. `remarks` carries the counter receipt's free-text
reference (cheque number, DD number, transfer id) and stays null for gateway payments.

```mermaid
erDiagram
  fee_invoices ||--o{ fee_payments : "is settled by"
  students ||--o{ fee_payments : "pays"
  users ||--o{ fee_payments : "records"
  fee_payments {
    uuid id PK
    uuid invoice_id FK
    uuid student_id FK
    payment_provider provider
    payment_status status
  }
```

### `concessions`

<!-- table: concessions · module: FeesModule · prd: §4.6 · phase: 4 · tenant: yes · soft-delete: no -->

A discount/scholarship for a student, scoped to one fee head, with an admin approval flow. Applied as
`fee_invoices.discount_paise` at generation time. `category` records **why** the concession was granted
(sibling, merit, SC/ST, staff ward, custom) — a reporting dimension distinct from `type`, which is how
the discount is expressed — and `fee_head_id` records **what** it discounts, null meaning every head in
the student's structure.

| Column           | Type                  | Null | Key | Notes                  |
| ---------------- | --------------------- | ---- | --- | ---------------------- |
| `id`             | `uuid`                | no   | PK  |                        |
| `school_id`      | `uuid`                | no   | FK  | → `schools.id`         |
| `student_id`     | `uuid`                | no   | FK  | → `students.id`        |
| `fee_head_id`    | `uuid`                | yes  | FK  | → `fee_heads.id`       |
| `category`       | `concession_category` | no   |     | `SIBLING`…`STAFF_WARD` |
| `type`           | `concession_type`     | no   |     | `PERCENTAGE`/`FIXED`   |
| `percentage`     | `numeric`             | yes  |     | 0–100, 2dp             |
| `amount_paise`   | `integer`             | yes  |     | when `FIXED`           |
| `reason`         | `text`                | yes  |     |                        |
| `status`         | `concession_status`   | no   |     | default `PENDING`      |
| `approved_by_id` | `uuid`                | yes  | FK  | → `users.id`           |
| `approved_at`    | `timestamptz`         | yes  |     |                        |
| `created_at`     | `timestamptz`         | no   |     |                        |
| `updated_at`     | `timestamptz`         | no   |     |                        |

**Keys** — PK `id` · FK `school_id` → `schools.id` (restrict), `student_id` → `students.id` (restrict),
`fee_head_id` → `fee_heads.id` (set null), `approved_by_id` → `users.id` (set null).

**Indexes** — `(student_id, status)` (the approval queue), `(school_id, status)`, `(fee_head_id)`.

**Constraints** — a `check` enforces exactly one of `percentage` / `amount_paise`, matching `type`.
`category` is required — it is why the concession was granted, and the dimension the Concessions screen
reports on. `approved_by_id` / `approved_at` are null while `status = PENDING`. No unique key — a student
may hold several concessions.

```mermaid
erDiagram
  students ||--o{ concessions : "is granted"
  fee_heads ||--o{ concessions : "discounts"
  users ||--o{ concessions : "approves"
  concessions {
    uuid id PK
    uuid student_id FK
    uuid fee_head_id FK
    concession_category category
    concession_type type
    concession_status status
  }
```

### `receipt_sequences`

<!-- table: receipt_sequences · module: FeesModule · prd: §4.6 · phase: 4 · tenant: yes · soft-delete: no -->

Per-school receipt counter, locked with `select … for update` inside the payment transaction so receipt
numbers never collide — the "receipt number sequence (transactional)" requirement.

| Column        | Type          | Null | Key | Notes          |
| ------------- | ------------- | ---- | --- | -------------- |
| `id`          | `uuid`        | no   | PK  |                |
| `school_id`   | `uuid`        | no   | FK  | → `schools.id` |
| `fiscal_year` | `text`        | no   |     | reset boundary |
| `last_number` | `integer`     | no   |     | default `0`    |
| `updated_at`  | `timestamptz` | no   |     |                |

**Keys** — PK `id` · FK `school_id` → `schools.id` (restrict) · `unique (school_id, fiscal_year)`.

**Indexes** — `unique (school_id, fiscal_year)` — this also serves as the tenant index for the table.

**Constraints** — **no FK to `fee_invoices`**: the relationship is logical (invoices are numbered _from_
this counter), which is why the ERD draws it dotted. Not in `PRD.md` §3 — added to make the receipt
sequence atomic (§18).

```mermaid
erDiagram
  schools ||--o{ receipt_sequences : "numbers"
  receipt_sequences ||..o{ fee_invoices : "numbers"
  receipt_sequences {
    uuid id PK
    uuid school_id FK
    text fiscal_year
    integer last_number
  }
```

## 9. Feature ERD — Exams & Report Cards

`PRD.md` §4.9. Phase 4.

**Tests and exams share one table**: a `TEST` is one subject sat on one date (the Tests tab), an `EXAM` is a
multi-subject window (the Exams tab), and only an `EXAM` produces report cards.

```mermaid
erDiagram
  classes ||--o{ exams : "sits"
  exams ||--o{ exam_subjects : "schedules"
  subjects ||--o{ exam_subjects : "is examined"
  exams ||--o{ results : "records"
  students ||--o{ results : "achieves"
  subjects ||--o{ results : "is scored in"
  users ||--o{ results : "enters"
  exams ||--o{ report_cards : "issues"
  students ||--o{ report_cards : "receives"
```

### `exams`

<!-- table: exams · module: ExamsModule · prd: §4.9 · phase: 4 · tenant: yes · soft-delete: no -->

A test or exam window for one class, told apart by `kind`. `is_published` is the lock: once true, results are
read-only and report cards exist. Publishing is one transaction (results → report cards → notifications).

| Column         | Type          | Null | Key | Notes                         |
| -------------- | ------------- | ---- | --- | ----------------------------- |
| `id`           | `uuid`        | no   | PK  |                               |
| `school_id`    | `uuid`        | no   | FK  | → `schools.id`                |
| `class_id`     | `uuid`        | no   | FK  | → `classes.id`                |
| `name`         | `text`        | no   |     |                               |
| `kind`         | `exam_kind`   | no   |     | `TEST`/`EXAM`                 |
| `type`         | `exam_type`   | no   |     | `UNIT`/`MID`/`FINAL`/`ANNUAL` |
| `start_date`   | `date`        | no   |     |                               |
| `end_date`     | `date`        | no   |     |                               |
| `description`  | `text`        | yes  |     |                               |
| `is_published` | `boolean`     | no   |     | default `false`               |
| `published_at` | `timestamptz` | yes  |     |                               |
| `created_at`   | `timestamptz` | no   |     |                               |
| `updated_at`   | `timestamptz` | no   |     |                               |

**Keys** — PK `id` · FK `school_id` → `schools.id` (restrict), `class_id` → `classes.id` (restrict).

**Indexes** — `(school_id, class_id, type, start_date)`, `(class_id, start_date)`.

**Constraints** — `check (end_date >= start_date)`; no unique key, since a class may run two exams with
the same name in one year.

```mermaid
erDiagram
  classes ||--o{ exams : "sits"
  exams ||--o{ exam_subjects : "schedules"
  exams ||--o{ results : "records"
  exams ||--o{ report_cards : "issues"
  exams {
    uuid id PK
    uuid school_id FK
    uuid class_id FK
    exam_kind kind
    exam_type type
    boolean is_published
  }
```

### `exam_subjects`

<!-- table: exam_subjects · module: ExamsModule · prd: §4.9 · phase: 4 · tenant: yes · soft-delete: no -->

Which subjects are examined, when, and for how many marks. `max_marks` bounds `results.obtained_marks`
and feeds percentage computation.

| Column         | Type      | Null | Key | Notes                 |
| -------------- | --------- | ---- | --- | --------------------- |
| `id`           | `uuid`    | no   | PK  |                       |
| `school_id`    | `uuid`    | no   | FK  | → `schools.id`        |
| `exam_id`      | `uuid`    | no   | FK  | → `exams.id`          |
| `subject_id`   | `uuid`    | no   | FK  | → `subjects.id`       |
| `exam_date`    | `date`    | no   |     |                       |
| `max_marks`    | `integer` | no   |     |                       |
| `pass_marks`   | `integer` | yes  |     | default from scheme   |
| `duration_min` | `integer` | no   |     | minutes, default `60` |

**Keys** — PK `id` · FK `school_id` → `schools.id` (restrict), `exam_id` → `exams.id` (cascade),
`subject_id` → `subjects.id` (restrict) · `unique (exam_id, subject_id)`.

**Indexes** — `unique (exam_id, subject_id)`, `(school_id)`, `(subject_id)`.

**Constraints** — `check (pass_marks <= max_marks)`, `check (max_marks > 0)` and `check (duration_min > 0)`.

```mermaid
erDiagram
  exams ||--o{ exam_subjects : "schedules"
  subjects ||--o{ exam_subjects : "is examined"
  exam_subjects {
    uuid id PK
    uuid exam_id FK
    uuid subject_id FK
    integer max_marks
  }
```

### `results`

<!-- table: results · module: ExamsModule · prd: §4.9 · phase: 4 · tenant: yes · soft-delete: no -->

One student's mark in one subject of one exam. Bulk marks entry upserts on the unique key.

| Column           | Type          | Null | Key | Notes                       |
| ---------------- | ------------- | ---- | --- | --------------------------- |
| `id`             | `uuid`        | no   | PK  |                             |
| `school_id`      | `uuid`        | no   | FK  | → `schools.id`              |
| `exam_id`        | `uuid`        | no   | FK  | → `exams.id`                |
| `student_id`     | `uuid`        | no   | FK  | → `students.id`             |
| `subject_id`     | `uuid`        | no   | FK  | → `subjects.id`             |
| `obtained_marks` | `numeric`     | no   |     | ≤ `exam_subjects.max_marks` |
| `is_absent`      | `boolean`     | no   |     | default `false`             |
| `remarks`        | `text`        | yes  |     | teacher's note              |
| `entered_by_id`  | `uuid`        | yes  | FK  | → `users.id`                |
| `created_at`     | `timestamptz` | no   |     |                             |
| `updated_at`     | `timestamptz` | no   |     |                             |

**Keys** — PK `id` · FK `school_id` → `schools.id` (restrict), `exam_id` → `exams.id` (restrict),
`student_id` → `students.id` (restrict), `subject_id` → `subjects.id` (restrict), `entered_by_id` →
`users.id` (set null) · `unique (exam_id, student_id, subject_id)`.

**Indexes** — `unique (exam_id, student_id, subject_id)` (the upsert key), `(school_id)`,
`(student_id, exam_id)`.

**Constraints** — `check (obtained_marks >= 0)`; the upper bound against `max_marks` is validated in the
service because it spans tables. Marks are never deleted once published.

```mermaid
erDiagram
  exams ||--o{ results : "records"
  students ||--o{ results : "achieves"
  subjects ||--o{ results : "is scored in"
  users ||--o{ results : "enters"
  results {
    uuid id PK
    uuid exam_id FK
    uuid student_id FK
    uuid subject_id FK
    numeric obtained_marks
  }
```

### `report_cards`

<!-- table: report_cards · module: ExamsModule · prd: §4.9 · phase: 4 · tenant: yes · soft-delete: no -->

The computed summary per student per exam — totals, percentage, grade, and class rank — plus
`ai_comment` from `POST /ai/report-comment`. Written at publish time, not on every mark edit.

| Column           | Type          | Null | Key | Notes                   |
| ---------------- | ------------- | ---- | --- | ----------------------- |
| `id`             | `uuid`        | no   | PK  |                         |
| `school_id`      | `uuid`        | no   | FK  | → `schools.id`          |
| `exam_id`        | `uuid`        | no   | FK  | → `exams.id`            |
| `student_id`     | `uuid`        | no   | FK  | → `students.id`         |
| `total_marks`    | `numeric`     | no   |     | sum of max marks taken  |
| `obtained_marks` | `numeric`     | no   |     | sum of results          |
| `percentage`     | `numeric`     | no   |     | 0–100, 2dp              |
| `grade`          | `text`        | no   |     | from `schools.settings` |
| `rank`           | `integer`     | yes  |     | within class            |
| `ai_comment`     | `text`        | yes  |     | AI-generated            |
| `published_at`   | `timestamptz` | yes  |     |                         |
| `created_at`     | `timestamptz` | no   |     |                         |
| `updated_at`     | `timestamptz` | no   |     |                         |

**Keys** — PK `id` · FK `school_id` → `schools.id` (restrict), `exam_id` → `exams.id` (cascade),
`student_id` → `students.id` (restrict) · `unique (exam_id, student_id)`.

**Indexes** — `unique (exam_id, student_id)`, `(school_id)`, `(student_id, exam_id)`.

**Constraints** — `check (percentage between 0 and 100)`. Grade bands come from `schools.settings`
(JSONB), so `grade` is `text` — each school configures its own scheme.

```mermaid
erDiagram
  exams ||--o{ report_cards : "issues"
  students ||--o{ report_cards : "receives"
  report_cards {
    uuid id PK
    uuid exam_id FK
    uuid student_id FK
    numeric percentage
    text grade
    integer rank
  }
```

## 10. Feature ERD — Real-Time Chat

`PRD.md` §4.10. Phase 5.

```mermaid
erDiagram
  schools ||--o{ conversations : "scopes"
  conversations ||--o{ conversation_participants : "includes"
  users ||--o{ conversation_participants : "joins"
  conversations ||--o{ messages : "contains"
  users ||--o{ messages : "sends"
```

### `conversations`

<!-- table: conversations · module: ChatModule · prd: §4.10 · phase: 5 · tenant: yes · soft-delete: no -->

A 1:1 thread between two users of permitted role pairs. `last_message_at` is denormalised so the
conversation list sorts without touching `messages`.

| Column            | Type          | Null | Key | Notes           |
| ----------------- | ------------- | ---- | --- | --------------- |
| `id`              | `uuid`        | no   | PK  |                 |
| `school_id`       | `uuid`        | no   | FK  | → `schools.id`  |
| `created_by_id`   | `uuid`        | yes  | FK  | → `users.id`    |
| `last_message_at` | `timestamptz` | yes  |     | updated on send |
| `created_at`      | `timestamptz` | no   |     |                 |
| `updated_at`      | `timestamptz` | no   |     |                 |

**Keys** — PK `id` · FK `school_id` → `schools.id` (restrict), `created_by_id` → `users.id` (set null).

**Indexes** — `(school_id, last_message_at desc)` (the inbox).

**Constraints** — allowed pairs (admin↔teacher, teacher↔student, teacher↔parent) are enforced in the
service; a DB `check` cannot express a cross-table rule (§18). There is also no unique key preventing two
conversations between the same pair.

```mermaid
erDiagram
  conversations ||--o{ conversation_participants : "includes"
  conversations ||--o{ messages : "contains"
  conversations {
    uuid id PK
    uuid school_id FK
    uuid created_by_id FK
    timestamptz last_message_at
  }
```

### `conversation_participants`

<!-- table: conversation_participants · module: ChatModule · prd: §4.10 · phase: 5 · tenant: yes · soft-delete: no -->

Membership + read state for a conversation. `last_read_at` is the authority for the caller's unread badge —
never computed from `conversations` — and both `chat:read` (gateway) and `POST /chat/:conversationId/read`
stamp it.

| Column            | Type          | Null | Key | Notes                |
| ----------------- | ------------- | ---- | --- | -------------------- |
| `id`              | `uuid`        | no   | PK  |                      |
| `school_id`       | `uuid`        | no   | FK  | → `schools.id`       |
| `conversation_id` | `uuid`        | no   | FK  | → `conversations.id` |
| `user_id`         | `uuid`        | no   | FK  | → `users.id`         |
| `last_read_at`    | `timestamptz` | yes  |     | unread marker        |
| `joined_at`       | `timestamptz` | no   |     |                      |

**Keys** — PK `id` · FK `school_id` → `schools.id` (restrict), `conversation_id` → `conversations.id`
(cascade), `user_id` → `users.id` (cascade) · `unique (conversation_id, user_id)`.

**Indexes** — `unique (conversation_id, user_id)`, `(school_id)`, `(user_id)` (the user's thread list).

**Constraints** — typically exactly two rows per conversation.

```mermaid
erDiagram
  conversations ||--o{ conversation_participants : "includes"
  users ||--o{ conversation_participants : "joins"
  conversation_participants {
    uuid id PK
    uuid conversation_id FK
    uuid user_id FK
    timestamptz last_read_at
  }
```

### `messages`

<!-- table: messages · module: ChatModule · prd: §4.10 · phase: 5 · tenant: yes · soft-delete: yes -->

Persisted chat message. `read_at` is the receipt for the single recipient (it flips the sender's double-check);
the caller's unread badge comes from `conversation_participants.last_read_at` instead, so the two are not the
same marker. Ordering is by `created_at` within a conversation.

| Column            | Type          | Null | Key | Notes                |
| ----------------- | ------------- | ---- | --- | -------------------- |
| `id`              | `uuid`        | no   | PK  |                      |
| `school_id`       | `uuid`        | no   | FK  | → `schools.id`       |
| `conversation_id` | `uuid`        | no   | FK  | → `conversations.id` |
| `sender_id`       | `uuid`        | no   | FK  | → `users.id`         |
| `body`            | `text`        | no   |     |                      |
| `read_at`         | `timestamptz` | yes  |     | receipt              |
| `created_at`      | `timestamptz` | no   |     |                      |
| `updated_at`      | `timestamptz` | no   |     |                      |
| `deleted_at`      | `timestamptz` | yes  |     | soft delete          |

**Keys** — PK `id` · FK `school_id` → `schools.id` (restrict), `conversation_id` → `conversations.id`
(cascade), `sender_id` → `users.id` (restrict).

**Indexes** — `(conversation_id, created_at desc)` (the pagination path from `PRD.md` §3), `(school_id)`,
`(sender_id)`.

**Constraints** — `check (char_length(body) > 0)`. Payloads mirror the REST DTO shapes (`Design.md`), so
the same serializer is reused.

```mermaid
erDiagram
  conversations ||--o{ messages : "contains"
  users ||--o{ messages : "sends"
  messages {
    uuid id PK
    uuid conversation_id FK
    uuid sender_id FK
    text body
    timestamptz read_at
  }
```

## 11. Feature ERD — Notices & Events

`PRD.md` §4.11. Phase 5.

```mermaid
erDiagram
  schools ||--o{ notices : "publishes"
  users ||--o{ notices : "authors"
  notices ||--o{ notice_classes : "targets"
  classes ||--o{ notice_classes : "is targeted"
  schools ||--o{ events : "hosts"
  users ||--o{ events : "creates"
```

### `notices`

<!-- table: notices · module: NoticesModule · prd: §4.11 · phase: 5 · tenant: yes · soft-delete: yes -->

An announcement. `audience` selects role groups; class narrowing lives in `notice_classes`. Publishing
broadcasts over Socket.io and queues email via BullMQ.

| Column            | Type                | Null | Key | Notes             |
| ----------------- | ------------------- | ---- | --- | ----------------- |
| `id`              | `uuid`              | no   | PK  |                   |
| `school_id`       | `uuid`              | no   | FK  | → `schools.id`    |
| `published_by_id` | `uuid`              | no   | FK  | → `users.id`      |
| `author_name`     | `text`              | no   |     | byline            |
| `title`           | `text`              | no   |     |                   |
| `body`            | `text`              | no   |     |                   |
| `priority`        | `notice_priority`   | no   |     | default `MEDIUM`  |
| `audience`        | `notice_audience[]` | no   |     | default `'{ALL}'` |
| `published_at`    | `timestamptz`       | yes  |     | null = draft      |
| `expires_at`      | `timestamptz`       | yes  |     | auto-hide         |
| `created_at`      | `timestamptz`       | no   |     |                   |
| `updated_at`      | `timestamptz`       | no   |     |                   |
| `deleted_at`      | `timestamptz`       | yes  |     | soft delete       |

**Keys** — PK `id` · FK `school_id` → `schools.id` (restrict), `published_by_id` → `users.id`
(restrict — a notice keeps its author).

**Indexes** — `(school_id, published_at desc)`, `(published_by_id)`.

**Constraints** — `audience` is an enum array (`PRD.md` §3 allowed "enum[] or JSONB"); see §18 for why
class scope is a join table rather than an array of class UUIDs.

```mermaid
erDiagram
  users ||--o{ notices : "authors"
  notices ||--o{ notice_classes : "targets"
  notices {
    uuid id PK
    uuid school_id FK
    uuid published_by_id FK
    notice_priority priority
    notice_audience audience
    timestamptz published_at
  }
```

### `notice_classes`

<!-- table: notice_classes · module: NoticesModule · prd: §4.11 · phase: 5 · tenant: yes · soft-delete: no -->

Class-scoped targeting for a notice. Absent rows mean the notice applies to every class matching
`notices.audience`. **The only table with a composite primary key instead of a surrogate `id`.**

| Column      | Type   | Null | Key    | Notes          |
| ----------- | ------ | ---- | ------ | -------------- |
| `notice_id` | `uuid` | no   | PK, FK | → `notices.id` |
| `class_id`  | `uuid` | no   | PK, FK | → `classes.id` |
| `school_id` | `uuid` | no   | FK     | → `schools.id` |

**Keys** — composite PK `(notice_id, class_id)` · FK `notice_id` → `notices.id` (cascade), `class_id` →
`classes.id` (cascade), `school_id` → `schools.id` (restrict).

**Indexes** — primary key `(notice_id, class_id)`, `(class_id)` ("notices for my class"), `(school_id)`.

**Constraints** — no surrogate `id` and no timestamps: the row is pure membership, and both key columns
are simultaneously FKs. `school_id` is denormalised for the tenant guard.

```mermaid
erDiagram
  notices ||--o{ notice_classes : "targets"
  classes ||--o{ notice_classes : "is targeted"
  notice_classes {
    uuid notice_id PK, FK
    uuid class_id PK, FK
    uuid school_id FK
  }
```

### `events`

<!-- table: events · module: NoticesModule · prd: §4.11 · phase: 5 · tenant: yes · soft-delete: yes -->

Calendar entries (exam week, sports day, holidays) with the same audience model as notices and an
optional time window.

| Column          | Type                | Null | Key | Notes             |
| --------------- | ------------------- | ---- | --- | ----------------- |
| `id`            | `uuid`              | no   | PK  |                   |
| `school_id`     | `uuid`              | no   | FK  | → `schools.id`    |
| `created_by_id` | `uuid`              | no   | FK  | → `users.id`      |
| `title`         | `text`              | no   |     |                   |
| `description`   | `text`              | yes  |     |                   |
| `event_date`    | `date`              | no   |     |                   |
| `start_time`    | `time`              | yes  |     |                   |
| `end_time`      | `time`              | yes  |     |                   |
| `audience`      | `notice_audience[]` | no   |     | default `'{ALL}'` |
| `created_at`    | `timestamptz`       | no   |     |                   |
| `updated_at`    | `timestamptz`       | no   |     |                   |
| `deleted_at`    | `timestamptz`       | yes  |     | soft delete       |

**Keys** — PK `id` · FK `school_id` → `schools.id` (restrict), `created_by_id` → `users.id` (restrict).

**Indexes** — `(school_id, event_date)`, `(created_by_id)`.

**Constraints** — `check (end_time > start_time)` when both times are present. Events have no
class-scoping join table today, unlike notices — see §18.

```mermaid
erDiagram
  users ||--o{ events : "creates"
  events {
    uuid id PK
    uuid school_id FK
    uuid created_by_id FK
    date event_date
    notice_audience audience
  }
```

## 12. Feature ERD — AI Assistant

`PRD.md` §4.12. Phase 5.

```mermaid
erDiagram
  schools ||--o{ ai_conversations : "scopes"
  users ||--o{ ai_conversations : "starts"
```

### `ai_conversations`

<!-- table: ai_conversations · module: AiModule · prd: §4.12 · phase: 5 · tenant: yes · soft-delete: no -->

History per user per AI feature. `messages` is a JSONB array of `{ role, content, createdAt }` turns.
Prompts are server-side templates, so raw user input is never forwarded to the LLM. For the four tool
screens (quiz, homework helper, event planner, notice) a row **is** a generation: `prompt_args` keeps the
form's own fields, and the reply is the text the panel renders.

| Column        | Type          | Null | Key | Notes                 |
| ------------- | ------------- | ---- | --- | --------------------- |
| `id`          | `uuid`        | no   | PK  |                       |
| `school_id`   | `uuid`        | no   | FK  | → `schools.id`        |
| `user_id`     | `uuid`        | no   | FK  | → `users.id`          |
| `feature`     | `ai_feature`  | no   |     | one of the 7 features |
| `title`       | `text`        | yes  |     | derived label         |
| `prompt_args` | `jsonb`       | no   |     | default `'{}'`        |
| `messages`    | `jsonb`       | no   |     | default `'[]'`        |
| `created_at`  | `timestamptz` | no   |     |                       |
| `updated_at`  | `timestamptz` | no   |     |                       |

**Keys** — PK `id` · FK `school_id` → `schools.id` (restrict), `user_id` → `users.id` (cascade).

**Indexes** — `(user_id, feature, created_at desc)` (per-feature history), `(school_id)`.

**Constraints** — rate limits are per user via `@Throttle`, not a column. `prompt_args` is validated against
the feature's template in the service, since its keys differ per tool.

```mermaid
erDiagram
  users ||--o{ ai_conversations : "starts"
  ai_conversations {
    uuid id PK
    uuid user_id FK
    ai_feature feature
    jsonb prompt_args
    jsonb messages
  }
```

## 13. Foreign Key Map

Every FK in the schema, with its `on delete` action (§1). `restrict` is the default for anything carrying
history; `cascade` is only for rows that cannot exist alone.

| Child table                 | Column             | → Parent            | On delete |
| --------------------------- | ------------------ | ------------------- | --------- |
| `users`                     | `school_id`        | `schools.id`        | restrict  |
| `otps`                      | `school_id`        | `schools.id`        | cascade   |
| `refresh_tokens`            | `user_id`          | `users.id`          | cascade   |
| `teachers`                  | `school_id`        | `schools.id`        | restrict  |
| `teachers`                  | `user_id`          | `users.id`          | cascade   |
| `teacher_classes`           | `school_id`        | `schools.id`        | restrict  |
| `teacher_classes`           | `teacher_id`       | `teachers.id`       | cascade   |
| `teacher_classes`           | `class_id`         | `classes.id`        | cascade   |
| `students`                  | `school_id`        | `schools.id`        | restrict  |
| `students`                  | `user_id`          | `users.id`          | cascade   |
| `students`                  | `class_id`         | `classes.id`        | set null  |
| `parents`                   | `school_id`        | `schools.id`        | restrict  |
| `parents`                   | `user_id`          | `users.id`          | cascade   |
| `parent_students`           | `school_id`        | `schools.id`        | restrict  |
| `parent_students`           | `parent_id`        | `parents.id`        | cascade   |
| `parent_students`           | `student_id`       | `students.id`       | cascade   |
| `classes`                   | `school_id`        | `schools.id`        | restrict  |
| `classes`                   | `class_teacher_id` | `teachers.id`       | set null  |
| `subjects`                  | `school_id`        | `schools.id`        | restrict  |
| `subjects`                  | `class_id`         | `classes.id`        | restrict  |
| `subjects`                  | `teacher_id`       | `teachers.id`       | set null  |
| `attendance`                | `school_id`        | `schools.id`        | restrict  |
| `attendance`                | `class_id`         | `classes.id`        | restrict  |
| `attendance`                | `student_id`       | `students.id`       | restrict  |
| `attendance`                | `marked_by_id`     | `users.id`          | restrict  |
| `homework`                  | `school_id`        | `schools.id`        | restrict  |
| `homework`                  | `class_id`         | `classes.id`        | restrict  |
| `homework`                  | `subject_id`       | `subjects.id`       | restrict  |
| `homework`                  | `teacher_id`       | `teachers.id`       | restrict  |
| `homework_submissions`      | `school_id`        | `schools.id`        | restrict  |
| `homework_submissions`      | `homework_id`      | `homework.id`       | cascade   |
| `homework_submissions`      | `student_id`       | `students.id`       | restrict  |
| `homework_submissions`      | `graded_by_id`     | `users.id`          | set null  |
| `study_materials`           | `school_id`        | `schools.id`        | restrict  |
| `study_materials`           | `class_id`         | `classes.id`        | restrict  |
| `study_materials`           | `subject_id`       | `subjects.id`       | restrict  |
| `study_materials`           | `uploaded_by_id`   | `users.id`          | restrict  |
| `timetables`                | `school_id`        | `schools.id`        | restrict  |
| `timetables`                | `class_id`         | `classes.id`        | cascade   |
| `periods`                   | `school_id`        | `schools.id`        | restrict  |
| `periods`                   | `timetable_id`     | `timetables.id`     | cascade   |
| `periods`                   | `subject_id`       | `subjects.id`       | set null  |
| `periods`                   | `teacher_id`       | `teachers.id`       | set null  |
| `fee_structures`            | `school_id`        | `schools.id`        | restrict  |
| `fee_structures`            | `class_id`         | `classes.id`        | restrict  |
| `fee_heads`                 | `school_id`        | `schools.id`        | restrict  |
| `fee_heads`                 | `fee_structure_id` | `fee_structures.id` | cascade   |
| `fee_invoices`              | `school_id`        | `schools.id`        | restrict  |
| `fee_invoices`              | `student_id`       | `students.id`       | restrict  |
| `fee_invoices`              | `fee_structure_id` | `fee_structures.id` | restrict  |
| `fee_invoices`              | `fee_head_id`      | `fee_heads.id`      | set null  |
| `fee_payments`              | `school_id`        | `schools.id`        | restrict  |
| `fee_payments`              | `invoice_id`       | `fee_invoices.id`   | restrict  |
| `fee_payments`              | `student_id`       | `students.id`       | restrict  |
| `fee_payments`              | `recorded_by_id`   | `users.id`          | set null  |
| `concessions`               | `school_id`        | `schools.id`        | restrict  |
| `concessions`               | `student_id`       | `students.id`       | restrict  |
| `concessions`               | `fee_head_id`      | `fee_heads.id`      | set null  |
| `concessions`               | `approved_by_id`   | `users.id`          | set null  |
| `receipt_sequences`         | `school_id`        | `schools.id`        | restrict  |
| `exams`                     | `school_id`        | `schools.id`        | restrict  |
| `exams`                     | `class_id`         | `classes.id`        | restrict  |
| `exam_subjects`             | `school_id`        | `schools.id`        | restrict  |
| `exam_subjects`             | `exam_id`          | `exams.id`          | cascade   |
| `exam_subjects`             | `subject_id`       | `subjects.id`       | restrict  |
| `results`                   | `school_id`        | `schools.id`        | restrict  |
| `results`                   | `exam_id`          | `exams.id`          | restrict  |
| `results`                   | `student_id`       | `students.id`       | restrict  |
| `results`                   | `subject_id`       | `subjects.id`       | restrict  |
| `results`                   | `entered_by_id`    | `users.id`          | set null  |
| `report_cards`              | `school_id`        | `schools.id`        | restrict  |
| `report_cards`              | `exam_id`          | `exams.id`          | cascade   |
| `report_cards`              | `student_id`       | `students.id`       | restrict  |
| `conversations`             | `school_id`        | `schools.id`        | restrict  |
| `conversations`             | `created_by_id`    | `users.id`          | set null  |
| `conversation_participants` | `school_id`        | `schools.id`        | restrict  |
| `conversation_participants` | `conversation_id`  | `conversations.id`  | cascade   |
| `conversation_participants` | `user_id`          | `users.id`          | cascade   |
| `messages`                  | `school_id`        | `schools.id`        | restrict  |
| `messages`                  | `conversation_id`  | `conversations.id`  | cascade   |
| `messages`                  | `sender_id`        | `users.id`          | restrict  |
| `notices`                   | `school_id`        | `schools.id`        | restrict  |
| `notices`                   | `published_by_id`  | `users.id`          | restrict  |
| `notice_classes`            | `notice_id`        | `notices.id`        | cascade   |
| `notice_classes`            | `class_id`         | `classes.id`        | cascade   |
| `notice_classes`            | `school_id`        | `schools.id`        | restrict  |
| `events`                    | `school_id`        | `schools.id`        | restrict  |
| `events`                    | `created_by_id`    | `users.id`          | restrict  |
| `ai_conversations`          | `school_id`        | `schools.id`        | restrict  |
| `ai_conversations`          | `user_id`          | `users.id`          | cascade   |
| `user_permissions`          | `school_id`        | `schools.id`        | restrict  |
| `user_permissions`          | `user_id`          | `users.id`          | cascade   |
| `user_permissions`          | `permission_id`    | `permissions.id`    | cascade   |
| `user_permissions`          | `granted_by_id`    | `users.id`          | set null  |

`otps` has no FK to `users` — matching is by `email` (§3). `receipt_sequences` has no FK to
`fee_invoices`; that link is logical only. `permissions` has no FK at all — it is the platform-wide
catalogue, and the tenancy lives on `user_permissions`.

## 14. Index Plan

Every index, by table. `unique (…)` marks constraint-backed indexes; the rest are plain indexes. Indexes
on `school_id` (alone or leading a composite) are what the tenant guard relies on, so every tenant table
has one.

| Table                       | Indexes                                                                                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `schools`                   | `unique (slug)`, `(subscription_status)`                                                                                                                      |
| `users`                     | `unique (email)`, `(school_id, role)`                                                                                                                         |
| `otps`                      | `(email, purpose)`, `(expires_at)`, `(school_id)`                                                                                                             |
| `refresh_tokens`            | `unique (token_hash)`, `(user_id, expires_at)` — no `school_id` column; scopes through `users`                                                                |
| `teachers`                  | `unique (user_id)`, `unique (school_id, employee_no)`, `(school_id, status)`                                                                                  |
| `teacher_classes`           | `unique (teacher_id, class_id)`, `(school_id)`, `(class_id)`                                                                                                  |
| `students`                  | `unique (user_id)`, `unique (school_id, admission_no)`, `unique (class_id, roll_no) where deleted_at is null`, `(school_id, status)`, `(class_id)`            |
| `parents`                   | `unique (user_id)`, `(school_id, status)`                                                                                                                     |
| `parent_students`           | `unique (parent_id, student_id)`, `unique (student_id) where is_primary`, `(school_id)`                                                                       |
| `classes`                   | `unique (school_id, grade, section, academic_year)`, `(school_id)`, `(class_teacher_id)`                                                                      |
| `subjects`                  | `unique (school_id, class_id, code)`, `(school_id)`, `(class_id)`, `(teacher_id)`                                                                             |
| `attendance`                | `unique (class_id, student_id, attendance_date)`, `(school_id, attendance_date)`, `(class_id, attendance_date)`, `(student_id, attendance_date)`              |
| `homework`                  | `(school_id, class_id, due_date)`, `(class_id, subject_id, due_date)`, `(teacher_id)`                                                                         |
| `homework_submissions`      | `unique (homework_id, student_id)`, `(school_id)`, `(student_id)`                                                                                             |
| `study_materials`           | `(school_id, class_id, subject_id, type)`, `(uploaded_by_id)`                                                                                                 |
| `timetables`                | `unique (class_id, day, academic_year)`, `(school_id)`                                                                                                        |
| `periods`                   | `(timetable_id, order_index)`, `(school_id)`, `(teacher_id)`                                                                                                  |
| `fee_structures`            | `unique (school_id, class_id, academic_year, name)`, `(class_id)`                                                                                             |
| `fee_heads`                 | `unique (fee_structure_id, name)`, `(school_id)`, `(fee_structure_id)`                                                                                        |
| `fee_invoices`              | `unique (school_id, receipt_no) where receipt_no is not null`, `(student_id, status)`, `(school_id, status, due_date)`, `(fee_structure_id)`, `(fee_head_id)` |
| `fee_payments`              | `unique (provider, provider_txn_id) where provider_txn_id is not null`, `(invoice_id)`, `(provider_order_id)`, `(school_id, paid_at)`                         |
| `concessions`               | `(student_id, status)`, `(school_id, status)`, `(fee_head_id)`                                                                                                |
| `receipt_sequences`         | `unique (school_id, fiscal_year)`                                                                                                                             |
| `exams`                     | `(school_id, kind, class_id, start_date)`, `(class_id, start_date)`                                                                                           |
| `exam_subjects`             | `unique (exam_id, subject_id)`, `(school_id)`, `(subject_id)`                                                                                                 |
| `results`                   | `unique (exam_id, student_id, subject_id)`, `(school_id)`, `(student_id, exam_id)`                                                                            |
| `report_cards`              | `unique (exam_id, student_id)`, `(school_id)`, `(student_id, exam_id)`                                                                                        |
| `conversations`             | `(school_id, last_message_at desc)`                                                                                                                           |
| `conversation_participants` | `unique (conversation_id, user_id)`, `(school_id)`, `(user_id)`                                                                                               |
| `messages`                  | `(conversation_id, created_at desc)`, `(school_id)`, `(sender_id)`                                                                                            |
| `notices`                   | `(school_id, published_at desc)`, `(published_by_id)`                                                                                                         |
| `notice_classes`            | primary key `(notice_id, class_id)`, `(class_id)`, `(school_id)`                                                                                              |
| `events`                    | `(school_id, event_date)`, `(created_by_id)`                                                                                                                  |
| `ai_conversations`          | `(user_id, feature, created_at desc)`, `(school_id)`                                                                                                          |
| `permissions`               | `unique (key)`, `(group, sort_order)`                                                                                                                         |
| `user_permissions`          | `unique (user_id, permission_id)`, `(school_id)`, `(permission_id)`                                                                                           |

## 15. Table Inventory

All 36 tables, with the section that documents each one.

| #   | Table                       | Feature section | PRD   | Phase |
| --- | --------------------------- | --------------- | ----- | ----- |
| 1   | `schools`                   | §3 Foundation   | §4.1  | 1     |
| 2   | `users`                     | §3 Foundation   | §4.2  | 1     |
| 3   | `otps`                      | §3 Foundation   | §4.1  | 1     |
| 4   | `refresh_tokens`            | §3 Foundation   | §4.2  | 1     |
| 5   | `teachers`                  | §3 Foundation   | §4.3  | 2     |
| 6   | `teacher_classes`           | §3 Foundation   | §4.3  | 2     |
| 7   | `students`                  | §3 Foundation   | §4.3  | 2     |
| 8   | `parents`                   | §3 Foundation   | §4.3  | 2     |
| 9   | `parent_students`           | §3 Foundation   | §4.3  | 2     |
| 10  | `classes`                   | §4 Classes      | §4.4  | 2     |
| 11  | `subjects`                  | §4 Classes      | §4.4  | 2     |
| 12  | `attendance`                | §5 Attendance   | §4.5  | 3     |
| 13  | `homework`                  | §6 Homework     | §4.7  | 3     |
| 14  | `homework_submissions`      | §6 Homework     | §4.7  | 3     |
| 15  | `study_materials`           | §6 Homework     | §4.13 | 3     |
| 16  | `timetables`                | §7 Timetable    | §4.8  | —     |
| 17  | `periods`                   | §7 Timetable    | §4.8  | —     |
| 18  | `fee_structures`            | §8 Fees         | §4.6  | 4     |
| 19  | `fee_heads`                 | §8 Fees         | §4.6  | 4     |
| 20  | `fee_invoices`              | §8 Fees         | §4.6  | 4     |
| 21  | `fee_payments`              | §8 Fees         | §4.6  | 4     |
| 22  | `concessions`               | §8 Fees         | §4.6  | 4     |
| 23  | `receipt_sequences`         | §8 Fees         | §4.6  | 4     |
| 24  | `exams`                     | §9 Exams        | §4.9  | 4     |
| 25  | `exam_subjects`             | §9 Exams        | §4.9  | 4     |
| 26  | `results`                   | §9 Exams        | §4.9  | 4     |
| 27  | `report_cards`              | §9 Exams        | §4.9  | 4     |
| 28  | `conversations`             | §10 Chat        | §4.10 | 5     |
| 29  | `conversation_participants` | §10 Chat        | §4.10 | 5     |
| 30  | `messages`                  | §10 Chat        | §4.10 | 5     |
| 31  | `notices`                   | §11 Notices     | §4.11 | 5     |
| 32  | `notice_classes`            | §11 Notices     | §4.11 | 5     |
| 33  | `events`                    | §11 Notices     | §4.11 | 5     |
| 34  | `ai_conversations`          | §12 AI          | §4.12 | 5     |
| 35  | `permissions`               | §3 Foundation   | §4.2  | 1     |
| 36  | `user_permissions`          | §3 Foundation   | §4.2  | 1     |

## 16. Cross-Cutting Concerns

**Tenancy.** Every tenant table carries a non-null `school_id` and every query is scoped by it via the
tenant guard (`Rules.md`, `Memory.md`). Exceptions: `schools` (it _is_ the tenant), `refresh_tokens`
(scopes through `users`), `notice_classes` (inherits scope from its notice), and `permissions` (a
platform-wide catalogue shared by every school — `user_permissions` is the row that carries the tenant). The backend connects
with the Supabase **service-role key**, which **bypasses RLS** — so tenant isolation is enforced in
application code, and any RLS policies added later are defence-in-depth, not the primary control.

**`updated_at`.** Maintained by a shared `set_updated_at()` trigger on every table that has the column,
rather than by application writes.

**Transaction boundaries** (`Rules.md`, `PRD.md`): school registration (school + admin + OTP), bulk
invoice generation, payment confirmation (payment + invoice + receipt number), exam publish
(results → report cards → notifications), and bulk CSV import per batch.

**Reporting views.** `PRD.md` §4.14 calls for aggregations and materialized views. These are read-only
projections, not tables: `mv_attendance_monthly` (attendance % per student/class/month),
`mv_fee_collection` (collected/pending/concessions per period), plus on-demand RPCs for the defaulter
list and `GET /dashboard/admin`.

## 17. Feature Coverage

Every backend feature module from `PRD.md` §4 and `Architecture.md` maps to tables documented above. The endpoint list for each feature lives in `PRD.md` §4, and every section there opens with the same table names in reverse — so the two documents can be diffed against each other. `PRD.md` §4.16 (`GET /health`) touches no table.

| PRD feature               | Feature ERD | Tables                                                                                            |
| ------------------------- | ----------- | ------------------------------------------------------------------------------------------------- |
| §4.1 Registration & OTP   | §3          | `schools`, `users`, `otps`                                                                        |
| §4.2 Auth & RBAC          | §3          | `users`, `refresh_tokens`, `permissions`, `user_permissions`                                      |
| §4.3 User management      | §3          | `teachers`, `teacher_classes`, `students`, `parents`, `parent_students`                           |
| §4.4 Classes & subjects   | §4          | `classes`, `subjects` (+ `students.class_id`)                                                     |
| §4.5 Attendance           | §5          | `attendance`                                                                                      |
| §4.6 Fees                 | §8          | `fee_structures`, `fee_heads`, `fee_invoices`, `fee_payments`, `concessions`, `receipt_sequences` |
| §4.7 Homework             | §6          | `homework`, `homework_submissions`                                                                |
| §4.8 Timetable            | §7          | `timetables`, `periods`                                                                           |
| §4.9 Exams & report cards | §9          | `exams`, `exam_subjects`, `results`, `report_cards`                                               |
| §4.10 Chat                | §10         | `conversations`, `conversation_participants`, `messages`                                          |
| §4.11 Notices & events    | §11         | `notices`, `notice_classes`, `events`                                                             |
| §4.12 AI assistant        | §12         | `ai_conversations`                                                                                |
| §4.13 Study materials     | §6          | `study_materials`                                                                                 |
| §4.14 Reports & analytics | —           | _views only_ (§16)                                                                                |
| §4.15 Email notifications | —           | _no table — BullMQ queue_                                                                         |

**Module coverage:** `SchoolsModule` §3 · `AuthModule` §3 · `UsersModule` §3 · `ClassesModule` §4 ·
`AttendanceModule` §5 · `HomeworkModule` §6 · `TimetablesModule` §7 · `FeesModule` §8 · `ExamsModule`
§9 · `ChatModule` §10 · `NoticesModule` §11 · `AiModule` §12 · `MaterialsModule` §6 · `ReportsModule`
§16 · `MailModule` — no tables.

## 18. Gaps & Open Questions

Items where the PRD implies something it does not model, or where a decision should be confirmed before
writing migrations:

1. **Refresh tokens** — §4.2 requires "hashed refresh tokens stored server-side" but §3 lists no model.
   Added `refresh_tokens` (§3); confirm the rotation/revocation policy.
2. **Notifications** — the `notification:new` socket event and fee-reminder/result/notice emails imply
   persistence so an offline user still sees them. No table exists. Add a `notifications` table
   (`user_id`, `type`, `payload`, `read_at`) or accept fire-and-forget delivery.
3. **Receipt numbers** — §4.6 wants a transactional receipt sequence. `receipt_sequences` (§8) is the
   proposed mechanism; confirm per-school vs global numbering and the reset boundary (fiscal vs academic
   year).
4. **Timetable has no phase** — **Resolved 2026-09-23:** timetables are deliberately post-MVP, which is
   what `phase: none` on `timetables`/`periods` already meant. `Phases.md` and `PRD.md` §4.8 now say so
   explicitly rather than leaving the endpoints unscheduled; §4.8 stays defined for when it is picked up.
   **Updated 2026-09-24:** the frontend now ships the weekly timetable against the mock API, so `phase: none`
   no longer means nothing exists — it means the _backend_ endpoints are still unscheduled.
5. **Class roster history** — `students.class_id` (current class only) was chosen over a
   `class_enrollments` join table. If promotion/academic-year history must be reportable, a join table is
   required instead.
6. **`students.class_id` vs `attendance.class_id`** — deliberate denormalisation for historical
   accuracy. Confirm attendance is always written with the student's class at that date.
7. **Chat allowed pairs** — admin↔teacher, teacher↔student, teacher↔parent is enforced in the service. A
   DB `check` cannot express it; consider a trigger if the rule must be airtight. There is also no unique
   key preventing two conversations between the same pair.
8. **AI feature count** — **Resolved 2026-09-23:** the count is **7**, matching the `ai_feature` enum
   above and the frontend's `AiFeature` type. `PRD.md` §1.1, `Architecture.md` and `Phases.md` all said 8
   and have been corrected; acceptance criterion 8 ("seven") was already right.
9. **Global vs per-school email uniqueness** — `users.email` is globally unique. If staff can belong to
   multiple schools, switch to `unique (school_id, email)`.
10. **Audit trail** — `marked_by_id`, `entered_by_id`, `approved_by_id`, `recorded_by_id` cover the
    sensitive writes, but there is no general audit log for edits/deletes of marks, invoices, or users.
    Worth adding given exam marks and payments are involved.
11. **Soft-delete coverage** — `deleted_at` is applied to profiles and content; financial and attendance
    rows are protected by `on delete restrict` instead. Confirm this is intended.
12. **Events have no class targeting** — `notices` can be narrowed to classes via `notice_classes`, but
    `events` uses only the `audience` array. Add `event_classes` if events need class scoping.
13. **Super-admin / multi-school staff** — no platform-level role exists above `schools`; every user is bound to one school.
14. **Student documents have no table** — `PRD.md` §4.3 defines `GET /students/:id/documents` and the profile's
    Documents tab renders its empty state from it, but no `student_documents` table exists yet. Either add one
    (student, title, kind, storage key, size, uploaded by/at — mirroring `study_materials`) before the upload flow
    is built, or drop the endpoint.
15. **Per-user vs role permissions** — `user_permissions` holds each account's **effective** set and is what the
    editor replaces; role defaults are applied at account creation from the matrix in `PRD.md` §2 rather than
    stored in a `role_permissions` table. That keeps the matrix the single source for defaults, but it means the
    defaults live in code — move them into a table if roles should ever be editable at runtime.

## 19. Full Schema ERD

The whole database in one diagram — all 36 tables, all 93 foreign keys (§13) plus the 2 logical links,
themed to the design tokens in [`Design.md`](./Design.md) (indigo primary, `ink` text, `line` rules).
Identity, foreign-key, and unique-key columns only; full column lists live in the per-table sections
above.

It is dense by construction — `schools` alone fans out to 32 tables — so the per-feature ERDs in §3–§12
remain the readable view. This one is the map: every table and every relationship in a single frame.

```mermaid
%%{init: {'theme':'base','themeVariables':{'primaryColor':'#eef2ff','primaryTextColor':'#0a0a0a','primaryBorderColor':'#6366f1','lineColor':'#9c9c9c','textColor':'#0a0a0a','fontFamily':'DM Sans, ui-sans-serif, system-ui, sans-serif','fontSize':'13px','attributeBackgroundColorOdd':'#ffffff','attributeBackgroundColorEven':'#fafafa'}}}%%
erDiagram
  schools ||--o{ users : "scopes"
  schools ||--o{ otps : "scopes"
  schools ||--o{ teachers : "scopes"
  schools ||--o{ teacher_classes : "scopes"
  teachers ||--o{ teacher_classes : "assigned to"
  classes ||--o{ teacher_classes : "has"
  teacher_classes {
    uuid id PK
    uuid teacher_id FK
    uuid class_id FK
  }
  schools ||--o{ students : "scopes"
  schools ||--o{ parents : "scopes"
  schools ||--o{ parent_students : "scopes"
  schools ||--o{ classes : "scopes"
  schools ||--o{ subjects : "scopes"
  schools ||--o{ attendance : "scopes"
  schools ||--o{ homework : "scopes"
  schools ||--o{ homework_submissions : "scopes"
  schools ||--o{ study_materials : "scopes"
  schools ||--o{ timetables : "scopes"
  schools ||--o{ periods : "scopes"
  schools ||--o{ fee_structures : "scopes"
  schools ||--o{ fee_heads : "scopes"
  schools ||--o{ fee_invoices : "scopes"
  schools ||--o{ fee_payments : "scopes"
  schools ||--o{ concessions : "scopes"
  schools ||--o{ receipt_sequences : "scopes"
  schools ||--o{ exams : "scopes"
  schools ||--o{ exam_subjects : "scopes"
  schools ||--o{ results : "scopes"
  schools ||--o{ report_cards : "scopes"
  schools ||--o{ conversations : "scopes"
  schools ||--o{ conversation_participants : "scopes"
  schools ||--o{ messages : "scopes"
  schools ||--o{ notices : "scopes"
  schools ||--o{ notice_classes : "scopes"
  schools ||--o{ events : "scopes"
  schools ||--o{ ai_conversations : "scopes"
  users ||--|| teachers : "profile"
  users ||--|| students : "profile"
  users ||--|| parents : "profile"
  users ||--o{ refresh_tokens : "issues"
  users ||--o{ attendance : "marks"
  users ||--o{ homework_submissions : "grades"
  users ||--o{ study_materials : "uploads"
  users ||--o{ fee_payments : "records"
  users ||--o{ concessions : "approves"
  users ||--o{ results : "enters"
  users ||--o{ conversations : "opens"
  users ||--o{ conversation_participants : "joins"
  users ||--o{ messages : "sends"
  users ||--o{ notices : "authors"
  users ||--o{ events : "creates"
  users ||--o{ ai_conversations : "starts"
  users ||..o{ otps : "matched by email"
  classes ||--o{ students : "rosters"
  classes ||--o{ subjects : "offers"
  classes ||--o{ attendance : "registers"
  classes ||--o{ homework : "is assigned"
  classes ||--o{ study_materials : "is for"
  classes ||--o{ timetables : "has"
  classes ||--o{ fee_structures : "applies to"
  classes ||--o{ exams : "sits"
  classes ||--o{ notice_classes : "is targeted"
  teachers ||--o{ classes : "leads"
  teachers ||--o{ subjects : "teaches"
  teachers ||--o{ homework : "creates"
  teachers ||--o{ periods : "teaches"
  students ||--o{ parent_students : "has guardians"
  students ||--o{ attendance : "is marked in"
  students ||--o{ homework_submissions : "submits"
  students ||--o{ fee_invoices : "is billed"
  students ||--o{ fee_payments : "pays"
  students ||--o{ concessions : "is granted"
  students ||--o{ results : "achieves"
  students ||--o{ report_cards : "receives"
  parents ||--o{ parent_students : "has children"
  subjects ||--o{ homework : "covers"
  subjects ||--o{ study_materials : "is for"
  subjects ||--o{ periods : "scheduled"
  subjects ||--o{ exam_subjects : "is examined"
  subjects ||--o{ results : "is scored in"
  homework ||--o{ homework_submissions : "receives"
  timetables ||--o{ periods : "contains"
  fee_structures ||--o{ fee_heads : "composed of"
  fee_structures ||--o{ fee_invoices : "generates"
  fee_heads ||--o{ fee_invoices : "billed as"
  fee_heads ||--o{ concessions : "discounts"
  fee_invoices ||--o{ fee_payments : "is settled by"
  receipt_sequences ||..o{ fee_invoices : "numbers"
  exams ||--o{ exam_subjects : "schedules"
  exams ||--o{ results : "records"
  exams ||--o{ report_cards : "issues"
  conversations ||--o{ conversation_participants : "includes"
  conversations ||--o{ messages : "contains"
  notices ||--o{ notice_classes : "targets"
  schools ||--o{ user_permissions : "scopes"
  users ||--o{ user_permissions : "holds"
  users ||--o{ user_permissions : "grants"
  permissions ||--o{ user_permissions : "granted as"
  schools {
    uuid id PK
    text slug UK
  }
  users {
    uuid id PK
    uuid school_id FK
    text email UK
  }
  otps {
    uuid id PK
    uuid school_id FK
    text email
    otp_purpose purpose
  }
  refresh_tokens {
    uuid id PK
    uuid user_id FK
    text token_hash UK
  }
  teachers {
    uuid id PK
    uuid school_id FK
    uuid user_id FK
    text employee_no UK
  }
  students {
    uuid id PK
    uuid school_id FK
    uuid user_id FK
    uuid class_id FK
    text admission_no UK
  }
  parents {
    uuid id PK
    uuid school_id FK
    uuid user_id FK
  }
  parent_students {
    uuid id PK
    uuid school_id FK
    uuid parent_id FK
    uuid student_id FK
    parent_relation relation
  }
  classes {
    uuid id PK
    uuid school_id FK
    uuid class_teacher_id FK
    text academic_year
  }
  subjects {
    uuid id PK
    uuid school_id FK
    uuid class_id FK
    uuid teacher_id FK
    text code
  }
  attendance {
    uuid id PK
    uuid school_id FK
    uuid class_id FK
    uuid student_id FK
    uuid marked_by_id FK
    date attendance_date
  }
  homework {
    uuid id PK
    uuid school_id FK
    uuid class_id FK
    uuid subject_id FK
    uuid teacher_id FK
    date due_date
    integer max_marks
  }
  homework_submissions {
    uuid id PK
    uuid school_id FK
    uuid homework_id FK
    uuid student_id FK
    uuid graded_by_id FK
    boolean is_late
  }
  study_materials {
    uuid id PK
    uuid school_id FK
    uuid class_id FK
    uuid subject_id FK
    uuid uploaded_by_id FK
    material_type type
  }
  timetables {
    uuid id PK
    uuid school_id FK
    uuid class_id FK
    weekday day
  }
  periods {
    uuid id PK
    uuid school_id FK
    uuid timetable_id FK
    uuid subject_id FK
    uuid teacher_id FK
    time start_time
    text label
  }
  fee_structures {
    uuid id PK
    uuid school_id FK
    uuid class_id FK
    text academic_year
  }
  fee_heads {
    uuid id PK
    uuid school_id FK
    uuid fee_structure_id FK
    integer amount_paise
    fee_frequency frequency
    date due_date
  }
  fee_invoices {
    uuid id PK
    uuid school_id FK
    uuid student_id FK
    uuid fee_structure_id FK
    uuid fee_head_id FK
    invoice_status status
    text receipt_no
  }
  fee_payments {
    uuid id PK
    uuid school_id FK
    uuid invoice_id FK
    uuid student_id FK
    uuid recorded_by_id FK
    payment_provider provider
    payment_status status
  }
  concessions {
    uuid id PK
    uuid school_id FK
    uuid student_id FK
    uuid fee_head_id FK
    uuid approved_by_id FK
    concession_category category
    concession_type type
    concession_status status
  }
  receipt_sequences {
    uuid id PK
    uuid school_id FK
    text fiscal_year
    integer last_number
  }
  exams {
    uuid id PK
    uuid school_id FK
    uuid class_id FK
    exam_kind kind
    exam_type type
    boolean is_published
  }
  exam_subjects {
    uuid id PK
    uuid school_id FK
    uuid exam_id FK
    uuid subject_id FK
    integer max_marks
  }
  results {
    uuid id PK
    uuid school_id FK
    uuid exam_id FK
    uuid student_id FK
    uuid subject_id FK
    uuid entered_by_id FK
    numeric obtained_marks
  }
  report_cards {
    uuid id PK
    uuid school_id FK
    uuid exam_id FK
    uuid student_id FK
    numeric percentage
    text grade
    integer rank
  }
  conversations {
    uuid id PK
    uuid school_id FK
    uuid created_by_id FK
    timestamptz last_message_at
  }
  conversation_participants {
    uuid id PK
    uuid school_id FK
    uuid conversation_id FK
    uuid user_id FK
    timestamptz last_read_at
  }
  messages {
    uuid id PK
    uuid school_id FK
    uuid conversation_id FK
    uuid sender_id FK
    text body
    timestamptz read_at
  }
  notices {
    uuid id PK
    uuid school_id FK
    uuid published_by_id FK
    notice_priority priority
    notice_audience audience
    timestamptz published_at
  }
  notice_classes {
    uuid notice_id PK, FK
    uuid class_id PK, FK
    uuid school_id FK
  }
  events {
    uuid id PK
    uuid school_id FK
    uuid created_by_id FK
    date event_date
    notice_audience audience
  }
  ai_conversations {
    uuid id PK
    uuid school_id FK
    uuid user_id FK
    ai_feature feature
    jsonb prompt_args
    jsonb messages
  }
  permissions {
    uuid id PK
    text key UK
    permission_group group
  }
  user_permissions {
    uuid id PK
    uuid school_id FK
    uuid user_id FK
    uuid permission_id FK
    uuid granted_by_id FK
  }
```

**Reading it:** solid lines are enforced foreign keys; dotted lines are the two logical-only links (`otps`
matched by email, `fee_invoices` numbered from `receipt_sequences`). `||` marks the one side and `}o`
marks the many side, so `schools ||--o{ users` reads "one school has many users".
