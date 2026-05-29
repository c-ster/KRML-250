"""Admin-only routes (requires X-Admin-Token header)."""
import csv
import io
import json
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.auth import require_admin
from app.core.database import get_db
from app.models import orm
from app.models.schemas import (
    AdminDefenseUpdate,
    AdminMetrics,
    CampaignSettingOut,
    CampaignSettingUpdate,
    DefenseOut,
    DJNoteCreate,
    DJNoteOut,
    DJNoteUpdate,
    MergeSongs,
    ParticipantOut,
    PredictionOut,
    SongOut,
    SongRanking,
    SongUpdate,
    SponsorCreate,
    SponsorOut,
    SponsorUpdate,
    SubmissionOut,
    SwipeVoteOut,
)
from app.services.ranking import compute_rankings

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


def _setting_bool(db: Session, key: str) -> bool:
    row = db.execute(
        select(orm.CampaignSetting).where(orm.CampaignSetting.key == key)
    ).scalar_one_or_none()
    return row is not None and row.value.lower() == "true"


def normalize(s: str) -> str:
    return s.strip().lower()


# ─── Metrics ──────────────────────────────────────────────────────────────────

@router.get("/metrics", response_model=AdminMetrics)
def metrics(db: Session = Depends(get_db)):
    total_p = db.execute(select(func.count(orm.Participant.id))).scalar_one()
    verified_p = db.execute(
        select(func.count(orm.Participant.id)).where(
            orm.Participant.email_verified_at.isnot(None)
        )
    ).scalar_one()
    total_s = db.execute(select(func.count(orm.Song.id))).scalar_one()
    total_sub = db.execute(
        select(func.count(orm.Submission.id)).where(orm.Submission.active == True)
    ).scalar_one()
    total_votes = db.execute(select(func.count(orm.SwipeVote.id))).scalar_one()
    total_def = db.execute(select(func.count(orm.SongDefense.id))).scalar_one()
    pending_def = db.execute(
        select(func.count(orm.SongDefense.id)).where(
            orm.SongDefense.approval_status == "pending"
        )
    ).scalar_one()
    total_pred = db.execute(select(func.count(orm.Prediction.id))).scalar_one()

    return AdminMetrics(
        total_participants=total_p,
        verified_participants=verified_p,
        total_songs=total_s,
        total_submissions=total_sub,
        total_swipe_votes=total_votes,
        total_defenses=total_def,
        pending_defenses=pending_def,
        total_predictions=total_pred,
        nominations_open=_setting_bool(db, "nominations_open"),
        swipe_open=_setting_bool(db, "swipe_open"),
        predictions_open=_setting_bool(db, "predictions_open"),
        results_published=_setting_bool(db, "results_published"),
        top5_revealed=_setting_bool(db, "top5_revealed"),
    )


# ─── Participants ─────────────────────────────────────────────────────────────

@router.get("/participants", response_model=list[ParticipantOut])
def list_participants(
    skip: int = 0, limit: int = 100, db: Session = Depends(get_db)
):
    participants = db.execute(
        select(orm.Participant).order_by(orm.Participant.created_at.desc()).offset(skip).limit(limit)
    ).scalars().all()
    return [ParticipantOut.model_validate(p) for p in participants]


# ─── Songs ────────────────────────────────────────────────────────────────────

@router.get("/songs", response_model=list[SongOut])
def list_songs(skip: int = 0, limit: int = 200, db: Session = Depends(get_db)):
    songs = db.execute(
        select(orm.Song).order_by(orm.Song.canonical_title).offset(skip).limit(limit)
    ).scalars().all()
    return [SongOut.model_validate(s) for s in songs]


@router.put("/songs/{song_id}", response_model=SongOut)
def update_song(song_id: str, body: SongUpdate, db: Session = Depends(get_db)):
    song = db.get(orm.Song, song_id)
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(song, field, value)
    if body.canonical_title is not None:
        song.normalized_title = normalize(body.canonical_title)
    if body.canonical_artist is not None:
        song.normalized_artist = normalize(body.canonical_artist)
    db.commit()
    db.refresh(song)
    return SongOut.model_validate(song)


