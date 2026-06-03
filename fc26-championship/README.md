# FC26 Championship Platform — Phase 2

Private FC26 friends championship tracker. Premium dark sports/esports UI built on Next.js 16, Supabase, TypeScript, and Tailwind CSS v4.

---

## Project Structure

```
fc26-championship/
├── app/
│   ├── (auth)/login/              Login page + form
│   ├── (admin)/admin/             Admin dashboard, players, profile-requests
│   ├── (player)/
│   │   ├── dashboard/             Player home — stats, recent matches, notifications
│   │   ├── profile/               Profile view + edit-request + stats
│   │   ├── matches/               Match list (filters: my/all/friendly/status/player)
│   │   ├── matches/new/           Record friendly match form
│   │   ├── matches/[id]/          Match detail, comments, event timeline
│   │   ├── leaderboard/           Ranked player stats table
│   │   ├── players/               Active players list
│   │   └── player/[id]/           Player profile view + match history
│   ├── api/auth/                  Login / logout
│   ├── api/setup/                 One-time super_admin bootstrap
│   └── api/matches/lock-expired/  Manual trigger to lock expired matches
├── components/
│   ├── admin/                     AdminSidebar, AdminTopBar
│   ├── matches/                   MatchCard
│   ├── player/                    PlayerTopBar, BottomNav (5-tab)
│   └── ui/                        Avatar, Badge, EmptyState, LoadingSpinner, Toast
├── lib/
│   ├── actions/
│   │   ├── matches.ts             recordFriendlyMatchAction, lockExpiredMatches, fetch helpers
│   │   ├── comments.ts            addCommentAction, deleteCommentAction
│   │   ├── notifications.ts       markNotificationReadAction, markAllNotificationsReadAction
│   │   ├── players.ts             createPlayerAction, updatePlayerAction
│   │   └── profileRequests.ts     submitProfileChangeRequest, reviewRequest
│   ├── match-utils.ts             isMatchAppealable (pure utility, no 'use server')
│   ├── notifications.ts           createNotification, createNotifications helpers
│   ├── stats.ts                   getPlayerStats, getLeaderboard
│   ├── crypto.ts                  bcrypt hashing + HMAC session tokens
│   ├── permissions.ts             All auth guards and permission checks
│   ├── session.ts                 createSession, getSessionProfile, destroySession
│   └── supabase.ts                createPublicClient, createAdminClient
├── migrations/
│   ├── 001_schema.sql             Core tables (profiles, fc_teams, sessions, notifications…)
│   ├── 002_seed_teams.sql         16 default FC teams
│   └── 003_matches.sql            matches, match_comments, match_events + indexes + triggers
├── types/index.ts                 All TypeScript types (Match, MatchStatus, PlayerStats…)
├── utils/format.ts                formatDate, formatDateTime, capitalize
├── proxy.ts                       Cookie-presence routing guard
└── .env.example                   All required environment variables
```

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in all values before running.

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key — **server-side only** |
| `SESSION_SECRET` | 32+ char HMAC secret. Generate: `openssl rand -hex 32` |
| `SETUP_SECRET` | One-time secret to bootstrap the first super_admin |
| `CRON_SECRET` | (Optional) Bearer token to secure `/api/matches/lock-expired` |

---

## Local Setup

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your Supabase credentials and secrets

# Run in Supabase SQL Editor (in order):
# 1. migrations/001_schema.sql
# 2. migrations/002_seed_teams.sql
# 3. migrations/003_matches.sql

npm run dev
```

---

## Creating the First Admin (Bootstrap)

```bash
curl -X POST http://localhost:3000/api/setup \
  -H "Content-Type: application/json" \
  -d '{"secret":"YOUR_SETUP_SECRET","displayName":"Arthur","accessCode":"your-code"}'
