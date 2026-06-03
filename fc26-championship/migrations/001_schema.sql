-- FC26 Championship Platform — Phase 1 Schema
-- Run this in your Supabase SQL editor or with psql

-- ─── profiles ────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id                  uuid primary key default gen_random_uuid(),
  display_name        text not null,
  nickname            text,
  access_code_hash    text not null,
  role                text not null check (role in ('super_admin', 'moderator', 'player')),
  avatar_url          text,
  favorite_team_id    uuid null,
  bio                 text,
  preferred_formation text,
  playing_style       text,
  strongest_skill     text,
  weak_skill          text,
  status              text not null default 'active'
                        check (status in ('active', 'inactive', 'restricted')),
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create index if not exists idx_profiles_role   on profiles(role);
create index if not exists idx_profiles_status on profiles(status);

-- ─── fc_teams ─────────────────────────────────────────────────────────────────
create table if not exists fc_teams (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  short_name text,
  logo_url   text,
  created_at timestamptz default now()
);

-- ─── sessions ─────────────────────────────────────────────────────────────────
create table if not exists sessions (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

create index if not exists idx_sessions_profile_id on sessions(profile_id);
create index if not exists idx_sessions_expires_at on sessions(expires_at);

-- ─── profile_change_requests ──────────────────────────────────────────────────
create table if not exists profile_change_requests (
  id                 uuid primary key default gen_random_uuid(),
  profile_id         uuid not null references profiles(id) on delete cascade,
  requested_changes  jsonb not null,
  status             text not null default 'pending'
                       check (status in ('pending', 'approved', 'rejected')),
  admin_note         text,
  reviewed_by        uuid references profiles(id),
  reviewed_at        timestamptz,
  created_at         timestamptz default now()
);

create index if not exists idx_pcr_profile_id on profile_change_requests(profile_id);
create index if not exists idx_pcr_status     on profile_change_requests(status);

-- ─── notifications ────────────────────────────────────────────────────────────
create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  type       text not null,
  title      text not null,
  body       text,
  is_read    boolean not null default false,
  created_at timestamptz default now()
);

create index if not exists idx_notifications_profile_id on notifications(profile_id);
create index if not exists idx_notifications_is_read    on notifications(is_read);

-- ─── updated_at trigger ───────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();
