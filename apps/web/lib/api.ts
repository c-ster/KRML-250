/**
 * Typed API client for KRML 250.
 * All requests go through /api/v1/* which Next.js rewrites to the FastAPI backend.
 */

const BASE = "/api/v1";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("krml250_token");
}

function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("krml250_admin_token");
}

async function request<T>(
  path: string,
  options: RequestInit & { admin?: boolean } = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const token = getToken();
  if (token && !options.admin) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const adminToken = getAdminToken();
  if (options.admin && adminToken) {
    headers["X-Admin-Token"] = adminToken;
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(res.status, err.detail || "Request failed");
  }

  // Handle CSV responses
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("text/csv")) {
    return (await res.text()) as unknown as T;
  }

  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string
  ) {
    super(detail);
    this.name = "ApiError";
  }
}

// ─── Participants ─────────────────────────────────────────────────────────────

export const participantsApi = {
  register: (body: {
    name: string;
    email: string;
    city: string;
    zip: string;
    town: string;
    consent_campaign_rules: boolean;
    consent_publish_submission: boolean;
  }) => request<{ id: string; email: string }>("/participants", { method: "POST", body: JSON.stringify(body) }),

  verify: (token: string) =>
    request<{ access_token: string; token_type: string; participant: Participant }>(
      "/participants/verify",
      { method: "POST", body: JSON.stringify({ token }) }
    ),

  me: () => request<Participant>("/participants/me"),
};

// ─── Songs ────────────────────────────────────────────────────────────────────

export const songsApi = {
  search: (q: string) =>
    request<SongSearchResult[]>(`/songs/search?q=${encodeURIComponent(q)}`),
  get: (id: string) => request<Song>(`/songs/${id}`),
};

// ─── Submissions ──────────────────────────────────────────────────────────────

export const submissionsApi = {
  submit: (songs: SubmissionSong[]) =>
    request<Submission[]>("/submissions", {
      method: "POST",
      body: JSON.stringify({ songs }),
    }),
  mine: () => request<Submission[]>("/submissions/mine"),
  edit: (body: {
    replace_slot: number;
    song_id: string;
    why_text: string;
    town_tag?: string;
    decade_tag?: string;
  }) =>
    request<Submission>("/submissions/edit", {
      method: "PUT",
      body: JSON.stringify(body),
    }),
};

// ─── Swipe ────────────────────────────────────────────────────────────────────

export const swipeApi = {
  next: () => request<{ songs: Song[]; total_remaining: number }>("/swipe/next"),
  vote: (song_id: string, vote: "yes" | "no" | "unknown") =>
    request<{ id: string }>("/swipe/vote", {
      method: "POST",
      body: JSON.stringify({ song_id, vote }),
    }),
};

// ─── Defenses ─────────────────────────────────────────────────────────────────

export const defensesApi = {
  submit: (song_id: string, defense_text: string) =>
    request<Defense>("/defenses", {
      method: "POST",
      body: JSON.stringify({ song_id, defense_text }),
    }),
  mine: () => request<Defense[]>("/defenses/mine"),
};

// ─── Predictions ──────────────────────────────────────────────────────────────

