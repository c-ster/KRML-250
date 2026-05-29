"""Top-5 prediction routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth import get_current_participant
from app.core.database import get_db
from app.models import orm
from app.models.schemas import PredictionOut, SubmitPrediction

router = APIRouter(prefix="/predictions", tags=["predictions"])


def _get_setting(db: Session, key: str) -> str | None:
    row = db.execute(
        select(orm.CampaignSetting).where(orm.CampaignSetting.key == key)
    ).scalar_one_or_none()
    return row.value if row else None


def _validate_song_ids(db: Session, ids: list[str]) -> None:
    for sid in ids:
        song = db.get(orm.Song, sid)
        if not song or song.status == "excluded":
            raise HTTPException(status_code=404, detail=f"Song {sid} not found")


@router.post("", response_model=PredictionOut, status_code=status.HTTP_201_CREATED)
def submit_prediction(
    body: SubmitPrediction,
    db: Session = Depends(get_db),
    current: orm.Participant = Depends(get_current_participant),
):
    if _get_setting(db, "predictions_open") == "false":
        raise HTTPException(status_code=403, detail="Predictions are closed")

    existing = db.execute(
        select(orm.Prediction).where(
            orm.Prediction.participant_id == current.id
        )
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=409, detail="You already have a prediction. Use PUT to update."
        )

    _validate_song_ids(
        db,
        [body.song_1_id, body.song_2_id, body.song_3_id, body.song_4_id, body.song_5_id],
    )

    prediction = orm.Prediction(
        participant_id=current.id,
        song_1_id=body.song_1_id,
        song_2_id=body.song_2_id,
        song_3_id=body.song_3_id,
        song_4_id=body.song_4_id,
        song_5_id=body.song_5_id,
    )
    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    return PredictionOut.model_validate(prediction)


@router.put("", response_model=PredictionOut)
def update_prediction(
    body: SubmitPrediction,
    db: Session = Depends(get_db),
    current: orm.Participant = Depends(get_current_participant),
):
    if _get_setting(db, "predictions_open") == "false":
        raise HTTPException(status_code=403, detail="Predictions are closed")

    prediction = db.execute(
        select(orm.Prediction).where(
            orm.Prediction.participant_id == current.id
        )
    ).scalar_one_or_none()
    if not prediction:
        raise HTTPException(status_code=404, detail="No prediction found. Use POST to create.")

    if prediction.locked_at:
        raise HTTPException(status_code=403, detail="Your prediction is locked")

    _validate_song_ids(
        db,
        [body.song_1_id, body.song_2_id, body.song_3_id, body.song_4_id, body.song_5_id],
    )

    prediction.song_1_id = body.song_1_id
    prediction.song_2_id = body.song_2_id
    prediction.song_3_id = body.song_3_id
    prediction.song_4_id = body.song_4_id
    prediction.song_5_id = body.song_5_id
    db.commit()
    db.refresh(prediction)
    return PredictionOut.model_validate(prediction)


@router.get("/mine", response_model=PredictionOut)
def my_prediction(
    db: Session = Depends(get_db),
    current: orm.Participant = Depends(get_current_participant),
):
    prediction = db.execute(
        select(orm.Prediction).where(
            orm.Prediction.participant_id == current.id
        )
    ).scalar_one_or_none()
    if not prediction:
        raise HTTPException(status_code=404, detail="No prediction submitted yet")
    return PredictionOut.model_validate(prediction)
