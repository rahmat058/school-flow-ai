-- 0001 — Phase 1 foundation: the tenant root and the login identity.
-- Reference: docs/backend/Schema.md §2 (enums) and §3 (`schools`, `users`).
--
-- Apply with a direct connection (DATABASE_URL) — see backend/README.md.
-- Idempotent so a re-run is safe while the schema settles.

do $$ begin
  create type role as enum ('ADMIN', 'TEACHER', 'STUDENT', 'PARENT');
exception when duplicate_object then null; end $$;

do $$ begin
  create type subscription_status as enum ('TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED');
exception when duplicate_object then null; end $$;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end $$;

create table if not exists schools (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  slug                text not null,
  address             text,
  contact_email       text,
  contact_phone       text,
  logo_url            text,
  subscription_status subscription_status not null default 'TRIAL',
  settings            jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);

create unique index if not exists idx_schools_slug on schools (slug);
create index if not exists idx_schools_subscription_status on schools (subscription_status);

create table if not exists users (
  id                            uuid primary key default gen_random_uuid(),
  school_id                     uuid not null references schools (id) on delete restrict,
  email                         text not null,
  password_hash                 text not null,
  role                          role not null,
  is_verified                   boolean not null default false,
  email_verified_at             timestamptz,
  verification_token_hash       text,
  verification_token_expires_at timestamptz,
  profile_id                    uuid,
  first_name                    text not null,
  last_name                     text not null,
  class_id                      uuid,
  last_login_at                 timestamptz,
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now(),
  deleted_at                    timestamptz
);

create unique index if not exists idx_users_email on users (email);
create index if not exists idx_users_school_id_role on users (school_id, role);
create index if not exists idx_users_verification_token_hash
  on users (verification_token_hash)
  where verification_token_hash is not null;

drop trigger if exists trg_schools_updated_at on schools;
create trigger trg_schools_updated_at
  before update on schools
  for each row execute function set_updated_at();

drop trigger if exists trg_users_updated_at on users;
create trigger trg_users_updated_at
  before update on users
  for each row execute function set_updated_at();