export const predictionsApi = {
  submit: (ids: [string, string, string, string, string]) =>
    request<Prediction>("/predictions", {
      method: "POST",
      body: JSON.stringify({
        song_1_id: ids[0],
        song_2_id: ids[1],
        song_3_id: ids[2],
        song_4_id: ids[3],
        song_5_id: ids[4],
      }),
    }),
  update: (ids: [string, string, string, string, string]) =>
    request<Prediction>("/predictions", {
      method: "PUT",
      body: JSON.stringify({
        song_1_id: ids[0],
        song_2_id: ids[1],
        song_3_id: ids[2],
        song_4_id: ids[3],
        song_5_id: ids[4],
      }),
    }),
  mine: () => request<Prediction>("/predictions/mine"),
};

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export const leaderboardApi = {
  songs: (page = 1, perPage = 25) =>
    request<LeaderboardSong[]>(`/leaderboard/songs?page=${page}&per_page=${perPage}`),
  towns: () => request<TownEntry[]>("/leaderboard/towns"),
  decades: () => request<DecadeEntry[]>("/leaderboard/decades"),
  djPicks: () => request<Song[]>("/leaderboard/dj-picks"),
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const adminApi = {
  metrics: () => request<AdminMetrics>("/admin/metrics", { admin: true }),

  participants: (skip = 0, limit = 50, q?: string) => {
    const params = new URLSearchParams({ skip: String(skip), limit: String(limit) });
    if (q) params.set("q", q);
    return request<Participant[]>(`/admin/participants?${params}`, { admin: true });
  },

  songs: (skip = 0, limit = 50, q?: string) => {
    const params = new URLSearchParams({ skip: String(skip), limit: String(limit) });
    if (q) params.set("q", q);
    return request<Song[]>(`/admin/songs?${params}`, { admin: true });
  },
  updateSong: (id: string, body: Partial<Song>) =>
    request<Song>(`/admin/songs/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
      admin: true,
    }),
  mergeSongs: (keep_song_id: string, merge_song_id: string) =>
    request<Song>("/admin/songs/merge", {
      method: "POST",
      body: JSON.stringify({ keep_song_id, merge_song_id }),
      admin: true,
    }),

  submissions: (skip = 0, limit = 50, q?: string) => {
    const params = new URLSearchParams({ skip: String(skip), limit: String(limit) });
    if (q) params.set("q", q);
    return request<Submission[]>(`/admin/submissions?${params}`, { admin: true });
  },

  defenses: (status?: string, skip = 0, limit = 50) => {
    const params = new URLSearchParams({ skip: String(skip), limit: String(limit) });
    if (status) params.set("status", status);
    return request<Defense[]>(`/admin/defenses?${params}`, { admin: true });
  },
  updateDefense: (id: string, approval_status: string, approved_excerpt?: string) =>
    request<Defense>(`/admin/defenses/${id}`, {
      method: "PUT",
      body: JSON.stringify({ approval_status, approved_excerpt }),
      admin: true,
    }),

  swipeVotes: () => request<SwipeVoteSummary[]>("/admin/swipe-votes", { admin: true }),
  predictions: (skip = 0, limit = 25) =>
    request<Prediction[]>(`/admin/predictions?skip=${skip}&limit=${limit}`, { admin: true }),

  djNotes: () => request<DJNote[]>("/admin/dj-notes", { admin: true }),
  createDJNote: (body: { dj_name: string; song_id: string; note: string; display_publicly: boolean }) =>
    request<DJNote>("/admin/dj-notes", {
      method: "POST",
      body: JSON.stringify(body),
      admin: true,
    }),
  updateDJNote: (id: string, body: Partial<DJNote>) =>
    request<DJNote>(`/admin/dj-notes/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
      admin: true,
    }),

  sponsors: () => request<Sponsor[]>("/admin/sponsor-placements", { admin: true }),
  createSponsor: (body: Partial<Sponsor>) =>
    request<Sponsor>("/admin/sponsor-placements", {
      method: "POST",
      body: JSON.stringify(body),
      admin: true,
    }),
  updateSponsor: (id: string, body: Partial<Sponsor>) =>
    request<Sponsor>(`/admin/sponsor-placements/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
      admin: true,
    }),
  deleteSponsor: (id: string) =>
    request<void>(`/admin/sponsor-placements/${id}`, {
      method: "DELETE",
      admin: true,
    }),

  settings: () => request<CampaignSetting[]>("/admin/campaign-settings", { admin: true }),
  updateSetting: (key: string, value: string) =>
    request<CampaignSetting>(`/admin/campaign-settings/${key}`, {
      method: "PUT",
      body: JSON.stringify({ value }),
      admin: true,
    }),

  rankings: () => request<SongRanking[]>("/admin/rankings", { admin: true }),
  freezeRankings: () =>
    request<{ message: string; count: number }>("/admin/rankings/freeze", {
      method: "POST",
      admin: true,
    }),

  exportParticipants: () => request<string>("/admin/export/participants", { admin: true }),
  exportSubmissions: () => request<string>("/admin/export/submissions", { admin: true }),
  exportPredictions: () => request<string>("/admin/export/predictions", { admin: true }),
  exportRankings: () => request<string>("/admin/export/rankings", { admin: true }),
};

// ─── Shared Types (inline for client use) ────────────────────────────────────

export interface Participant {
  id: string;
  name: string;
  email: string;
  email_verified_at: string | null;
  city: string;
  zip: string;
  town: string;
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
  status: string;
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

export interface SubmissionSong {
  song_id: string;
  why_text: string;
  town_tag?: string;
  decade_tag?: string;
}

export interface Submission {
  id: string;
  participant_id: string;
  song_id: string;
  song?: Song;
  submission_slot: number;
  why_text: string;
  town_tag: string | null;
  decade_tag: string | null;
  active: boolean;
  original_submission_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Defense {
  id: string;
  participant_id: string;
  song_id: string;
  song?: Song;
  defense_text: string;
  approval_status: string;
  approved_excerpt: string | null;
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

export interface TownEntry {
  town: string;
  song_count: number;
  nomination_count: number;
  top_songs: SongSearchResult[];
}

export interface DecadeEntry {
  decade: string;
  song_count: number;
  nomination_count: number;
  top_songs: SongSearchResult[];
}

export interface DJNote {
  id: string;
  dj_name: string;
  song_id: string;
  song?: Song;
  note: string;
  display_publicly: boolean;
  created_at: string;
  updated_at: string;
}

export interface Sponsor {
  id: string;
  sponsor_name: string;
  placement_type: string;
  image_url: string | null;
  link_url: string | null;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
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

export interface SwipeVoteSummary {
  song_id: string;
  song_title: string;
  song_artist: string;
  yes: number;
  no: number;
  unknown: number;
}
