"""SQLAlchemy ORM models for KRML 250."""
import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def new_uuid() -> str:
    return str(uuid.uuid4())


class TownEnum(str, enum.Enum):
    carmel = "carmel"
    monterey = "monterey"
    pacific_grove = "pacific_grove"
    seaside = "seaside"
    marina = "marina"
    salinas = "salinas"
    santa_cruz = "santa_cruz"
    watsonville = "watsonville"
    castroville = "castroville"
    other = "other"


class SongStatusEnum(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    excluded = "excluded"
    needs_review = "needs_review"


class SwipeVoteEnum(str, enum.Enum):
    yes = "yes"
    no = "no"
    unknown = "unknown"


class DefenseStatusEnum(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class Participant(Base):
    __tablename__ = "participants"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_uuid)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False)
    email_verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    city: Mapped[str] = mapped_column(String(200), nullable=False)
    zip: Mapped[str] = mapped_column(String(20), nullable=False)
    town: Mapped[TownEnum] = mapped_column(Enum(TownEnum), nullable=False)
    consent_campaign_rules: Mapped[bool] = mapped_column(Boolean, default=False)
    consent_publish_submission: Mapped[bool] = mapped_column(Boolean, default=False)
    verification_token: Mapped[str | None] = mapped_column(String(200), nullable=True)
    verification_token_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    has_used_edit: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )

    submissions: Mapped[list["Submission"]] = relationship(back_populates="participant")
    swipe_votes: Mapped[list["SwipeVote"]] = relationship(back_populates="participant")
    defenses: Mapped[list["SongDefense"]] = relationship(back_populates="participant")
    prediction: Mapped["Prediction | None"] = relationship(back_populates="participant")


class Song(Base):
    __tablename__ = "songs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_uuid)
    canonical_title: Mapped[str] = mapped_column(String(500), nullable=False)
    canonical_artist: Mapped[str] = mapped_column(String(500), nullable=False)
    normalized_title: Mapped[str] = mapped_column(String(500), nullable=False)
    normalized_artist: Mapped[str] = mapped_column(String(500), nullable=False)
    decade: Mapped[str | None] = mapped_column(String(20), nullable=True)
    release_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    town_tag: Mapped[str | None] = mapped_column(String(100), nullable=True)
    aaa_fit_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    krml_seeded: Mapped[bool] = mapped_column(Boolean, default=False)
    dj_pick: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[SongStatusEnum] = mapped_column(
        Enum(SongStatusEnum), default=SongStatusEnum.pending
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )

    aliases: Mapped[list["SongAlias"]] = relationship(back_populates="song")
    submissions: Mapped[list["Submission"]] = relationship(back_populates="song")
    swipe_votes: Mapped[list["SwipeVote"]] = relationship(back_populates="song")
    defenses: Mapped[list["SongDefense"]] = relationship(back_populates="song")
    dj_notes: Mapped[list["DJNote"]] = relationship(back_populates="song")


class SongAlias(Base):
    __tablename__ = "song_aliases"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_uuid)
    song_id: Mapped[str] = mapped_column(ForeignKey("songs.id"), nullable=False)
    submitted_title: Mapped[str] = mapped_column(String(500), nullable=False)
    submitted_artist: Mapped[str] = mapped_column(String(500), nullable=False)
    normalized_title: Mapped[str] = mapped_column(String(500), nullable=False)
    normalized_artist: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow
    )

    song: Mapped["Song"] = relationship(back_populates="aliases")


class Submission(Base):
    __tablename__ = "submissions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_uuid)
    participant_id: Mapped[str] = mapped_column(
        ForeignKey("participants.id"), nullable=False
    )
    song_id: Mapped[str] = mapped_column(ForeignKey("songs.id"), nullable=False)
    submission_slot: Mapped[int] = mapped_column(Integer, nullable=False)
    why_text: Mapped[str] = mapped_column(Text, nullable=False)
    town_tag: Mapped[str | None] = mapped_column(String(100), nullable=True)
    decade_tag: Mapped[str | None] = mapped_column(String(20), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    original_submission_id: Mapped[str | None] = mapped_column(
        ForeignKey("submissions.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )

    participant: Mapped["Participant"] = relationship(back_populates="submissions")
    song: Mapped["Song"] = relationship(back_populates="submissions")


class SubmissionEdit(Base):
    __tablename__ = "submission_edits"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_uuid)
    participant_id: Mapped[str] = mapped_column(
        ForeignKey("participants.id"), nullable=False
    )
    original_submission_id: Mapped[str] = mapped_column(
        ForeignKey("submissions.id"), nullable=False
    )
    replacement_submission_id: Mapped[str] = mapped_column(
        ForeignKey("submissions.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow
    )


class SwipeVote(Base):
    __tablename__ = "swipe_votes"
    __table_args__ = (UniqueConstraint("participant_id", "song_id"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_uuid)
    participant_id: Mapped[str] = mapped_column(
        ForeignKey("participants.id"), nullable=False
    )
    song_id: Mapped[str] = mapped_column(ForeignKey("songs.id"), nullable=False)
    vote: Mapped[SwipeVoteEnum] = mapped_column(Enum(SwipeVoteEnum), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )

    participant: Mapped["Participant"] = relationship(back_populates="swipe_votes")
    song: Mapped["Song"] = relationship(back_populates="swipe_votes")


class SongDefense(Base):
    __tablename__ = "song_defenses"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_uuid)
    participant_id: Mapped[str] = mapped_column(
        ForeignKey("participants.id"), nullable=False
    )
    song_id: Mapped[str] = mapped_column(ForeignKey("songs.id"), nullable=False)
    defense_text: Mapped[str] = mapped_column(String(500), nullable=False)
    approval_status: Mapped[DefenseStatusEnum] = mapped_column(
        Enum(DefenseStatusEnum), default=DefenseStatusEnum.pending
    )
    approved_excerpt: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )

    participant: Mapped["Participant"] = relationship(back_populates="defenses")
    song: Mapped["Song"] = relationship(back_populates="defenses")


class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_uuid)
    participant_id: Mapped[str] = mapped_column(
        ForeignKey("participants.id"), unique=True, nullable=False
    )
    song_1_id: Mapped[str] = mapped_column(ForeignKey("songs.id"), nullable=False)
    song_2_id: Mapped[str] = mapped_column(ForeignKey("songs.id"), nullable=False)
    song_3_id: Mapped[str] = mapped_column(ForeignKey("songs.id"), nullable=False)
    song_4_id: Mapped[str] = mapped_column(ForeignKey("songs.id"), nullable=False)
    song_5_id: Mapped[str] = mapped_column(ForeignKey("songs.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )
    locked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    participant: Mapped["Participant"] = relationship(back_populates="prediction")


class DJNote(Base):
    __tablename__ = "dj_notes"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_uuid)
    dj_name: Mapped[str] = mapped_column(String(200), nullable=False)
    song_id: Mapped[str] = mapped_column(ForeignKey("songs.id"), nullable=False)
    note: Mapped[str] = mapped_column(Text, nullable=False)
    display_publicly: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )

    song: Mapped["Song"] = relationship(back_populates="dj_notes")


class SponsorPlacement(Base):
    __tablename__ = "sponsor_placements"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_uuid)
    sponsor_name: Mapped[str] = mapped_column(String(300), nullable=False)
    placement_type: Mapped[str] = mapped_column(String(100), nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    link_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    starts_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    ends_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )


class CampaignSetting(Base):
    __tablename__ = "campaign_settings"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_uuid)
    key: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )
