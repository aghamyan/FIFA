// ─── Profile types ─────────────────────────────────────────────────────────
export type Role = 'super_admin' | 'moderator' | 'player'
export type ProfileStatus = 'active' | 'inactive' | 'restricted'
export type ChangeRequestStatus = 'pending' | 'approved' | 'rejected'

export interface Profile {
  id: string
  display_name: string
  nickname: string | null
  access_code_hash: string
  role: Role
  avatar_url: string | null
  favorite_team_id: string | null
  bio: string | null
  preferred_formation: string | null
  playing_style: string | null
  strongest_skill: string | null
  weak_skill: string | null
  status: ProfileStatus
  created_at: string
  updated_at: string
}

export interface FcTeam {
  id: string
  name: string
  short_name: string | null
  logo_url: string | null
  created_at: string
}

export interface Session {
  id: string
  profile_id: string
  token_hash: string
  expires_at: string
  created_at: string
}

export interface ProfileChangeRequest {
  id: string
  profile_id: string
  requested_changes: Record<string, unknown>
  status: ChangeRequestStatus
  admin_note: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

export interface Notification {
  id: string
  profile_id: string
  type: string
  title: string
  body: string | null
  is_read: boolean
  match_id: string | null
  created_at: string
}

// Safe profile shape exposed to the client (no hash)
export type SafeProfile = Omit<Profile, 'access_code_hash'>

// Profile with joined team data
export interface ProfileWithTeam extends SafeProfile {
  favorite_team?: FcTeam | null
}

// Profile change request with requester info
export interface ChangeRequestWithProfile extends ProfileChangeRequest {
  profile?: SafeProfile | null
}

// Editable fields a player can request to change
export interface ProfileChangePayload {
  nickname?: string
  bio?: string
  preferred_formation?: string
  playing_style?: string
  strongest_skill?: string
  weak_skill?: string
  favorite_team_id?: string
}

// ─── Match types ───────────────────────────────────────────────────────────
export type MatchType =
  | 'friendly'
  | 'league'
  | 'knockout'
  | 'group_stage'
  | 'title_challenge'
  | 'rivalry_series'
  | 'custom'

export type MatchStatus =
  | 'confirmed_appealable'
  | 'locked'
  | 'under_appeal'
  | 'cancelled'
  | 'fraudulent'

export interface Match {
  id: string
  match_type: MatchType
  status: MatchStatus
  player_a_id: string
  player_b_id: string
  player_a_score: number
  player_b_score: number
  winner_id: string | null
  is_draw: boolean
  player_a_team_id: string | null
  player_b_team_id: string | null
  submitted_by: string
  notes: string | null
  played_at: string
  appeal_deadline: string
  locked_at: string | null
  created_at: string
  updated_at: string
}

export interface MatchComment {
  id: string
  match_id: string
  author_id: string
  body: string
  created_at: string
  updated_at: string
  is_deleted: boolean
}

export interface MatchEvent {
  id: string
  match_id: string
  event_type: string
  actor_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

// Match with denormalized player/team data (assembled in JS from separate queries)
export interface MatchWithPlayers extends Match {
  player_a: SafeProfile
  player_b: SafeProfile
  player_a_team: FcTeam | null
  player_b_team: FcTeam | null
}

// Comment with author info
export interface MatchCommentWithAuthor extends MatchComment {
  author: SafeProfile | null
}

// ─── Stats types ───────────────────────────────────────────────────────────
export interface PlayerStats {
  total: number
  wins: number
  draws: number
  losses: number
  goals_scored: number
  goals_conceded: number
  goal_difference: number
  win_rate: number
  recent_form: ('W' | 'D' | 'L')[]
}

export interface LeaderboardEntry {
  profile: SafeProfile
  stats: PlayerStats
  rank: number
}
