#!/usr/bin/env python3
"""Seed script for KRML 250 — realistic development data."""
import json
import random
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models.orm import (
    Base,
    CampaignSetting,
    DJNote,
    Participant,
    Prediction,
    Song,
    SongAlias,
    SongDefense,
    SponsorPlacement,
    Submission,
    SwipeVote,
)


def new_id() -> str:
    return str(uuid.uuid4())


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def normalize(s: str) -> str:
    return s.strip().lower()


# ─── Song catalog ─────────────────────────────────────────────────────────────

SONGS_DATA = [
    # (title, artist, decade, year, aaa_fit, krml_seeded, dj_pick, town_tag)
    ("California Dreamin'", "The Mamas & the Papas", "1960s", 1965, 8, True, True, "monterey"),
    ("Hotel California", "Eagles", "1970s", 1977, 9, True, True, None),
    ("Monterey", "Eric Burdon & The Animals", "1960s", 1967, 9, True, True, "monterey"),
    ("Big Sur", "The Beach Boys", "1960s", 1968, 7, True, False, None),
    ("Carmel-by-the-Sea", "Local Artist Collective", "2010s", 2015, 6, False, True, "carmel"),
    ("Pacific Coast Highway", "Sheryl Crow", "1990s", 1996, 8, True, False, None),
    ("Ventura Highway", "America", "1970s", 1972, 8, True, True, None),
    ("Going to California", "Led Zeppelin", "1970s", 1971, 7, True, False, None),
    ("Suite: Judy Blue Eyes", "Crosby, Stills & Nash", "1970s", 1969, 9, True, True, None),
    ("Southern Cross", "Crosby, Stills & Nash", "1980s", 1982, 8, True, False, None),
    ("Desperado", "Eagles", "1970s", 1973, 8, True, True, None),
    ("Take It Easy", "Eagles", "1970s", 1972, 8, True, False, None),
    ("Margaritaville", "Jimmy Buffett", "1970s", 1977, 6, False, False, None),
    ("Ripple", "Grateful Dead", "1970s", 1970, 9, True, True, None),
    ("Truckin'", "Grateful Dead", "1970s", 1970, 7, True, False, None),
    ("Friend of the Devil", "Grateful Dead", "1970s", 1970, 9, True, True, None),
    ("Blackbird", "The Beatles", "1960s", 1968, 9, True, True, None),
    ("Landslide", "Fleetwood Mac", "1970s", 1975, 9, True, True, None),
    ("The Chain", "Fleetwood Mac", "1970s", 1977, 8, True, False, None),
    ("Gold Dust Woman", "Fleetwood Mac", "1970s", 1977, 8, True, True, None),
    ("Dreams", "Fleetwood Mac", "1970s", 1977, 8, True, False, None),
    ("Sara", "Fleetwood Mac", "1970s", 1979, 7, True, False, None),
    ("Fast Car", "Tracy Chapman", "1980s", 1988, 9, True, True, None),
    ("Give Me One Reason", "Tracy Chapman", "1990s", 1995, 8, True, False, None),
    ("Big Yellow Taxi", "Joni Mitchell", "1970s", 1970, 9, True, True, None),
    ("Both Sides Now", "Joni Mitchell", "1960s", 1969, 9, True, True, None),
    ("A Case of You", "Joni Mitchell", "1970s", 1971, 9, True, True, None),
    ("River", "Joni Mitchell", "1970s", 1971, 9, True, True, None),
    ("Fire and Rain", "James Taylor", "1970s", 1970, 8, True, True, None),
    ("You've Got a Friend", "James Taylor", "1970s", 1971, 8, True, True, None),
    ("Carolina in My Mind", "James Taylor", "1970s", 1968, 7, True, False, None),
    ("Mexico", "James Taylor", "1970s", 1975, 7, True, False, None),
    ("Teach Your Children", "CSNY", "1970s", 1970, 8, True, True, None),
    ("Our House", "CSNY", "1970s", 1970, 8, True, False, None),
    ("Woodstock", "CSNY", "1970s", 1970, 9, True, True, None),
    ("Heart of Gold", "Neil Young", "1970s", 1972, 9, True, True, None),
    ("Old Man", "Neil Young", "1970s", 1972, 8, True, True, None),
    ("Harvest Moon", "Neil Young", "1990s", 1992, 8, True, True, None),
    ("Comes a Time", "Neil Young", "1970s", 1978, 8, True, False, None),
    ("Helpless", "Neil Young", "1970s", 1970, 8, True, False, None),
    ("Southern Man", "Neil Young", "1970s", 1970, 6, True, False, None),
    ("The Sound of Silence", "Simon & Garfunkel", "1960s", 1964, 8, True, True, None),
    ("Mrs. Robinson", "Simon & Garfunkel", "1960s", 1968, 7, True, False, None),
    ("The Boxer", "Simon & Garfunkel", "1960s", 1969, 8, True, True, None),
    ("Bridge Over Troubled Water", "Simon & Garfunkel", "1970s", 1970, 9, True, True, None),
    ("Cecilia", "Simon & Garfunkel", "1970s", 1970, 7, True, False, None),
    ("American Pie", "Don McLean", "1970s", 1971, 8, True, True, None),
    ("Vincent (Starry Starry Night)", "Don McLean", "1970s", 1971, 8, True, True, None),
    ("Melissa", "Allman Brothers Band", "1970s", 1972, 8, True, False, None),
    ("Midnight Rider", "Allman Brothers Band", "1970s", 1970, 7, True, False, None),
    ("Ramblin' Man", "Allman Brothers Band", "1970s", 1973, 7, True, False, None),
    ("Into the Mystic", "Van Morrison", "1970s", 1970, 9, True, True, None),
    ("Moondance", "Van Morrison", "1970s", 1970, 8, True, True, None),
    ("Brown Eyed Girl", "Van Morrison", "1960s", 1967, 8, True, False, None),
    ("Here Comes the Sun", "The Beatles", "1960s", 1969, 9, True, True, None),
    ("Let It Be", "The Beatles", "1970s", 1970, 9, True, True, None),
    ("Yesterday", "The Beatles", "1960s", 1965, 9, True, True, None),
    ("The Long and Winding Road", "The Beatles", "1970s", 1970, 8, True, False, None),
    ("Born to Run", "Bruce Springsteen", "1970s", 1975, 8, True, False, None),
    ("Thunder Road", "Bruce Springsteen", "1970s", 1975, 9, True, True, None),
    ("The River", "Bruce Springsteen", "1980s", 1980, 9, True, True, None),
    ("Dancing in the Dark", "Bruce Springsteen", "1980s", 1984, 7, True, False, None),
    ("Wish You Were Here", "Pink Floyd", "1970s", 1975, 8, True, True, None),
    ("Comfortably Numb", "Pink Floyd", "1970s", 1979, 8, True, False, None),
    ("Time", "Pink Floyd", "1970s", 1973, 8, True, False, None),
    ("Tangled Up in Blue", "Bob Dylan", "1970s", 1975, 9, True, True, None),
    ("Blowin' in the Wind", "Bob Dylan", "1960s", 1963, 9, True, True, None),
    ("Mr. Tambourine Man", "Bob Dylan", "1960s", 1965, 8, True, False, None),
    ("Knockin' on Heaven's Door", "Bob Dylan", "1970s", 1973, 8, True, True, None),
    ("Like a Rolling Stone", "Bob Dylan", "1960s", 1965, 8, True, False, None),
    ("The Weight", "The Band", "1960s", 1968, 9, True, True, None),
    ("Up on Cripple Creek", "The Band", "1960s", 1969, 8, True, False, None),
    ("Night They Drove Old Dixie Down", "The Band", "1960s", 1969, 8, True, False, None),
    ("Operator", "Jim Croce", "1970s", 1972, 8, True, True, None),
    ("Time in a Bottle", "Jim Croce", "1970s", 1973, 8, True, True, None),
    ("Bad, Bad Leroy Brown", "Jim Croce", "1970s", 1973, 6, False, False, None),
    ("Nights in White Satin", "Moody Blues", "1960s", 1967, 7, True, False, None),
    ("Question", "Moody Blues", "1970s", 1970, 7, True, False, None),
    ("Horse with No Name", "America", "1970s", 1971, 7, True, False, None),
    ("Sister Golden Hair", "America", "1970s", 1975, 7, True, False, None),
    ("Tin Man", "America", "1970s", 1974, 7, True, False, None),
    ("Peaceful Easy Feeling", "Eagles", "1970s", 1972, 8, True, False, None),
    ("Best of My Love", "Eagles", "1970s", 1974, 8, True, False, None),
    ("Lyin' Eyes", "Eagles", "1970s", 1975, 8, True, False, None),
    ("One of These Nights", "Eagles", "1970s", 1975, 8, True, True, None),
    ("Life in the Fast Lane", "Eagles", "1970s", 1977, 7, True, False, None),
    ("The Long Run", "Eagles", "1970s", 1979, 7, True, False, None),
    ("Tequila Sunrise", "Eagles", "1970s", 1973, 8, True, True, None),
    ("Already Gone", "Eagles", "1970s", 1974, 7, True, False, None),
    ("New Kid in Town", "Eagles", "1970s", 1977, 8, True, True, None),
    ("Wasted Time", "Eagles", "1970s", 1976, 7, True, False, None),
    ("Seven Bridges Road", "Eagles", "1980s", 1980, 8, True, True, None),
    ("Sail Away", "Randy Newman", "1970s", 1972, 7, True, False, None),
    ("Short People", "Randy Newman", "1970s", 1977, 5, False, False, None),
    ("Lost in the Supermarket", "The Clash", "1970s", 1979, 5, False, False, None),
    ("Space Oddity", "David Bowie", "1960s", 1969, 7, True, False, None),
    ("Heroes", "David Bowie", "1970s", 1977, 8, True, True, None),
    ("Golden Years", "David Bowie", "1970s", 1975, 7, True, False, None),
    ("Walk on the Wild Side", "Lou Reed", "1970s", 1972, 7, True, False, None),
    ("Perfect Day", "Lou Reed", "1970s", 1972, 8, True, True, None),
    ("After the Gold Rush", "Neil Young", "1970s", 1970, 9, True, True, None),
    ("Cortez the Killer", "Neil Young", "1970s", 1975, 8, True, True, None),
    ("Needle and the Damage Done", "Neil Young", "1970s", 1972, 8, True, True, None),
    ("Don't Let It Bring You Down", "Neil Young", "1970s", 1970, 7, True, False, None),
    ("Cinnamon Girl", "Neil Young", "1960s", 1969, 8, True, False, None),
    ("Ohio", "CSNY", "1970s", 1970, 8, True, False, None),
    ("Deja Vu", "Crosby, Stills, Nash & Young", "1970s", 1970, 9, True, True, None),
    ("4+20", "Crosby, Stills, Nash & Young", "1970s", 1970, 8, True, False, None),
    ("Carry On", "Crosby, Stills, Nash & Young", "1970s", 1970, 8, True, False, None),
    ("Helplessly Hoping", "Crosby, Stills & Nash", "1960s", 1969, 9, True, True, None),
    ("Love the One You're With", "Stephen Stills", "1970s", 1970, 7, True, False, None),
    ("Suite Judy Blue Eyes", "CSNY", "1960s", 1969, 9, True, False, None),
    ("Monterey Bay Blues", "Coastal Trio", "2000s", 2003, 7, False, True, "monterey"),
    ("Carmel Valley Morning", "Pacific Fog", "2010s", 2012, 6, False, True, "carmel"),
    ("Salinas Fields", "Del Monte Ramblers", "1990s", 1994, 6, False, True, "salinas"),
    ("Pacific Grove Waltz", "The Fog Horns", "2000s", 2008, 7, False, True, "pacific_grove"),
    ("Marina on the Bay", "Coastal Roots", "2010s", 2018, 6, False, True, "marina"),
    ("Seaside Summer", "The Breakers", "1990s", 1997, 7, False, True, "seaside"),
    ("Santa Cruz Shuffle", "Boardwalk Boys", "2000s", 2001, 5, False, False, "santa_cruz"),
    ("Watsonville Waltz", "Pajaro Valley Band", "2000s", 2006, 6, False, True, "watsonville"),
    ("Castroville Artichoke Song", "The Harvesters", "1980s", 1985, 5, False, False, "castroville"),
    ("My Old Kentucky Home", "Local Veteran", "1980s", 1982, 6, False, False, None),
    ("Peaceful Valley", "Hill Country Folk", "1990s", 1993, 7, False, True, None),
    ("Where the Streets Have No Name", "U2", "1980s", 1987, 7, True, False, None),
    ("One", "U2", "1990s", 1991, 8, True, True, None),
    ("Running to Stand Still", "U2", "1980s", 1987, 8, True, True, None),
    ("With or Without You", "U2", "1980s", 1987, 8, True, False, None),
    ("Bad", "U2", "1980s", 1984, 9, True, True, None),
    ("Sunday Bloody Sunday", "U2", "1980s", 1983, 7, True, False, None),
    ("I Still Haven't Found What I'm Looking For", "U2", "1980s", 1987, 8, True, True, None),
    ("Losing My Religion", "R.E.M.", "1990s", 1991, 7, True, True, None),
    ("Everybody Hurts", "R.E.M.", "1990s", 1992, 8, True, True, None),
    ("Man on the Moon", "R.E.M.", "1990s", 1992, 7, True, False, None),
    ("Nightswimming", "R.E.M.", "1990s", 1992, 8, True, True, None),
    ("The One I Love", "R.E.M.", "1980s", 1987, 7, True, False, None),
    ("Purple Haze", "The Jimi Hendrix Experience", "1960s", 1967, 9, True, True, "monterey"),
    ("Hey Joe", "The Jimi Hendrix Experience", "1960s", 1966, 9, True, True, "monterey"),
    ("Wild Thing", "The Jimi Hendrix Experience", "1960s", 1967, 9, True, True, "monterey"),
    ("Piece of My Heart", "Big Brother & The Holding Company", "1960s", 1968, 9, True, True, "monterey"),
]

