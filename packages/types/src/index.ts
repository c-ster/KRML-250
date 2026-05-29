// KRML 250 — Shared TypeScript Types

export type Town =
  | "carmel"
  | "monterey"
  | "pacific_grove"
  | "seaside"
  | "marina"
  | "salinas"
  | "santa_cruz"
  | "watsonville"
  | "castroville"
  | "other";

export type SongStatus = "pending" | "approved" | "excluded" | "needs_review";
export type SwipeVote = "yes" | "no" | "unknown";
export type DefenseApprovalStatus = "pending" | "approved" | "rejected";

export interface Participant {
  id: string;
  name: string;
  email: string;
  email_verified_at: string | null;
  city: string;
  zip: string;
  town: Town;
  consent_campaign_rules: boolean;
  consent_publish_submission: boolean;
  has_used_edit: boolean;
  created_at: string;
  updated_at: string;
}

export interface Song {
  id: string;
  canonical_title: string;
  canonical_artist: string;
  normalized_title: string;
  normalized_artist: string;
  decade: string | null;
  release_year: number | null;
  town_tag: string | null;
  aaa_fit_score: number | null;
  krml_seeded: boolean;
  dj_pick: boolean;
  status: SongStatus;
  created_at: string;
  updated_at: string;
}

export interface SongSearchResult {
  id: string;
  canonical_title: string;
  canonical_artist: string;
  decade: string | null;
  release_year: number | null;
}

export interface Submission {
  id: string;
  participant_id: string;
  song_id: string;
  song?: Song;
  submission_slot: 1 | 2 | 3;
  why_text: string;
  town_tag: string | null;
  decade_tag: string | null;
  active: boolean;
  original_submission_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Prediction {
  id: string;
  participant_id: string;
  song_1_id: string;
  song_2_id: string;
  song_3_id: string;
  song_4_id: string;
  song_5_id: string;
  song_1?: Song;
  song_2?: Song;
  song_3?: Song;
  song_4?: Song;
  song_5?: Song;
  created_at: string;
  updated_at: string;
  locked_at: string | null;
}

export interface LeaderboardSong {
  song: Song;
  nomination_count: number;
  yes_votes: number;
  no_votes: number;
  approved_defenses: number;
  score: number;
  rank: number | null;
}

export interface TownLeaderboardEntry {
  town: Town;
  song_count: number;
  top_songs: SongSearchResult[];
}

export interface DecadeLeaderboardEntry {
  decade: string;
  song_count: number;
  nomination_count: number;
  top_songs: SongSearchResult[];
}

export interface SongRanking {
  rank: number;
  song: Song;
  score: number;
  score_components: {
    nomination_score: number;
    swipe_score: number;
    editorial_score: number;
    defense_score: number;
    balance_score: number;
    weighted_total: number;
  };
  nomination_count: number;
  yes_votes: number;
  no_votes: number;
  approved_defenses: number;
}

export interface CampaignSetting {
  id: string;
  key: string;
  value: string;
  updated_at: string;
}

export interface AdminMetrics {
  total_participants: number;
  verified_participants: number;
  total_songs: number;
  total_submissions: number;
  total_swipe_votes: number;
  total_defenses: number;
  pending_defenses: number;
  total_predictions: number;
  nominations_open: boolean;
  swipe_open: boolean;
  predictions_open: boolean;
  results_published: boolean;
  top5_revealed: boolean;
}
