-- FC26 Championship Platform — Phase 2 Schema
-- Run after 001_schema.sql and 002_seed_teams.sql

-- ─── matches ──────────────────────────────────────────────────────────────────
create table if not exists matches (
  id               uuid primary key default gen_random_uuid(),
  match_type       text not null default 'friendly'
    check (match_type in ('friendly','league','knockout','group_stage','title_challenge','rivalry_series','custom')),
  status           text not null default 'confirmed_appealable'
    check (status in ('confirmed_appealable','locked','under_appeal','cancelled','fraudulent')),
  player_a_id      uuid not null references profiles(id),
  player_b_id      uuid not null references profiles(id),
  player_a_score   int  not null check (player_a_score >= 0),
  player_b_score   int  not null check (player_b_score >= 0),
  winner_id        uuid references profiles(id),
  is_draw          boolean not null default false,
  player_a_team_id uuid references fc_teams(id),
  player_b_team_id uuid references fc_teams(id),
  submitted_by     uuid not null references profiles(id),
  notes            text,
  played_at        timestamptz not null default now(),
  appeal_deadline  timestamptz not null,
  locked_at        timestamptz,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),

  -- Prevent self-match
  check (player_a_id <> player_b_id),
  -- winner_id must be one of the two players (or null for draw)
  check (winner_id is null or winner_id = player_a_id or winner_id = player_b_id),
  -- Enforce consistent draw/winner logic
  check (
    (player_a_score = player_b_score and is_draw = true  and winner_id is null)
    or (player_a_score > player_b_score and is_draw = false and winner_id = player_a_id)
    or (player_a_score < player_b_score and is_draw = false and winner_id = player_b_id)
  )
);

-- ─── match_comments ───────────────────────────────────────────────────────────
create table if not exists match_comments (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null references matches(id) on delete cascade,
  author_id  uuid not null references profiles(id) on delete cascade,
  body       text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  is_deleted boolean not null default false
);

-- ─── match_events (audit timeline) ───────────────────────────────────────────
create table if not exists match_events (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null references matches(id) on delete cascade,
  event_type text not null,
  actor_id   uuid references profiles(id),
  metadata   jsonb,
  created_at timestamptz default now()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists idx_matches_player_a_id     on matches(player_a_id);
create index if not exists idx_matches_player_b_id     on matches(player_b_id);
create index if not exists idx_matches_submitted_by    on matches(submitted_by);
create index if not exists idx_matches_status          on matches(status);
create index if not exists idx_matches_played_at       on matches(played_at);
create index if not exists idx_matches_appeal_deadline on matches(appeal_deadline);

create index if not exists idx_match_comments_match_id  on match_comments(match_id);
create index if not exists idx_match_comments_author_id on match_comments(author_id);

create index if not exists idx_match_events_match_id   on match_events(match_id);
create index if not exists idx_match_events_event_type on match_events(event_type);

-- ─── Link notifications to matches (optional) ─────────────────────────────────
alter table notifications add column if not exists match_id uuid references matches(id) on delete set null;
create index if not exists idx_notifications_match_id on notifications(match_id);

-- ─── updated_at triggers ──────────────────────────────────────────────────────
create trigger matches_updated_at
  before update on matches
  for each row execute function set_updated_at();

create trigger match_comments_updated_at
  before update on match_comments
  for each row execute function set_updated_at();