PARTICIPANTS_DATA = [
    ("Alice Chen", "alice.chen@example.com", "Monterey", "93940", "monterey"),
    ("Bob Martinez", "bob.martinez@example.com", "Carmel", "93923", "carmel"),
    ("Carol Williams", "carol.williams@example.com", "Pacific Grove", "93950", "pacific_grove"),
    ("David Kim", "david.kim@example.com", "Seaside", "93955", "seaside"),
    ("Emma Johnson", "emma.johnson@example.com", "Marina", "93933", "marina"),
    ("Frank Davis", "frank.davis@example.com", "Salinas", "93901", "salinas"),
    ("Grace Lee", "grace.lee@example.com", "Santa Cruz", "95060", "santa_cruz"),
    ("Henry Wilson", "henry.wilson@example.com", "Watsonville", "95076", "watsonville"),
    ("Isabella Brown", "isabella.brown@example.com", "Monterey", "93940", "monterey"),
    ("Jack Taylor", "jack.taylor@example.com", "Carmel", "93923", "carmel"),
    ("Karen Anderson", "karen.anderson@example.com", "Pacific Grove", "93950", "pacific_grove"),
    ("Leo Thomas", "leo.thomas@example.com", "Seaside", "93955", "seaside"),
    ("Maria Jackson", "maria.jackson@example.com", "Marina", "93933", "marina"),
    ("Nathan White", "nathan.white@example.com", "Salinas", "93901", "salinas"),
    ("Olivia Harris", "olivia.harris@example.com", "Monterey", "93940", "monterey"),
    ("Patrick Martin", "patrick.martin@example.com", "Carmel", "93923", "carmel"),
    ("Quinn Thompson", "quinn.thompson@example.com", "Santa Cruz", "95060", "santa_cruz"),
    ("Rachel Garcia", "rachel.garcia@example.com", "Watsonville", "95076", "watsonville"),
    ("Samuel Martinez", "samuel.martinez@example.com", "Castroville", "95012", "castroville"),
    ("Tina Robinson", "tina.robinson@example.com", "Monterey", "93940", "monterey"),
    ("Uma Clark", "uma.clark@example.com", "Pacific Grove", "93950", "pacific_grove"),
    ("Victor Rodriguez", "victor.rodriguez@example.com", "Seaside", "93955", "seaside"),
    ("Wendy Lewis", "wendy.lewis@example.com", "Salinas", "93901", "salinas"),
    ("Xavier Walker", "xavier.walker@example.com", "Marina", "93933", "marina"),
    ("Yara Hall", "yara.hall@example.com", "Carmel", "93923", "carmel"),
]

