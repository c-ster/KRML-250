"""Song search and detail routes."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.auth import get_current_participant
from app.core.database import get_db
from app.models import orm
from app.models.schemas import SongOut, SongSearchResult, SongSuggest

import secrets

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


@router.post("/suggest", response_model=SongSearchResult, status_code=status.HTTP_201_CREATED)
def suggest_song(
    body: SongSuggest,
    db: Session = Depends(get_db),
    _: orm.Participant = Depends(get_current_participant),
):
    title = body.title.strip()
    artist = body.artist.strip()
    if not title or not artist:
        raise HTTPException(status_code=400, detail="Title and artist are required.")

    norm_title = _normalize(title)
    norm_artist = _normalize(artist)

    existing = db.execute(
        select(orm.Song).where(
            orm.Song.normalized_title == norm_title,
            orm.Song.normalized_artist == norm_artist,
        )
    ).scalar_one_or_none()
    if existing:
        return SongSearchResult(
            id=existing.id,
            canonical_title=existing.canonical_title,
            canonical_artist=existing.canonical_artist,
            decade=existing.decade,
            release_year=existing.release_year,
        )

    now = datetime.now(timezone.utc)
    song = orm.Song(
        id=secrets.token_urlsafe(8),
        canonical_title=title,
        canonical_artist=artist,
        normalized_title=norm_title,
        normalized_artist=norm_artist,
        krml_seeded=False,
        dj_pick=False,
        status="pending",
        created_at=now,
        updated_at=now,
    )
    db.add(song)
    db.commit()
    db.refresh(song)
    return SongSearchResult(
        id=song.id,
        canonical_title=song.canonical_title,
        canonical_artist=song.canonical_artist,
        decade=song.decade,
        release_year=song.release_year,
    )


@router.get("/{song_id}", response_model=SongOut)
def get_song(song_id: str, db: Session = Depends(get_db)):
    song = db.get(orm.Song, song_id)
    if not song or song.status == "excluded":
        raise HTTPException(status_code=404, detail="Song not found")
    return song
