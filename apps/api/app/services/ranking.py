"""Ranking engine for KRML 250."""
import json
import logging
from dataclasses import dataclass

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import orm
from app.models.schemas import ScoreComponents, SongRanking, SongOut

logger = logging.getLogger(__name__)

DEFAULT_WEIGHTS = {
    "nominations": 0.40,
    "swipe": 0.25,
    "editorial": 0.15,
    "defense": 0.10,
    "balance": 0.10,
}


def get_weights(db: Session) -> dict:
    setting = db.execute(
        select(orm.CampaignSetting).where(orm.CampaignSetting.key == "ranking_weights")
    ).scalar_one_or_none()
    if setting:
        try:
            return json.loads(setting.value)
        except Exception:
            pass
    return DEFAULT_WEIGHTS


@dataclass
class SongStats:
    song: orm.Song
    nomination_count: int
    yes_votes: int
    no_votes: int
    approved_defenses: int
    town_tags: list[str]
    decade_tags: list[str]


def compute_rankings(db: Session) -> list[SongRanking]:
    weights = get_weights(db)

    nom_rows = db.execute(
        select(
            orm.Submission.song_id,
            func.count(orm.Submission.id).label("cnt"),
        )
        .where(orm.Submission.active == True)
        .group_by(orm.Submission.song_id)
    ).all()
    nom_map: dict[str, int] = {r.song_id: r.cnt for r in nom_rows}

    vote_rows = db.execute(
        select(
            orm.SwipeVote.song_id,
            orm.SwipeVote.vote,
            func.count(orm.SwipeVote.id).label("cnt"),
        )
        .group_by(orm.SwipeVote.song_id, orm.SwipeVote.vote)
    ).all()
    yes_map: dict[str, int] = {}
    no_map: dict[str, int] = {}
    for r in vote_rows:
        if r.vote == "yes":
            yes_map[r.song_id] = r.cnt
        elif r.vote == "no":
            no_map[r.song_id] = r.cnt

    def_rows = db.execute(
        select(
            orm.SongDefense.song_id,
            func.count(orm.SongDefense.id).label("cnt"),
        )
        .where(orm.SongDefense.approval_status == "approved")
        .group_by(orm.SongDefense.song_id)
    ).all()
    def_map: dict[str, int] = {r.song_id: r.cnt for r in def_rows}

    tag_rows = db.execute(
        select(
            orm.Submission.song_id,
            orm.Submission.town_tag,
            orm.Submission.decade_tag,
        ).where(orm.Submission.active == True)
    ).all()
    town_tags_map: dict[str, list[str]] = {}
    decade_tags_map: dict[str, list[str]] = {}
    for r in tag_rows:
        if r.town_tag:
            town_tags_map.setdefault(r.song_id, []).append(r.town_tag)
        if r.decade_tag:
            decade_tags_map.setdefault(r.song_id, []).append(r.decade_tag)

    songs = db.execute(
        select(orm.Song).where(
            orm.Song.status.in_(["approved", "pending"])
        )
    ).scalars().all()

    max_noms = max(nom_map.values(), default=1)
    max_defs = 5

    all_towns_in_submissions = set()
    all_decades_in_submissions = set()
    for tags in town_tags_map.values():
        all_towns_in_submissions.update(tags)
    for tags in decade_tags_map.values():
        all_decades_in_submissions.update(tags)

    stats_list: list[SongStats] = []
    for song in songs:
        sid = song.id
        stats_list.append(
            SongStats(
                song=song,
                nomination_count=nom_map.get(sid, 0),
                yes_votes=yes_map.get(sid, 0),
                no_votes=no_map.get(sid, 0),
                approved_defenses=def_map.get(sid, 0),
                town_tags=town_tags_map.get(sid, []),
                decade_tags=decade_tags_map.get(sid, []),
            )
        )

    rankings: list[SongRanking] = []
    for s in stats_list:
        nomination_score = s.nomination_count / max_noms if max_noms > 0 else 0.0

        total_votes = s.yes_votes + s.no_votes
        if total_votes >= 3:
            swipe_score = s.yes_votes / total_votes
        else:
            swipe_score = 0.5

        if s.song.aaa_fit_score is not None:
            editorial_score = s.song.aaa_fit_score / 10.0
        else:
            editorial_score = 0.5

        defense_score = min(s.approved_defenses, max_defs) / max_defs

        balance_score = 0.5
        if s.town_tags:
            unique_towns = set(s.town_tags)
            avg_per_town = len(stats_list) / max(len(all_towns_in_submissions), 1)
            town_count = sum(
                1 for st in stats_list if any(t in unique_towns for t in st.town_tags)
            )
            if town_count < avg_per_town:
                balance_score = min(1.0, balance_score + 0.3)

        weighted_total = (
            nomination_score * weights.get("nominations", 0.40)
            + swipe_score * weights.get("swipe", 0.25)
            + editorial_score * weights.get("editorial", 0.15)
            + defense_score * weights.get("defense", 0.10)
            + balance_score * weights.get("balance", 0.10)
        )

        rankings.append(
            SongRanking(
                rank=0,
                song=SongOut.model_validate(s.song),
                score=round(weighted_total, 4),
                score_components=ScoreComponents(
                    nomination_score=round(nomination_score, 4),
                    swipe_score=round(swipe_score, 4),
                    editorial_score=round(editorial_score, 4),
                    defense_score=round(defense_score, 4),
                    balance_score=round(balance_score, 4),
                    weighted_total=round(weighted_total, 4),
                ),
                nomination_count=s.nomination_count,
                yes_votes=s.yes_votes,
                no_votes=s.no_votes,
                approved_defenses=s.approved_defenses,
            )
        )

    rankings.sort(key=lambda r: r.score, reverse=True)
    for i, r in enumerate(rankings):
        r.rank = i + 1

    return rankings
