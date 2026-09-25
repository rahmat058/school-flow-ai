# Database — Backend

**The mock adapter is the API of record.** `frontend/src/services/mockAdapter.ts` answers every request the frontend makes, over the deterministic seed in `frontend/src/data/`, and the TypeScript shapes in `frontend/src/types/` are the contract the real NestJS/Supabase backend has to satisfy. This file is a short index: it names the tables and the enums and says where the detail lives. It does not repeat the per-table columns, keys, indexes or constraints — [`Schema.md`](./Schema.md) carries those — and it carries no diagram — [`Erd.md`](./Erd.md) does.

The mock stores **32 tables**, of which **4 are junction tables**; together they hold **84 enforced foreign keys** plus **2 logical links** (the embedded arrays on `conversations` and `notices`).

## 1. Conventions

**Identifiers.** `snake_case`, plural table names (`fee_invoices`, `homework_submissions`), singular column names. Raw SQL stays snake_case; the API stays camelCase (`feeInvoices.feeStructureId`), so services map between the two and never expose a column name directly.

| Concept     | Postgres type                                    | Notes                                                                  |
| ----------- | ------------------------------------------------ | ---------------------------------------------------------------------- |
| Primary key | `uuid default gen_random_uuid()`                 | every table, junctions included                                        |
| Tenant      | `school_id uuid not null references schools(id)` | every tenant table; `schools` and `permissions` are the two exceptions |
| Money       | `integer` (minor unit)                           | never `float`; the column carries a `*Paise` suffix (`amount_paise`)   |
| Instant     | `timestamptz`                                    | `created_at default now()`, `updated_at` on write                      |
| Date only   | `date`                                           | ISO `YYYY-MM-DD`                                                       |
| Clock time  | `time`                                           | `HH:mm` 24-hour — timetable periods, event windows                     |
| Soft delete | `deleted_at timestamptz null`                    | content tables only; financial and academic rows are never deleted     |
| Embedded    | `jsonb` / `uuid[]` / `text[]`                    | structures the mock keeps in the row rather than in a child table      |
| Fixed sets  | Postgres enum                                    | §3 — `SCREAMING_SNAKE`, matching the frontend unions                   |

**Foreign keys.** The `on delete` policy: `restrict` for anything carrying history (attendance, invoices, results, marks) and for every tenant edge to `schools`; `cascade` only for rows that cannot exist alone (`periods` under `timetables`, `fee_heads` under `fee_structures`); `set null` for optional links and for nullable attribution columns. The full map is in [`Erd.md`](./Erd.md) §4.

## 2. Table inventory

All **32 tables** — **28 non-junction** and **4 junction** — by module and feature group.

| Table                  | Module           | Feature group        | Junction |
| ---------------------- | ---------------- | -------------------- | -------- |
| `schools`              | SchoolsModule    | Foundation & Auth    | —        |
| `users`                | AuthModule       | Foundation & Auth    | —        |
| `teachers`             | UsersModule      | People               | —        |
| `students`             | UsersModule      | People               | —        |
| `parents`              | UsersModule      | People               | —        |
| `parent_students`      | UsersModule      | People               | yes      |
| `classes`              | ClassesModule    | Classes & Subjects   | —        |
| `subjects`             | ClassesModule    | Classes & Subjects   | —        |
| `class_subjects`       | ClassesModule    | Classes & Subjects   | yes      |
| `teacher_classes`      | UsersModule      | Classes & Subjects   | yes      |
| `attendance`           | AttendanceModule | Attendance           | —        |
| `homework`             | HomeworkModule   | Homework & Materials | —        |
| `homework_submissions` | HomeworkModule   | Homework & Materials | —        |
| `study_materials`      | MaterialsModule  | Homework & Materials | —        |
| `timetables`           | TimetablesModule | Timetable            | —        |
| `periods`              | TimetablesModule | Timetable            | —        |
| `fee_structures`       | FeesModule       | Fees                 | —        |
| `fee_heads`            | FeesModule       | Fees                 | —        |
| `fee_invoices`         | FeesModule       | Fees                 | —        |
| `fee_payments`         | FeesModule       | Fees                 | —        |
| `concessions`          | FeesModule       | Fees                 | —        |
| `exams`                | ExamsModule      | Exams                | —        |
| `exam_subjects`        | ExamsModule      | Exams                | —        |
| `results`              | ExamsModule      | Exams                | —        |
| `report_cards`         | ExamsModule      | Exams                | —        |
| `conversations`        | ChatModule       | Chat                 | —        |
| `messages`             | ChatModule       | Chat                 | —        |
| `notices`              | NoticesModule    | Notices & Events     | —        |
| `events`               | NoticesModule    | Notices & Events     | —        |
| `ai_conversations`     | AiModule         | AI                   | —        |
| `permissions`          | AuthModule       | Permissions          | —        |
| `user_permissions`     | AuthModule       | Permissions          | yes      |

## 3. Enums

The frontend's string-literal unions become Postgres enums where the value set is fixed and the column is stored. Values are `SCREAMING_SNAKE`.