@router.post("/songs/merge", response_model=SongOut)
def merge_songs(body: MergeSongs, db: Session = Depends(get_db)):
    keep = db.get(orm.Song, body.keep_song_id)
    merge = db.get(orm.Song, body.merge_song_id)
    if not keep or not merge:
        raise HTTPException(status_code=404, detail="One or both songs not found")

    # Reassign submissions
    db.execute(
        select(orm.Submission).where(orm.Submission.song_id == merge.id)
    )
    for sub in db.execute(
        select(orm.Submission).where(orm.Submission.song_id == merge.id)
    ).scalars().all():
        sub.song_id = keep.id

    # Reassign swipe votes (deduplicate)
    for vote in db.execute(
        select(orm.SwipeVote).where(orm.SwipeVote.song_id == merge.id)
    ).scalars().all():
        existing = db.execute(
            select(orm.SwipeVote).where(
                orm.SwipeVote.participant_id == vote.participant_id,
                orm.SwipeVote.song_id == keep.id,
            )
        ).scalar_one_or_none()
        if not existing:
            vote.song_id = keep.id
        else:
            db.delete(vote)

    # Reassign defenses
    for d in db.execute(
        select(orm.SongDefense).where(orm.SongDefense.song_id == merge.id)
    ).scalars().all():
        d.song_id = keep.id

    # Add alias
    alias = orm.SongAlias(
        song_id=keep.id,
        submitted_title=merge.canonical_title,
        submitted_artist=merge.canonical_artist,
        normalized_title=merge.normalized_title,
        normalized_artist=merge.normalized_artist,
    )
    db.add(alias)
    db.delete(merge)
    db.commit()
    db.refresh(keep)
    return SongOut.model_validate(keep)


# ─── Submissions ──────────────────────────────────────────────────────────────

@router.get("/submissions", response_model=list[SubmissionOut])
def list_submissions(skip: int = 0, limit: int = 200, db: Session = Depends(get_db)):
    subs = db.execute(
        select(orm.Submission).order_by(orm.Submission.created_at.desc()).offset(skip).limit(limit)
    ).scalars().all()
    return [SubmissionOut.model_validate(s) for s in subs]


# ─── Defenses ─────────────────────────────────────────────────────────────────

@router.get("/defenses", response_model=list[DefenseOut])
def list_defenses(
    status: Optional[str] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)
):
    q = select(orm.SongDefense).order_by(orm.SongDefense.created_at.desc()).offset(skip).limit(limit)
    if status:
        q = q.where(orm.SongDefense.approval_status == status)
    defenses = db.execute(q).scalars().all()
    return [DefenseOut.model_validate(d) for d in defenses]


@router.put("/defenses/{defense_id}", response_model=DefenseOut)
def update_defense(
    defense_id: str, body: AdminDefenseUpdate, db: Session = Depends(get_db)
):
    defense = db.get(orm.SongDefense, defense_id)
    if not defense:
        raise HTTPException(status_code=404, detail="Defense not found")
    defense.approval_status = body.approval_status
    if body.approved_excerpt is not None:
        defense.approved_excerpt = body.approved_excerpt
    db.commit()
    db.refresh(defense)
    return DefenseOut.model_validate(defense)


# ─── Swipe Votes ──────────────────────────────────────────────────────────────

@router.get("/swipe-votes")
def swipe_vote_summary(db: Session = Depends(get_db)):
    rows = db.execute(
        select(
            orm.SwipeVote.song_id,
            orm.SwipeVote.vote,
            func.count(orm.SwipeVote.id).label("cnt"),
        )
        .group_by(orm.SwipeVote.song_id, orm.SwipeVote.vote)
    ).all()

    summary: dict = {}
    for r in rows:
        if r.song_id not in summary:
            song = db.get(orm.Song, r.song_id)
            summary[r.song_id] = {
                "song_id": r.song_id,
                "song_title": song.canonical_title if song else "Unknown",
                "song_artist": song.canonical_artist if song else "Unknown",
                "yes": 0,
                "no": 0,
                "unknown": 0,
            }
        summary[r.song_id][r.vote] = r.cnt

    return list(summary.values())


# ─── Predictions ──────────────────────────────────────────────────────────────