DJ_NAMES = ["DJ Mike", "Coastal Karen", "Radio Pete", "Bay Area Bob", "Monterey Martha"]

DEFENSE_TEXTS = [
    "This song captures the soul of the Monterey Bay like nothing else — every time it plays, I can smell the salt air and hear the fog horns.",
    "Growing up in Pacific Grove, this was always on the radio. It's the soundtrack of my childhood and this whole region.",
    "This artist played at the Monterey Pop Festival, so it's literally woven into our history.",
    "Every surfer I know has this on their playlist. It's the sound of early mornings at Steamer Lane.",
    "When the fog rolls in off the Pacific and this song plays, it feels like the bay itself is speaking.",
    "I've seen three generations of families in Carmel singing along to this song. It belongs to all of us.",
    "The melody has the same rhythm as the waves at Asilomar. Pure Monterey Bay energy.",
    "This song helped me through some of the hardest times of my life while living in Seaside. It deserves a spot.",
    "The local coffee shops always play this. It's the unofficial anthem of our morning routines.",
    "My grandparents first danced to this song on Cannery Row in the 70s. It's part of our family's story.",
    "The lyrical imagery — the sea, the highway, the fog — could only be describing this stretch of coast.",
    "I worked at the Monterey Bay Aquarium for years and this was always in the background. Perfect for our bay.",
    "Every road trip down Highway 1 needs this song. It makes the cliffs and the ocean even more beautiful.",
    "The artist grew up not far from here. This song is their love letter to the California coast.",
    "The acoustic guitar in this track sounds like the wind through the cypress trees at Point Lobos.",
    "When locals talk about the 'Monterey sound,' this is exactly what they mean.",
    "This song was playing when I got married on the beach in Carmel. Pure magic.",
    "The whole vibe — laid back, coastal, soulful — is exactly what KRML 250 should be about.",
    "I've heard this song at every local event from the Jazz Festival to the Whaling Festival. It's ours.",
    "The tempo matches the pace of life here: unhurried, beautiful, and connected to something bigger.",
]

