"""Song submission and one-time edit routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth import get_current_participant
from app.core.database import get_db
from app.models import orm
from app.models.schemas import EditSubmission, SubmissionOut, SubmitSongs

router = APIRouter(prefix="/submissions", tags=["submissions"])


def _get_setting(db: Session, key: str) -> str | None:
    row = db.execute(
        select(orm.CampaignSetting).where(orm.CampaignSetting.key == key)
    ).scalar_one_or_none()
    return row.value if row else None


@router.post("", response_model=list[SubmissionOut], status_code=status.HTTP_201_CREATED)
def submit_songs(
    body: SubmitSongs,
    db: Session = Depends(get_db),
    current: orm.Participant = Depends(get_current_participant),
):
    if _get_setting(db, "nominations_open") == "false":
        raise HTTPException(status_code=403, detail="Nominations are closed")

    existing = db.execute(
        select(orm.Submission).where(
            orm.Submission.participant_id == current.id,
            orm.Submission.active == True,
        )
    ).scalars().all()
    if existing:
        raise HTTPException(
            status_code=409,
            detail="You have already submitted. Use /submissions/edit to make changes.",
        )

    created = []
    for i, song_req in enumerate(body.songs, start=1):
        song = db.get(orm.Song, song_req.song_id)
        if not song or song.status == "excluded":
            raise HTTPException(
                status_code=404, detail=f"Song {song_req.song_id} not found"
            )
        sub = orm.Submission(
            participant_id=current.id,
            song_id=song_req.song_id,
            submission_slot=i,
            why_text=song_req.why_text,
            town_tag=song_req.town_tag,
            decade_tag=song_req.decade_tag,
            active=True,
        )
        db.add(sub)
        created.append(sub)

    db.commit()
    for s in created:
        db.refresh(s)
    return [SubmissionOut.model_validate(s) for s in created]


@router.get("/mine", response_model=list[SubmissionOut])
def my_submissions(
    db: Session = Depends(get_db),
    current: orm.Participant = Depends(get_current_participant),
):
    subs = db.execute(
        select(orm.Submission).where(
            orm.Submission.participant_id == current.id,
            orm.Submission.active == True,
        )
    ).scalars().all()
    return [SubmissionOut.model_validate(s) for s in subs]


@router.put("/edit", response_model=SubmissionOut)
def edit_submission(
    body: EditSubmission,
    db: Session = Depends(get_db),
    current: orm.Participant = Depends(get_current_participant),
):
    if _get_setting(db, "nominations_open") == "false":
        raise HTTPException(status_code=403, detail="Nominations are closed")

    if current.has_used_edit:
        raise HTTPException(
            status_code=403, detail="You have already used your one-time edit"
        )

    original = db.execute(
        select(orm.Submission).where(
            orm.Submission.participant_id == current.id,
            orm.Submission.submission_slot == body.replace_slot,
            orm.Submission.active == True,
        )
    ).scalar_one_or_none()
    if not original:
        raise HTTPException(
            status_code=404, detail=f"No active submission in slot {body.replace_slot}"
        )

    new_song = db.get(orm.Song, body.song_id)
    if not new_song or new_song.status == "excluded":
        raise HTTPException(status_code=404, detail="Replacement song not found")

    original.active = False

    replacement = orm.Submission(
        participant_id=current.id,
        song_id=body.song_id,
        submission_slot=body.replace_slot,
        why_text=body.why_text,
        town_tag=body.town_tag,
        decade_tag=body.decade_tag,
        active=True,
        original_submission_id=original.id,
    )
    db.add(replacement)

    edit_record = orm.SubmissionEdit(
        participant_id=current.id,
        original_submission_id=original.id,
        replacement_submission_id=replacement.id,
    )
    db.add(edit_record)

    current.has_used_edit = True
    db.commit()
    db.refresh(replacement)

    return SubmissionOut.model_validate(replacement)