@router.get("/predictions", response_model=list[PredictionOut])
def list_predictions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    predictions = db.execute(
        select(orm.Prediction).order_by(orm.Prediction.created_at.desc()).offset(skip).limit(limit)
    ).scalars().all()
    return [PredictionOut.model_validate(p) for p in predictions]


# ─── DJ Notes ─────────────────────────────────────────────────────────────────

@router.get("/dj-notes", response_model=list[DJNoteOut])
def list_dj_notes(db: Session = Depends(get_db)):
    notes = db.execute(
        select(orm.DJNote).order_by(orm.DJNote.created_at.desc())
    ).scalars().all()
    return [DJNoteOut.model_validate(n) for n in notes]


@router.post("/dj-notes", response_model=DJNoteOut, status_code=201)
def create_dj_note(body: DJNoteCreate, db: Session = Depends(get_db)):
    song = db.get(orm.Song, body.song_id)
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    note = orm.DJNote(**body.model_dump())
    db.add(note)
    db.commit()
    db.refresh(note)
    return DJNoteOut.model_validate(note)


@router.put("/dj-notes/{note_id}", response_model=DJNoteOut)
def update_dj_note(note_id: str, body: DJNoteUpdate, db: Session = Depends(get_db)):
    note = db.get(orm.DJNote, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(note, field, value)
    db.commit()
    db.refresh(note)
    return DJNoteOut.model_validate(note)


# ─── Sponsors ─────────────────────────────────────────────────────────────────

@router.get("/sponsor-placements", response_model=list[SponsorOut])
def list_sponsors(db: Session = Depends(get_db)):
    sponsors = db.execute(
        select(orm.SponsorPlacement).order_by(orm.SponsorPlacement.created_at.desc())
    ).scalars().all()
    return [SponsorOut.model_validate(s) for s in sponsors]


@router.post("/sponsor-placements", response_model=SponsorOut, status_code=201)
def create_sponsor(body: SponsorCreate, db: Session = Depends(get_db)):
    sponsor = orm.SponsorPlacement(**body.model_dump())
    db.add(sponsor)
    db.commit()
    db.refresh(sponsor)
    return SponsorOut.model_validate(sponsor)


@router.put("/sponsor-placements/{sponsor_id}", response_model=SponsorOut)
def update_sponsor(
    sponsor_id: str, body: SponsorUpdate, db: Session = Depends(get_db)
):
    sponsor = db.get(orm.SponsorPlacement, sponsor_id)
    if not sponsor:
        raise HTTPException(status_code=404, detail="Sponsor not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(sponsor, field, value)
    db.commit()
    db.refresh(sponsor)
    return SponsorOut.model_validate(sponsor)


@router.delete("/sponsor-placements/{sponsor_id}", status_code=204)
def delete_sponsor(sponsor_id: str, db: Session = Depends(get_db)):
    sponsor = db.get(orm.SponsorPlacement, sponsor_id)
    if not sponsor:
        raise HTTPException(status_code=404, detail="Sponsor not found")
    db.delete(sponsor)
    db.commit()


# ─── Campaign Settings ────────────────────────────────────────────────────────

@router.get("/campaign-settings", response_model=list[CampaignSettingOut])
def list_settings(db: Session = Depends(get_db)):
    settings = db.execute(
        select(orm.CampaignSetting).order_by(orm.CampaignSetting.key)
    ).scalars().all()
    return [CampaignSettingOut.model_validate(s) for s in settings]


@router.put("/campaign-settings/{key}", response_model=CampaignSettingOut)
def update_setting(key: str, body: CampaignSettingUpdate, db: Session = Depends(get_db)):
    setting = db.execute(
        select(orm.CampaignSetting).where(orm.CampaignSetting.key == key)
    ).scalar_one_or_none()
    if not setting:
        setting = orm.CampaignSetting(key=key, value=body.value)
        db.add(setting)
    else:
        setting.value = body.value
    db.commit()
    db.refresh(setting)
    return CampaignSettingOut.model_validate(setting)


# ─── Rankings ─────────────────────────────────────────────────────────────────

@router.get("/rankings", response_model=list[SongRanking])
def admin_rankings(db: Session = Depends(get_db)):
    return compute_rankings(db)


@router.post("/rankings/freeze")
def freeze_rankings(db: Session = Depends(get_db)):
    rankings = compute_rankings(db)
    # Store frozen rankings in campaign_settings
    frozen = [
        {"rank": r.rank, "song_id": r.song.id, "score": r.score}
        for r in rankings
    ]
    setting = db.execute(
        select(orm.CampaignSetting).where(orm.CampaignSetting.key == "frozen_rankings")
    ).scalar_one_or_none()
    if not setting:
        setting = orm.CampaignSetting(key="frozen_rankings", value=json.dumps(frozen))
        db.add(setting)
    else:
        setting.value = json.dumps(frozen)
    db.commit()
    return {"message": f"Frozen rankings for {len(frozen)} songs", "count": len(frozen)}


# ─── CSV Exports ──────────────────────────────────────────────────────────────

def _csv_response(rows: list[dict], filename: str) -> StreamingResponse:
    if not rows:
        return StreamingResponse(io.StringIO(""), media_type="text/csv")
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=rows[0].keys())
    writer.writeheader()
    writer.writerows(rows)
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/export/participants")
def export_participants(db: Session = Depends(get_db)):
    participants = db.execute(select(orm.Participant)).scalars().all()
    rows = [
        {
            "id": p.id,
            "name": p.name,
            "email": p.email,
            "town": p.town,
            "city": p.city,
            "zip": p.zip,
            "verified": "yes" if p.email_verified_at else "no",
            "has_used_edit": p.has_used_edit,
            "created_at": p.created_at.isoformat(),
        }
        for p in participants
    ]
    return _csv_response(rows, "participants.csv")


@router.get("/export/submissions")
def export_submissions(db: Session = Depends(get_db)):
    subs = db.execute(
        select(orm.Submission, orm.Participant, orm.Song)
        .join(orm.Participant, orm.Submission.participant_id == orm.Participant.id)
        .join(orm.Song, orm.Submission.song_id == orm.Song.id)
        .where(orm.Submission.active == True)
    ).all()
    rows = [
        {
            "submission_id": s.id,
            "participant_name": p.name,
            "participant_email": p.email,
            "slot": s.submission_slot,
            "song_title": song.canonical_title,
            "song_artist": song.canonical_artist,
            "why_text": s.why_text,
            "town_tag": s.town_tag,
            "decade_tag": s.decade_tag,
            "created_at": s.created_at.isoformat(),
        }
        for s, p, song in subs
    ]
    return _csv_response(rows, "submissions.csv")


@router.get("/export/predictions")
def export_predictions(db: Session = Depends(get_db)):
    predictions = db.execute(select(orm.Prediction)).scalars().all()
    rows = []
    for pred in predictions:
        participant = db.get(orm.Participant, pred.participant_id)
        row = {
            "prediction_id": pred.id,
            "participant_name": participant.name if participant else "",
            "participant_email": participant.email if participant else "",
        }
        for i in range(1, 6):
            sid = getattr(pred, f"song_{i}_id")
            song = db.get(orm.Song, sid)
            row[f"song_{i}"] = f"{song.canonical_title} - {song.canonical_artist}" if song else sid
        row["created_at"] = pred.created_at.isoformat()
        rows.append(row)
    return _csv_response(rows, "predictions.csv")


@router.get("/export/rankings")
def export_rankings(db: Session = Depends(get_db)):
    rankings = compute_rankings(db)
    rows = [
        {
            "rank": r.rank,
            "song_id": r.song.id,
            "title": r.song.canonical_title,
            "artist": r.song.canonical_artist,
            "score": r.score,
            "nomination_count": r.nomination_count,
            "yes_votes": r.yes_votes,
            "no_votes": r.no_votes,
            "approved_defenses": r.approved_defenses,
            "nomination_score": r.score_components.nomination_score,
            "swipe_score": r.score_components.swipe_score,
            "editorial_score": r.score_components.editorial_score,
            "defense_score": r.score_components.defense_score,
            "balance_score": r.score_components.balance_score,
        }
        for r in rankings
    ]
    return _csv_response(rows, "rankings.csv")