SPONSOR_DATA = [
    ("Monterey Bay Aquarium", "landing", "https://example.com/mba.png", "https://montereybayaquarium.org", True),
    ("Carmel Mission Inn", "landing", None, "https://carmelmissioninn.com", True),
    ("Pebble Beach Resorts", "submit", None, "https://pebblebeach.com", True),
    ("KRML Radio Partners", "swipe", None, None, True),
    ("Cannery Row Foundation", "landing", None, "https://canneryrow.com", False),
]


def main() -> None:
    engine = create_engine(settings.sync_database_url)
    SessionFactory = sessionmaker(bind=engine)

    with SessionFactory() as db:
        print("Seeding KRML 250 database...")

        existing = db.execute(select(Song)).scalars().first()
        if existing:
            print("Database already has songs. Skipping seed.")
            return

        now = utcnow()

        print(f"Creating {len(SONGS_DATA)} songs...")
        song_objects = []
        for title, artist, decade, year, aaa, seeded, dj, town in SONGS_DATA:
            song = Song(
                id=new_id(),
                canonical_title=title,
                canonical_artist=artist,
                normalized_title=normalize(title),
                normalized_artist=normalize(artist),
                decade=decade,
                release_year=year,
                town_tag=town,
                aaa_fit_score=aaa,
                krml_seeded=seeded,
                dj_pick=dj,
                status="approved" if seeded else "pending",
                created_at=now,
                updated_at=now,
            )
            db.add(song)
            song_objects.append(song)
        db.flush()

        alias_variants = [
            (song_objects[0].id, "California Dreaming", "Mamas and Papas"),
            (song_objects[1].id, "Hotel Cal", "The Eagles"),
            (song_objects[2].id, "Monterrey", "Eric Burdon"),
            (song_objects[16].id, "Blackbird (acoustic)", "Beatles"),
            (song_objects[17].id, "Landslide (live)", "Stevie Nicks"),
            (song_objects[22].id, "Fast Car (Tracy Chapman)", "Chapman"),
            (song_objects[24].id, "Big Yellow Taxi", "Joni"),
            (song_objects[35].id, "Heart of Gold (Neil)", "Neil Young"),
            (song_objects[46].id, "American Pie (full version)", "Don McLean"),
        ]
        for song_id, sub_title, sub_artist in alias_variants:
            alias = SongAlias(
                id=new_id(),
                song_id=song_id,
                submitted_title=sub_title,
                submitted_artist=sub_artist,
                normalized_title=normalize(sub_title),
                normalized_artist=normalize(sub_artist),
                created_at=now,
            )
            db.add(alias)

        print(f"Creating {len(PARTICIPANTS_DATA)} participants...")
        participant_objects = []
        for name, email, city, zip_code, town in PARTICIPANTS_DATA:
            p = Participant(
                id=new_id(),
                name=name,
                email=email,
                city=city,
                zip=zip_code,
                town=town,
                consent_campaign_rules=True,
                consent_publish_submission=True,
                email_verified_at=now - timedelta(days=random.randint(1, 30)),
                has_used_edit=False,
                created_at=now - timedelta(days=random.randint(1, 30)),
                updated_at=now,
            )
            db.add(p)
            participant_objects.append(p)
        db.flush()

        print("Creating submissions (3 per participant)...")
        approved_songs = [s for s in song_objects if s.status == "approved"]

        for participant in participant_objects:
            chosen = random.sample(approved_songs, 3)
            for slot, song in enumerate(chosen, start=1):
                sub = Submission(
                    id=new_id(),
                    participant_id=participant.id,
                    song_id=song.id,
                    submission_slot=slot,
                    why_text=f"This song means the world to me because {random.choice(DEFENSE_TEXTS[:5]).lower()}",
                    town_tag=participant.town if random.random() > 0.3 else None,
                    decade_tag=song.decade if random.random() > 0.4 else None,
                    active=True,
                    created_at=now - timedelta(days=random.randint(0, 20)),
                    updated_at=now,
                )
                db.add(sub)
        db.flush()

        print("Creating ~500 swipe votes...")
        swipe_count = 0
        for participant in participant_objects:
            voteable = random.sample(approved_songs, min(20, len(approved_songs)))
            for song in voteable:
                vote_choice = random.choices(
                    ["yes", "no", "unknown"],
                    weights=[0.55, 0.30, 0.15],
                )[0]
                vote = SwipeVote(
                    id=new_id(),
                    participant_id=participant.id,
                    song_id=song.id,
                    vote=vote_choice,
                    created_at=now - timedelta(days=random.randint(0, 15)),
                    updated_at=now,
                )
                db.add(vote)
                swipe_count += 1
        db.flush()
        print(f"  Created {swipe_count} swipe votes")

        print("Creating 20 song defenses...")
        defense_songs = random.sample(approved_songs, 20)
        defense_participants = random.sample(participant_objects, 20)
        statuses = (
            ["approved"] * 10 + ["pending"] * 5 + ["rejected"] * 5
        )
        for i, (song, participant, status) in enumerate(
            zip(defense_songs, defense_participants, statuses)
        ):
            defense = SongDefense(
                id=new_id(),
                participant_id=participant.id,
                song_id=song.id,
                defense_text=DEFENSE_TEXTS[i % len(DEFENSE_TEXTS)],
                approval_status=status,
                approved_excerpt=(
                    DEFENSE_TEXTS[i % len(DEFENSE_TEXTS)][:100]
                    if status == "approved"
                    else None
                ),
                created_at=now - timedelta(days=random.randint(0, 10)),
                updated_at=now,
            )
            db.add(defense)
        db.flush()

        print("Creating 20 predictions...")
        predictors = random.sample(participant_objects, 20)
        for participant in predictors:
            picks = random.sample(approved_songs, 5)
            pred = Prediction(
                id=new_id(),
                participant_id=participant.id,
                song_1_id=picks[0].id,
                song_2_id=picks[1].id,
                song_3_id=picks[2].id,
                song_4_id=picks[3].id,
                song_5_id=picks[4].id,
                created_at=now - timedelta(days=random.randint(0, 7)),
                updated_at=now,
            )
            db.add(pred)
        db.flush()

        print("Creating 10 DJ notes...")
        dj_note_songs = random.sample(approved_songs[:30], 10)
        for i, song in enumerate(dj_note_songs):
            note = DJNote(
                id=new_id(),
                dj_name=DJ_NAMES[i % len(DJ_NAMES)],
                song_id=song.id,
                note=f"This track is an absolute classic. '{song.canonical_title}' by {song.canonical_artist} "
                     f"always gets requests from our listeners. Proud to see it nominated!",
                display_publicly=i < 7,
                created_at=now - timedelta(days=random.randint(0, 5)),
                updated_at=now,
            )
            db.add(note)
        db.flush()

        print("Creating 5 sponsor placements...")
        for name, placement, img, link, active in SPONSOR_DATA:
            sponsor = SponsorPlacement(
                id=new_id(),
                sponsor_name=name,
                placement_type=placement,
                image_url=img,
                link_url=link,
                active=active,
                created_at=now,
                updated_at=now,
            )
            db.add(sponsor)

        print("Creating campaign settings...")
        default_settings = {
            "nominations_open": "true",
            "swipe_open": "true",
            "predictions_open": "true",
            "results_published": "false",
            "top5_revealed": "false",
            "ranking_weights": json.dumps({
                "nominations": 0.40,
                "swipe": 0.25,
                "editorial": 0.15,
                "defense": 0.10,
                "balance": 0.10,
            }),
        }
        for key, value in default_settings.items():
            setting = CampaignSetting(
                id=new_id(),
                key=key,
                value=value,
                updated_at=now,
            )
            db.add(setting)

        db.commit()
        print("Seed complete!")
        print(f"  {len(song_objects)} songs")
        print(f"  {len(participant_objects)} participants")
        print("  75 submissions")
        print(f"  ~{swipe_count} swipe votes")
        print("  20 defenses")
        print("  20 predictions")
        print("  10 DJ notes")
        print("  5 sponsors")
        print("  6 campaign settings")


if __name__ == "__main__":
    main()
