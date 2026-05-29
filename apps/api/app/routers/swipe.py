"""Swipe voting routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.auth import get_current_participant
from app.core.database import get_db
from app.models import orm
from app.models.schemas import CastVote, SongOut, SwipeNextResponse, SwipeVoteOut

router = APIRouter(prefix="/swipe", tags=["swipe"])


def _get_setting(db: Session, key: str) -> str | None:
    row = db.execute(
        select(orm.CampaignSetting).where(orm.CampaignSetting.key == key)
    ).scalar_one_or_none()
    return row.value if row else None


@router.get("/next", response_model=SwipeNextResponse)
def get_next_batch(
    db: Session = Depends(get_db),
    current: orm.Participant = Depends(get_current_participant),
):
    if _get_setting(db, "swipe_open") == "false":
        raise HTTPException(status_code=403, detail="Swipe voting is closed")

    voted_ids = db.execute(
        select(orm.SwipeVote.song_id).where(
            orm.SwipeVote.participant_id == current.id
        )
    ).scalars().all()

    submitted_song_ids = db.execute(
        select(orm.Submission.song_id).where(
            orm.Submission.participant_id == current.id,
            orm.Submission.active == True,
        )
    ).scalars().all()

    query = (
        select(orm.Song)
        .where(
            orm.Song.status.in_(["approved", "pending"]),
            orm.Song.id.not_in(voted_ids) if voted_ids else True,
        )
        .order_by(
            orm.Song.krml_seeded.desc(),
            orm.Song.dj_pick.desc(),
            orm.Song.created_at.asc(),
        )
        .limit(10)
    )
    songs = db.execute(query).scalars().all()

    total_remaining = db.execute(
        select(func.count(orm.Song.id)).where(
            orm.Song.status.in_(["approved", "pending"]),
            orm.Song.id.not_in(voted_ids) if voted_ids else True,
        )
    ).scalar_one()

    return SwipeNextResponse(
        songs=[SongOut.model_validate(s) for s in songs],
        total_remaining=total_remaining,
    )


@router.post("/vote", response_model=SwipeVoteOut)
def cast_vote(
    body: CastVote,
    db: Session = Depends(get_db),
    current: orm.Participant = Depends(get_current_participant),
):
    if _get_setting(db, "swipe_open") == "false":
        raise HTTPException(status_code=403, detail="Swipe voting is closed")

    song = db.get(orm.Song, body.song_id)
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")

    existing = db.execute(
        select(orm.SwipeVote).where(
            orm.SwipeVote.participant_id == current.id,
            orm.SwipeVote.song_id == body.song_id,
        )
    ).scalar_one_or_none()

    if existing:
        existing.vote = body.vote
        db.commit()
        db.refresh(existing)
        return SwipeVoteOut.model_validate(existing)

    vote = orm.SwipeVote(
        participant_id=current.id,
        song_id=body.song_id,
        vote=body.vote,
    )
    db.add(vote)
    db.commit()
    db.refresh(vote)
    return SwipeVoteOut.model_validate(vote)
