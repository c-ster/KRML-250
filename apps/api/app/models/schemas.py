"""Pydantic schemas for KRML 250 API."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, field_validator


# ─── Participant ───────────────────────────────────────────────────────────────

class ParticipantOut(BaseModel):
    id: str
    name: str
    email: str
    email_verified_at: Optional[datetime]
    city: str
    zip: str
    town: str
    consent_campaign_rules: bool
    consent_publish_submission: bool
    has_used_edit: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ParticipantRegister(BaseModel):
    name: str
    email: str
    city: str
    zip: str
    town: str
    consent_campaign_rules: bool
    consent_publish_submission: bool

    @field_validator("consent_campaign_rules")
    @classmethod
    def must_consent(cls, v: bool) -> bool:
        if not v:
            raise ValueError("Must consent to campaign rules")
        return v


class ParticipantVerify(BaseModel):
    token: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    participant: ParticipantOut


# ─── Song ─────────────────────────────────────────────────────────────────────

class SongOut(BaseModel):
    id: str
    canonical_title: str
    canonical_artist: str
    normalized_title: str
    normalized_artist: str
    decade: Optional[str]
    release_year: Optional[int]
    town_tag: Optional[str]
    aaa_fit_score: Optional[int]
    krml_seeded: bool
    dj_pick: bool
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SongSearchResult(BaseModel):
    id: str
    canonical_title: str
    canonical_artist: str
    decade: Optional[str]
    release_year: Optional[int]

    model_config = {"from_attributes": True}


class SongUpdate(BaseModel):
    canonical_title: Optional[str] = None
    canonical_artist: Optional[str] = None
    decade: Optional[str] = None
    release_year: Optional[int] = None
    town_tag: Optional[str] = None
    aaa_fit_score: Optional[int] = None
    dj_pick: Optional[bool] = None
    status: Optional[str] = None
    krml_seeded: Optional[bool] = None


class MergeSongs(BaseModel):
    keep_song_id: str
    merge_song_id: str


# ─── Submission ────────────────────────────────────────────────────────────────

class SubmissionSong(BaseModel):
    song_id: str
    why_text: str
    town_tag: Optional[str] = None
    decade_tag: Optional[str] = None


class SubmitSongs(BaseModel):
    songs: list[SubmissionSong]

    @field_validator("songs")
    @classmethod
    def exactly_three(cls, v: list) -> list:
        if len(v) != 3:
            raise ValueError("Must submit exactly 3 songs")
        ids = [s.song_id for s in v]
        if len(set(ids)) != 3:
            raise ValueError("All 3 songs must be different")
        return v


class EditSubmission(BaseModel):
    replace_slot: int
    song_id: str
    why_text: str
    town_tag: Optional[str] = None
    decade_tag: Optional[str] = None

    @field_validator("replace_slot")
    @classmethod
    def valid_slot(cls, v: int) -> int:
        if v not in (1, 2, 3):
            raise ValueError("replace_slot must be 1, 2, or 3")
        return v


class SubmissionOut(BaseModel):
    id: str
    participant_id: str
    song_id: str
    song: Optional[SongOut] = None
    submission_slot: int
    why_text: str
    town_tag: Optional[str]
    decade_tag: Optional[str]
    active: bool
    original_submission_id: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─── Swipe Vote ───────────────────────────────────────────────────────────────

class CastVote(BaseModel):
    song_id: str
    vote: str

    @field_validator("vote")
    @classmethod
    def valid_vote(cls, v: str) -> str:
        if v not in ("yes", "no", "unknown"):
            raise ValueError("vote must be yes, no, or unknown")
        return v


class SwipeVoteOut(BaseModel):
    id: str
    participant_id: str
    song_id: str
    vote: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SwipeNextResponse(BaseModel):
    songs: list[SongOut]
    total_remaining: int


# ─── Defense ──────────────────────────────────────────────────────────────────

class SubmitDefense(BaseModel):
    song_id: str
    defense_text: str

    @field_validator("defense_text")
    @classmethod
    def max_length(cls, v: str) -> str:
        if len(v) > 500:
            raise ValueError("Defense text must be 500 characters or fewer")
        return v


class DefenseOut(BaseModel):
    id: str
    participant_id: str
    song_id: str
    song: Optional[SongOut] = None
    defense_text: str
    approval_status: str
    approved_excerpt: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AdminDefenseUpdate(BaseModel):
    approval_status: str
    approved_excerpt: Optional[str] = None

    @field_validator("approval_status")
    @classmethod
    def valid_status(cls, v: str) -> str:
        if v not in ("pending", "approved", "rejected"):
            raise ValueError("approval_status must be pending, approved, or rejected")
        return v


# ─── Prediction ───────────────────────────────────────────────────────────────

class SubmitPrediction(BaseModel):
    song_1_id: str
    song_2_id: str
    song_3_id: str
    song_4_id: str
    song_5_id: str

    @field_validator("song_5_id")
    @classmethod
    def no_duplicates(cls, v: str, info: any) -> str:
        ids = [
            info.data.get("song_1_id"),
            info.data.get("song_2_id"),
            info.data.get("song_3_id"),
            info.data.get("song_4_id"),
            v,
        ]
        ids_clean = [i for i in ids if i]
        if len(set(ids_clean)) != len(ids_clean):
            raise ValueError("All 5 prediction songs must be different")
        return v


class PredictionOut(BaseModel):
    id: str
    participant_id: str
    song_1_id: str
    song_2_id: str
    song_3_id: str
    song_4_id: str
    song_5_id: str
    song_1: Optional[SongOut] = None
    song_2: Optional[SongOut] = None
    song_3: Optional[SongOut] = None
    song_4: Optional[SongOut] = None
    song_5: Optional[SongOut] = None
    created_at: datetime
    updated_at: datetime
    locked_at: Optional[datetime]

    model_config = {"from_attributes": True}


# ─── DJ Notes ─────────────────────────────────────────────────────────────────

class DJNoteCreate(BaseModel):
    dj_name: str
    song_id: str
    note: str
    display_publicly: bool = False


class DJNoteUpdate(BaseModel):
    dj_name: Optional[str] = None
    note: Optional[str] = None
    display_publicly: Optional[bool] = None


class DJNoteOut(BaseModel):
    id: str
    dj_name: str
    song_id: str
    song: Optional[SongOut] = None
    note: str
    display_publicly: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─── Sponsor ──────────────────────────────────────────────────────────────────

class SponsorCreate(BaseModel):
    sponsor_name: str
    placement_type: str
    image_url: Optional[str] = None
    link_url: Optional[str] = None
    active: bool = True
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None


class SponsorUpdate(BaseModel):
    sponsor_name: Optional[str] = None
    placement_type: Optional[str] = None
    image_url: Optional[str] = None
    link_url: Optional[str] = None
    active: Optional[bool] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None


class SponsorOut(BaseModel):
    id: str
    sponsor_name: str
    placement_type: str
    image_url: Optional[str]
    link_url: Optional[str]
    active: bool
    starts_at: Optional[datetime]
    ends_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─── Campaign Settings ────────────────────────────────────────────────────────

class CampaignSettingOut(BaseModel):
    id: str
    key: str
    value: str
    updated_at: datetime

    model_config = {"from_attributes": True}


class CampaignSettingUpdate(BaseModel):
    value: str


# ─── Leaderboard ──────────────────────────────────────────────────────────────

class LeaderboardSong(BaseModel):
    song: SongOut
    nomination_count: int
    yes_votes: int
    no_votes: int
    approved_defenses: int
    score: float
    rank: Optional[int]  # null until reveal


class TownLeaderboardEntry(BaseModel):
    town: str
    song_count: int
    nomination_count: int
    top_songs: list[SongSearchResult]


class DecadeLeaderboardEntry(BaseModel):
    decade: str
    song_count: int
    nomination_count: int
    top_songs: list[SongSearchResult]


# ─── Admin ────────────────────────────────────────────────────────────────────

class AdminMetrics(BaseModel):
    total_participants: int
    verified_participants: int
    total_songs: int
    total_submissions: int
    total_swipe_votes: int
    total_defenses: int
    pending_defenses: int
    total_predictions: int
    nominations_open: bool
    swipe_open: bool
    predictions_open: bool
    results_published: bool
    top5_revealed: bool


class ScoreComponents(BaseModel):
    nomination_score: float
    swipe_score: float
    editorial_score: float
    defense_score: float
    balance_score: float
    weighted_total: float


class SongRanking(BaseModel):
    rank: int
    song: SongOut
    score: float
    score_components: ScoreComponents
    nomination_count: int
    yes_votes: int
    no_votes: int
    approved_defenses: int