| Enum                  | Values                                                                                                                 | Column(s)                                              |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `role`                | `ADMIN`, `TEACHER`, `STUDENT`, `PARENT`                                                                                | `users.role`                                           |
| `subscription_status` | `TRIAL`, `ACTIVE`, `SUSPENDED`, `CANCELLED`                                                                            | `schools.subscription_status`                          |
| `record_status`       | `ACTIVE`, `INACTIVE`                                                                                                   | `teachers.status`, `students.status`, `parents.status` |
| `gender`              | `MALE`, `FEMALE`, `OTHER`                                                                                              | `students.gender`                                      |
| `blood_group`         | `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`                                                                       | `students.blood_group`                                 |
| `parent_relation`     | `FATHER`, `MOTHER`, `GUARDIAN`                                                                                         | `parent_students.relation`                             |
| `attendance_status`   | `PRESENT`, `ABSENT`, `LEAVE`, `LATE`                                                                                   | `attendance.status`                                    |
| `fee_frequency`       | `MONTHLY`, `QUARTERLY`, `ANNUAL`, `ONE_TIME`                                                                           | `fee_heads.frequency`                                  |
| `invoice_status`      | `PENDING`, `PARTIAL`, `PAID`, `OVERDUE`                                                                                | `fee_invoices.status`                                  |
| `payment_status`      | `PENDING`, `PAID`, `FAILED`, `REFUNDED`                                                                                | `fee_payments.status`                                  |
| `payment_provider`    | `STRIPE`, `SSLCOMMERZ`, `MANUAL`                                                                                       | `fee_payments.provider`                                |
| `payment_method`      | `CARD`, `MOBILE_BANKING`, `NET_BANKING`, `CASH`, `CHEQUE`, `DEMAND_DRAFT`, `ONLINE`                                    | `fee_payments.method`                                  |
| `concession_type`     | `PERCENTAGE`, `FIXED`                                                                                                  | `concessions.type`                                     |
| `concession_category` | `SIBLING`, `MERIT`, `SC_ST`, `CUSTOM`, `STAFF_WARD`                                                                    | `concessions.category`                                 |
| `concession_status`   | `PENDING`, `APPROVED`, `REJECTED`                                                                                      | `concessions.status`                                   |
| `material_type`       | `PDF`, `NOTES`, `WORKSHEET`, `PAPER`                                                                                   | `study_materials.type`                                 |
| `exam_type`           | `UNIT`, `MID`, `FINAL`, `ANNUAL`                                                                                       | `exams.type`                                           |
| `exam_kind`           | `TEST`, `EXAM`                                                                                                         | `exams.kind`                                           |
| `weekday`             | `MON`, `TUE`, `WED`, `THU`, `FRI`, `SAT`, `SUN`                                                                        | `timetables.day`                                       |
| `notice_audience`     | `ALL`, `TEACHERS`, `STUDENTS`, `PARENTS`                                                                               | `notices.audience[]`, `events.audience[]`              |
| `notice_priority`     | `HIGH`, `MEDIUM`, `LOW`                                                                                                | `notices.priority`                                     |
| `permission_group`    | `STUDENTS`, `ATTENDANCE`, `EXAMS`, `HOMEWORK`, `TIMETABLE`, `FEES`, `NOTICES`, `MATERIALS`, `COMMUNICATION`, `REPORTS` | `permissions.group`                                    |
| `ai_feature`          | `CHAT`, `REPORT_COMMENT`, `FEE_REMINDER`, `NOTICE`, `EVENT_PLAN`, `HOMEWORK_HELP`, `QUIZ`                              | `ai_conversations.feature`                             |

`otp_purpose` (`REGISTER`, `RESET_PASSWORD`, `INVITE`) is the one enum that belongs to a planned table rather than a stored one — `otps` ([`Schema.md`](./Schema.md) §16).

## 4. Where to look

| Need                                          | File                              |
| --------------------------------------------- | --------------------------------- |
| A table's columns, keys, indexes, constraints | [`Schema.md`](./Schema.md) §3–§14 |
| The full diagram, sub-diagrams and FK map     | [`Erd.md`](./Erd.md) §2–§5        |
| Roles, route gates and the error catalogue    | [`Access.md`](./Access.md)        |
| Endpoints per module                          | [`PRD.md`](./PRD.md) §4           |
| Build order                                   | [`Phases.md`](./Phases.md)        |

## 5. Open questions

- **`*Paise` naming versus the declared `USD` currency.** The single demo tenant declares `currency: 'USD'` in `schools.settings` and the seed helper is named `dollars`, yet every money column is suffixed `*Paise` (`amount_paise`, `paid_paise`, `discount_paise`). Either the declared currency is wrong and should be `INR`, or the `*Paise` suffix is wrong and the columns are currency-neutral minor units. Unresolved; the mock's column names stand.
- **Planned tables the mock has never had.** `otps`, `refresh_tokens`, `receipt_sequences`, `notice_classes` and `conversation_participants` do not exist in the mock. `conversation_participants` and `notice_classes` are the normalised form of the embedded `conversations.participant_ids[]` and `notices.class_ids[]` arrays; the other three are credential and numbering state the demo keeps in memory. All five are catalogued in [`Schema.md`](./Schema.md) §16.
