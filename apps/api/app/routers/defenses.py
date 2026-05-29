"""Song defense submission routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth import get_current_participant
from app.core.database import get_db
from app.models import orm
from app.models.schemas import DefenseOut, SubmitDefense

router = APIRouter(prefix="/defenses", tags=["defenses"])


@router.post("", response_model=DefenseOut, status_code=status.HTTP_201_CREATED)
def submit_defense(
    body: SubmitDefense,
    db: Session = Depends(get_db),
    current: orm.Participant = Depends(get_current_participant),
):
    song = db.get(orm.Song, body.song_id)
    if not song or song.status == "excluded":
        raise HTTPException(status_code=404, detail="Song not found")

    existing = db.execute(
        select(orm.SongDefense).where(
            orm.SongDefense.participant_id == current.id,
            orm.SongDefense.song_id == body.song_id,
        )
    ).scalar_one_or_none()

    if existing:
        existing.defense_text = body.defense_text
        existing.approval_status = "pending"
        db.commit()
        db.refresh(existing)
        return DefenseOut.model_validate(existing)

    defense = orm.SongDefense(
        participant_id=current.id,
        song_id=body.song_id,
        defense_text=body.defense_text,
        approval_status="pending",
    )
    db.add(defense)
    db.commit()
    db.refresh(defense)
    return DefenseOut.model_validate(defense)


@router.get("/mine", response_model=list[DefenseOut])
def my_defenses(
    db: Session = Depends(get_db),
    current: orm.Participant = Depends(get_current_participant),
):
    defenses = db.execute(
        select(orm.SongDefense).where(
            orm.SongDefense.participant_id == current.id
        )
    ).scalars().all()
    return [DefenseOut.model_validate(d) for d in defenses]