```

After the first super_admin is created, the endpoint locks automatically.

---

## Phase 2 Features

### Recording a Friendly Match

1. Log in as an active player.
2. Navigate to **Matches → Record** (or bottom nav → ⚽).
3. Select an opponent from the active players list.
4. Enter your score and the opponent's score.
5. Optionally pick FC teams used by each player.
6. Optionally set the date/time played (defaults to now).
7. Optionally add notes.
8. Submit — the match is immediately counted in stats, and both players receive a notification.

**Rules enforced:**
- Self-matches are blocked at the action level and the DB constraint level.
- Inactive/restricted players cannot submit matches.
- The opponent must be an active player.
- Score must be non-negative integers.
- The played date cannot be in the future.
- Winner/draw logic is derived server-side and validated by a DB CHECK constraint. The client cannot forge winner data.

---

### Appealable Status

Every newly recorded match starts in **`confirmed_appealable`** status.

- An **Appealable** badge is shown on all match cards and the detail page.
- The `appeal_deadline` is set to `created_at + 24 hours`.
- The detail page shows the exact time the appeal window closes.
- A placeholder "appeal coming in Phase 3" notice is shown on appealable matches.

---

### Match Locking

Matches automatically transition from `confirmed_appealable` → `locked` when the appeal window closes.

**How it triggers:**
1. **Opportunistic** — on every visit to `/matches`, `/matches/[id]`, and `/dashboard`, `lockExpiredMatches()` runs server-side. Any match past its deadline is locked in that request.
2. **Manual** — `GET /api/matches/lock-expired` can be called by an admin or a Vercel cron job.

**What happens on lock:**
- `status` → `locked`, `locked_at` = now
- A `match_locked` event is added to the match timeline
- Both players receive a "Match result locked" notification

**Matches under_appeal, cancelled, or fraudulent are never auto-locked.**

---

### Stats Calculation

Stats are calculated on-the-fly from valid matches (status `confirmed_appealable` or `locked`). Cancelled and fraudulent matches are excluded.

Per player:
| Stat | Description |
|---|---|
| Total | All valid matches played |
| Wins / Draws / Losses | Derived from `winner_id` and `is_draw` |
| Goals Scored / Conceded | From the player's perspective (A or B side) |
| Goal Difference | Goals scored − Goals conceded |
| Win Rate | Wins ÷ Total × 100 |
| Recent Form | Last 5 matches as W/D/L sequence (oldest → newest) |

**Leaderboard sort order:** Wins → Goal Difference → Goals Scored → Name (deterministic tiebreak)

---

### Comments

- Any active player can comment on any visible match.
- Empty comments are blocked client-side and server-side.
- Authors can soft-delete their own comments (shown as "Comment deleted").
- Admins and moderators can soft-delete any comment.
- Deleted comments are never hard-deleted — they stay as tombstones.
- Both match participants receive a notification when someone comments, except the commenter.

---

### Notifications

Sent automatically for:
| Event | Recipients |
|---|---|
| Match recorded | Both player A and player B |
| Comment added | Both participants, minus the commenter |
| Match locked | Both player A and player B |

- Notifications are linked to the relevant match (clickable → match detail).
- Unread notifications show as a blue dot and increment the bell badge on the top bar.
- "Mark all read" button on the dashboard.

---

## What Is Intentionally Not Built in Phase 2

| Feature | Phase |
|---|---|
| Full appeal form and resolution | Phase 3 |
| Elo / ranking points | Phase 3 |
| Tournaments and championships | Phase 4+ |
| Evidence / screenshot uploads | Phase 3 |
| Belts and achievements | Phase 4+ |
| Social feeds | Not planned |

---

## How Login Works

1. Player enters their access code on `/login`.
2. The server `bcrypt.compare`s against all active profile hashes.
3. On match, a 30-day HMAC-signed session token is issued via `httpOnly` cookie.
4. All DB access uses the Supabase service-role client — no RLS policies needed.
5. Raw access codes are never stored.

---

## Admin Capabilities

| Action | super_admin | moderator |
|---|---|---|
| Create / edit players | ✅ | ✅ (players only) |
| Review profile change requests | ✅ | ✅ |
| Soft-delete any comment | ✅ | ✅ |
| Trigger match lock endpoint | ✅ | ✅ |

---

## Security Notes

- Winner/draw logic is derived server-side — clients cannot submit forged winner IDs.
- DB-level CHECK constraints enforce score/winner/draw consistency as a backstop.
- A separate DB constraint prevents self-matches even if the action-layer check is bypassed.
- Access codes are bcrypt-hashed (12 rounds). Session tokens are HMAC-SHA256 signed.
- `SUPABASE_SERVICE_ROLE_KEY` is never in client bundles.
- All permission checks are server-side.
- The lock-expired endpoint is optionally secured with a `CRON_SECRET` bearer token.
