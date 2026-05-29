"""Public leaderboard routes."""
import json

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import orm
from app.models.schemas import (
    DecadeLeaderboardEntry,
    LeaderboardSong,
    SongOut,
    SongSearchResult,
    TownLeaderboardEntry,
)
from app.services.ranking import compute_rankings

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


def _is_top5_revealed(db: Session) -> bool:
    row = db.execute(
        select(orm.CampaignSetting).where(orm.CampaignSetting.key == "top5_revealed")
    ).scalar_one_or_none()
    return row is not None and row.value.lower() == "true"


def _is_results_published(db: Session) -> bool:
    row = db.execute(
        select(orm.CampaignSetting).where(
            orm.CampaignSetting.key == "results_published"
        )
    ).scalar_one_or_none()
    return row is not None and row.value.lower() == "true"


@router.get("/songs", response_model=list[LeaderboardSong])
def leaderboard_songs(
    page: int = Query(1, ge=1),
    per_page: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
):
    rankings = compute_rankings(db)
    revealed = _is_top5_revealed(db)

    start = (page - 1) * per_page
    end = start + per_page
    page_rankings = rankings[start:end]

    result = []
    for r in page_rankings:
        rank = r.rank if revealed else None
        result.append(
            LeaderboardSong(
                song=r.song,
                nomination_count=r.nomination_count,
                yes_votes=r.yes_votes,
                no_votes=r.no_votes,
                approved_defenses=r.approved_defenses,
                score=r.score,
                rank=rank,
            )
        )
    return result


@router.get("/towns", response_model=list[TownLeaderboardEntry])
def leaderboard_towns(db: Session = Depends(get_db)):
    rows = db.execute(
        select(
            orm.Submission.town_tag,
            func.count(func.distinct(orm.Submission.song_id)).label("song_count"),
            func.count(orm.Submission.id).label("nomination_count"),
        )
        .where(orm.Submission.active == True, orm.Submission.town_tag.isnot(None))
        .group_by(orm.Submission.town_tag)
        .order_by(func.count(orm.Submission.id).desc())
    ).all()

    result = []
    for row in rows:
        top_song_ids = db.execute(
            select(orm.Submission.song_id)
            .where(
                orm.Submission.town_tag == row.town_tag,
                orm.Submission.active == True,
            )
            .group_by(orm.Submission.song_id)
            .order_by(func.count(orm.Submission.id).desc())
            .limit(3)
        ).scalars().all()

        top_songs = []
        for sid in top_song_ids:
            song = db.get(orm.Song, sid)
            if song:
                top_songs.append(
                    SongSearchResult(
                        id=song.id,
                        canonical_title=song.canonical_title,
                        canonical_artist=song.canonical_artist,
                        decade=song.decade,
                        release_year=song.release_year,
                    )
                )

        result.append(
            TownLeaderboardEntry(
                town=row.town_tag,
                song_count=row.song_count,
                nomination_count=row.nomination_count,
                top_songs=top_songs,
            )
        )
    return result


@router.get("/decades", response_model=list[DecadeLeaderboardEntry])
def leaderboard_decades(db: Session = Depends(get_db)):
    rows = db.execute(
        select(
            orm.Song.decade,
            func.count(func.distinct(orm.Song.id)).label("song_count"),
            func.count(orm.Submission.id).label("nomination_count"),
        )
        .join(orm.Submission, orm.Submission.song_id == orm.Song.id, isouter=True)
        .where(orm.Song.decade.isnot(None))
        .group_by(orm.Song.decade)
        .order_by(func.count(orm.Submission.id).desc())
    ).all()

    result = []
    for row in rows:
        top_song_ids = db.execute(
            select(orm.Submission.song_id)
            .join(orm.Song, orm.Song.id == orm.Submission.song_id)
            .where(
                orm.Song.decade == row.decade,
                orm.Submission.active == True,
            )
            .group_by(orm.Submission.song_id)
            .order_by(func.count(orm.Submission.id).desc())
            .limit(3)
        ).scalars().all()

        top_songs = []
        for sid in top_song_ids:
            song = db.get(orm.Song, sid)
            if song:
                top_songs.append(
                    SongSearchResult(
                        id=song.id,
                        canonical_title=song.canonical_title,
                        canonical_artist=song.canonical_artist,
                        decade=song.decade,
                        release_year=song.release_year,
                    )
                )

        result.append(
            DecadeLeaderboardEntry(
                decade=row.decade,
                song_count=row.song_count,
                nomination_count=row.nomination_count or 0,
                top_songs=top_songs,
            )
        )
    return result


@router.get("/dj-picks", response_model=list[SongOut])
def leaderboard_dj_picks(db: Session = Depends(get_db)):
    songs = db.execute(
        select(orm.Song)
        .where(orm.Song.dj_pick == True, orm.Song.status != "excluded")
        .order_by(orm.Song.canonical_title)
    ).scalars().all()
    return [SongOut.model_validate(s) for s in songs]
