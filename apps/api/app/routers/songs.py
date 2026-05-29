"""Song search and detail routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import orm
from app.models.schemas import SongOut, SongSearchResult

router = APIRouter(prefix="/songs", tags=["songs"])


def _normalize(s: str) -> str:
    return s.strip().lower()


@router.get("/search", response_model=list[SongSearchResult])
def search_songs(q: str = "", db: Session = Depends(get_db)):
    if not q or len(q) < 2:
        return []
    term = f"%{_normalize(q)}%"
    songs_by_canonical = db.execute(
        select(orm.Song)
        .where(
            orm.Song.status != "excluded",
            or_(
                orm.Song.normalized_title.ilike(term),
                orm.Song.normalized_artist.ilike(term),
            ),
        )
        .limit(10)
    ).scalars().all()

    alias_song_ids = db.execute(
        select(orm.SongAlias.song_id).where(
            or_(
                orm.SongAlias.normalized_title.ilike(term),
                orm.SongAlias.normalized_artist.ilike(term),
            )
        )
    ).scalars().all()

    if alias_song_ids:
        alias_songs = db.execute(
            select(orm.Song).where(
                orm.Song.id.in_(alias_song_ids),
                orm.Song.status != "excluded",
            )
        ).scalars().all()
    else:
        alias_songs = []

    seen = set()
    results = []
    for song in list(songs_by_canonical) + list(alias_songs):
        if song.id not in seen:
            seen.add(song.id)
            results.append(
                SongSearchResult(
                    id=song.id,
                    canonical_title=song.canonical_title,
                    canonical_artist=song.canonical_artist,
                    decade=song.decade,
                    release_year=song.release_year,
                )
            )
        if len(results) >= 10:
            break

    return results


@router.get("/{song_id}", response_model=SongOut)
def get_song(song_id: str, db: Session = Depends(get_db)):
    song = db.get(orm.Song, song_id)
    if not song or song.status == "excluded":
        raise HTTPException(status_code=404, detail="Song not found")
    return song
