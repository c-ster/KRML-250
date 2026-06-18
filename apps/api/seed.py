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
    ("Mercy", "Dave Matthews Band", "2010s", 2012, 7, True, True, "carmel"),
    # ─── Monterey Pop & 1960s California ──────────────────────────────────────
    ("Ball and Chain", "Big Brother & The Holding Company", "1960s", 1968, 9, True, True, "monterey"),
    ("Try a Little Tenderness", "Otis Redding", "1960s", 1966, 9, True, True, "monterey"),
    ("I've Been Loving You Too Long", "Otis Redding", "1960s", 1965, 8, True, False, "monterey"),
    ("My Generation", "The Who", "1960s", 1965, 8, True, True, "monterey"),
    ("I Can See for Miles", "The Who", "1960s", 1967, 7, True, False, "monterey"),
    ("San Francisco (Be Sure to Wear Flowers in Your Hair)", "Scott McKenzie", "1960s", 1967, 8, True, True, "monterey"),
    ("Monday, Monday", "The Mamas & the Papas", "1960s", 1966, 7, True, False, "monterey"),
    ("Somebody to Love", "Jefferson Airplane", "1960s", 1967, 9, True, True, "monterey"),
    ("White Rabbit", "Jefferson Airplane", "1960s", 1967, 9, True, True, "monterey"),
    ("For What It's Worth", "Buffalo Springfield", "1960s", 1966, 9, True, True, None),
    ("Mr. Soul", "Buffalo Springfield", "1960s", 1967, 7, True, False, "monterey"),
    ("Eight Miles High", "The Byrds", "1960s", 1966, 8, True, True, "monterey"),
    ("Turn! Turn! Turn!", "The Byrds", "1960s", 1965, 8, True, False, None),
    ("The 59th Street Bridge Song (Feelin' Groovy)", "Simon & Garfunkel", "1960s", 1966, 8, True, True, None),
    ("Homeward Bound", "Simon & Garfunkel", "1960s", 1966, 8, True, False, None),
    ("Dark Star", "Grateful Dead", "1960s", 1968, 8, True, True, "monterey"),
    ("Morning Dew", "Grateful Dead", "1960s", 1967, 7, True, False, "monterey"),
    ("Casey Jones", "Grateful Dead", "1970s", 1970, 8, True, True, None),
    ("Soul Sacrifice", "Santana", "1960s", 1969, 9, True, True, None),
    ("Evil Ways", "Santana", "1960s", 1969, 8, True, False, None),
    ("Groovin' Is Easy", "The Electric Flag", "1960s", 1967, 7, True, False, "monterey"),
    ("Born in Chicago", "The Paul Butterfield Blues Band", "1960s", 1965, 7, True, False, "monterey"),
    ("Rollin' and Tumblin'", "Canned Heat", "1960s", 1967, 7, True, False, "monterey"),
    ("On the Road Again", "Canned Heat", "1960s", 1968, 8, True, True, None),
    ("Going Up the Country", "Canned Heat", "1960s", 1968, 8, True, True, None),
    ("Section 43", "Country Joe & The Fish", "1960s", 1967, 6, True, False, "monterey"),
    ("I-Feel-Like-I'm-Fixin'-to-Die Rag", "Country Joe & The Fish", "1960s", 1967, 7, True, False, None),
    ("Along Comes Mary", "The Association", "1960s", 1966, 7, True, False, "monterey"),
    ("Windy", "The Association", "1960s", 1967, 7, True, False, None),
    ("Poor Side of Town", "Johnny Rivers", "1960s", 1966, 6, True, False, "monterey"),
    ("Summer in the City", "The Lovin' Spoonful", "1960s", 1966, 8, True, True, None),
    ("Omaha", "Moby Grape", "1960s", 1967, 7, True, False, "monterey"),
    ("Sweet Little Angel", "The Steve Miller Band", "1960s", 1968, 7, True, False, "monterey"),
    ("Mercury Blues", "The Steve Miller Band", "1960s", 1968, 7, True, False, None),
    ("Grazing in the Grass", "Hugh Masekela", "1960s", 1968, 8, True, True, "monterey"),
    ("Green Onions", "Booker T. & the M.G.'s", "1960s", 1962, 8, True, True, "monterey"),
    ("Hip Hug-Her", "Booker T. & the M.G.'s", "1960s", 1967, 7, True, False, "monterey"),
    ("Paint It, Black", "The Rolling Stones", "1960s", 1966, 8, True, False, None),
    ("Do You Believe in Magic", "The Lovin' Spoonful", "1960s", 1965, 7, True, False, None),
    ("Get Together", "The Youngbloods", "1960s", 1967, 8, True, True, None),
    ("Time Has Come Today", "The Chambers Brothers", "1960s", 1967, 7, True, False, None),
    ("Crystal Blue Persuasion", "Tommy James & The Shondells", "1960s", 1969, 6, True, False, None),
    ("Wooden Ships", "Crosby, Stills & Nash", "1960s", 1969, 8, True, False, None),
    ("Volunteers", "Jefferson Airplane", "1960s", 1969, 7, True, False, "monterey"),
    ("Today", "Jefferson Airplane", "1960s", 1967, 7, True, False, "monterey"),
    ("Comin' Back to Me", "Jefferson Airplane", "1960s", 1967, 8, True, False, "monterey"),
    ("Summertime Blues", "Blue Cheer", "1960s", 1968, 6, True, False, "santa_cruz"),
    ("Fresh Air", "Quicksilver Messenger Service", "1970s", 1970, 7, True, False, None),
    ("Dino's Song", "Quicksilver Messenger Service", "1960s", 1968, 6, True, False, None),
    ("You Keep Me Hangin' On", "Vanilla Fudge", "1960s", 1967, 6, True, False, None),
    # ─── Jazz & Monterey Jazz Festival ────────────────────────────────────────
    ("Take Five", "The Dave Brubeck Quartet", "1950s", 1959, 8, True, True, "monterey"),
    ("Blue Rondo à la Turk", "The Dave Brubeck Quartet", "1950s", 1959, 7, True, False, "monterey"),
    ("Better Git It in Your Soul", "Charles Mingus", "1950s", 1959, 8, True, True, "monterey"),
    ("Goodbye Pork Pie Hat", "Charles Mingus", "1950s", 1959, 7, True, False, "monterey"),
    ("So What", "Miles Davis", "1950s", 1959, 9, True, True, "monterey"),
    ("All Blues", "Miles Davis", "1950s", 1959, 8, True, False, "monterey"),
    ("Blue in Green", "Miles Davis", "1950s", 1959, 8, True, False, "monterey"),
    ("A Love Supreme, Pt. I - Acknowledgement", "John Coltrane", "1960s", 1965, 9, True, True, "monterey"),
    ("My Favorite Things", "John Coltrane", "1960s", 1961, 8, True, False, "monterey"),
    ("Giant Steps", "John Coltrane", "1950s", 1959, 8, True, False, "monterey"),
    ("Cantaloupe Island", "Herbie Hancock", "1960s", 1964, 8, True, True, "monterey"),
    ("Watermelon Man", "Herbie Hancock", "1960s", 1962, 7, True, False, "monterey"),
    ("Maiden Voyage", "Herbie Hancock", "1960s", 1965, 8, True, False, "monterey"),
    ("Song for My Father", "Horace Silver", "1960s", 1964, 7, True, False, "monterey"),
    ("Moanin'", "Art Blakey & The Jazz Messengers", "1950s", 1958, 7, True, False, "monterey"),
    ("Take the 'A' Train", "Duke Ellington", "1940s", 1941, 8, True, True, "monterey"),
    ("Mood Indigo", "Duke Ellington", "1930s", 1930, 7, True, False, "monterey"),
    ("Strange Fruit", "Billie Holiday", "1930s", 1939, 9, True, True, "monterey"),
    ("What a Wonderful World", "Louis Armstrong", "1960s", 1967, 9, True, True, "monterey"),
    ("Mack the Knife", "Louis Armstrong", "1950s", 1956, 7, True, False, "monterey"),
    ("Misty", "Erroll Garner", "1950s", 1954, 8, True, True, "carmel"),
    ("'Round Midnight", "Thelonious Monk", "1940s", 1947, 8, True, True, "monterey"),
    ("Blue Monk", "Thelonious Monk", "1950s", 1954, 7, True, False, "monterey"),
    ("Manteca", "Dizzy Gillespie", "1940s", 1947, 7, True, False, "monterey"),
    ("A Night in Tunisia", "Dizzy Gillespie", "1940s", 1946, 7, True, False, "monterey"),
    ("Summertime", "Ella Fitzgerald & Louis Armstrong", "1950s", 1957, 9, True, True, "monterey"),
    ("Mack the Knife", "Ella Fitzgerald", "1960s", 1960, 8, True, False, "monterey"),
    ("Feeling Good", "Nina Simone", "1960s", 1965, 9, True, True, "monterey"),
    ("I Put a Spell on You", "Nina Simone", "1960s", 1965, 8, True, False, "monterey"),
    ("Compared to What", "Les McCann & Eddie Harris", "1960s", 1969, 8, True, True, "monterey"),
    ("The Sidewinder", "Lee Morgan", "1960s", 1964, 7, True, False, "monterey"),
    ("Mercy, Mercy, Mercy", "Cannonball Adderley Quintet", "1960s", 1966, 8, True, False, "monterey"),
    ("Birdland", "Weather Report", "1970s", 1977, 8, True, True, "monterey"),
    ("Spain", "Chick Corea & Return to Forever", "1970s", 1972, 8, True, True, "monterey"),
    ("Red Clay", "Freddie Hubbard", "1970s", 1970, 7, True, False, "monterey"),
    ("Footprints", "Wayne Shorter", "1960s", 1967, 7, True, False, "monterey"),
    ("St. Thomas", "Sonny Rollins", "1950s", 1956, 7, True, False, "monterey"),
    ("West Coast Blues", "Wes Montgomery", "1960s", 1960, 8, True, True, "monterey"),
    ("California Dreaming", "Wes Montgomery", "1960s", 1966, 7, True, False, None),
    ("Linus and Lucy", "Vince Guaraldi Trio", "1960s", 1964, 8, True, True, "santa_cruz"),
    ("Cast Your Fate to the Wind", "Vince Guaraldi Trio", "1960s", 1962, 7, True, False, None),
    ("Midnight Blue", "Kenny Burrell", "1960s", 1963, 7, True, False, "monterey"),
    ("The Girl from Ipanema", "Stan Getz & João Gilberto", "1960s", 1964, 8, True, False, "monterey"),
    ("Breezin'", "George Benson", "1970s", 1976, 7, True, False, "monterey"),
    ("Street Life", "The Crusaders feat. Randy Crawford", "1970s", 1979, 8, True, True, "monterey"),
    # ─── Santa Cruz scene ─────────────────────────────────────────────────────
    ("Take the Skinheads Bowling", "Camper Van Beethoven", "1980s", 1985, 7, True, True, "santa_cruz"),
    ("Pictures of Matchstick Men", "Camper Van Beethoven", "1980s", 1989, 6, True, False, "santa_cruz"),
    ("Eye of Fatima, Pt. 1", "Camper Van Beethoven", "1980s", 1988, 6, True, False, "santa_cruz"),
    ("Low", "Cracker", "1990s", 1993, 7, True, True, "santa_cruz"),
    ("Teen Angst (What the World Needs Now)", "Cracker", "1990s", 1992, 6, True, False, "santa_cruz"),
    ("Euro-Trash Girl", "Cracker", "1990s", 1993, 6, True, False, "santa_cruz"),
    ("With a Walk on the Wild Side", "The Mermen", "1990s", 1995, 7, True, True, "santa_cruz"),
    ("Ocean Beach", "The Mermen", "1990s", 1995, 6, True, False, "santa_cruz"),
    ("Krill Slippin'", "The Mermen", "1990s", 1995, 6, True, False, "santa_cruz"),
    ("Graveyard Train", "The Devil Makes Three", "2000s", 2002, 8, True, True, "santa_cruz"),
    ("Old Number Seven", "The Devil Makes Three", "2000s", 2002, 8, True, True, "santa_cruz"),
    ("Do Wrong Right", "The Devil Makes Three", "2000s", 2009, 7, True, False, "santa_cruz"),
    ("The Plank", "The Devil Makes Three", "2000s", 2009, 7, True, False, "santa_cruz"),
    ("At the End of the World", "The Devil Makes Three", "2000s", 2009, 7, True, False, "santa_cruz"),
    ("Weight of the World", "Good Riddance", "1990s", 1995, 7, True, True, "santa_cruz"),
    ("Last Believer", "Good Riddance", "1990s", 1998, 6, True, False, "santa_cruz"),
    ("Mother Superior", "Good Riddance", "1990s", 1996, 6, True, False, "santa_cruz"),
    ("The Process", "Good Riddance", "1990s", 1998, 6, True, False, "santa_cruz"),
    ("The Power of Expression", "BL'AST!", "1980s", 1986, 7, True, True, "santa_cruz"),
    ("It's in My Blood", "BL'AST!", "1980s", 1987, 6, True, False, "santa_cruz"),
    ("Surf and Destroy", "BL'AST!", "1980s", 1986, 6, True, False, "santa_cruz"),
    ("California Cursed", "Drain", "2020s", 2020, 7, True, True, "santa_cruz"),
    ("Feel the Pressure", "Drain", "2020s", 2020, 6, True, False, "santa_cruz"),
    ("Run Your Luck", "Drain", "2020s", 2020, 6, True, False, "santa_cruz"),
    ("Shed My Skin", "Slow Gherkin", "1990s", 1998, 6, True, False, "santa_cruz"),
    ("Another in Your Life", "Slow Gherkin", "1990s", 1998, 6, True, False, "santa_cruz"),
    ("Saturday Night", "The Expendables", "2000s", 2007, 7, True, True, "santa_cruz"),
    ("Down Down Down", "The Expendables", "2000s", 2004, 6, True, False, "santa_cruz"),
    ("Bowl for Two", "The Expendables", "2000s", 2004, 6, True, False, "santa_cruz"),
    ("Santa Cruz", "Pearl Jam", "2000s", 2008, 8, True, True, "santa_cruz"),
    ("Santa Cruz (You're Not That Far)", "The Thrills", "2000s", 2003, 7, True, False, "santa_cruz"),
    ("Mystery to Me", "James Durbin", "2010s", 2011, 5, True, False, "santa_cruz"),
    ("Stand Up", "James Durbin", "2010s", 2011, 5, True, False, "santa_cruz"),
    ("Rejoice", "Snatam Kaur", "2000s", 2004, 5, True, False, "santa_cruz"),
    ("Ong Namo", "Snatam Kaur", "2000s", 2004, 5, True, False, "santa_cruz"),
    ("Harder Times", "Keith Greeninger", "2000s", 2005, 6, True, False, "santa_cruz"),
    ("Ruby's Rolling", "Keith Greeninger", "2000s", 2002, 6, True, False, "santa_cruz"),
    ("The Water Is Wide", "Chris Webster & Nina Gerber", "2000s", 2002, 6, True, False, "santa_cruz"),
    # ─── Folk, roots & Big Sur ─────────────────────────────────────────────────
    ("Across the Great Divide", "Kate Wolf", "1980s", 1981, 8, True, True, None),
    ("Angel from Montgomery", "John Prine", "1970s", 1971, 9, True, True, "santa_cruz"),
    ("Sweet Jane", "The Velvet Underground", "1970s", 1970, 7, True, True, "santa_cruz"),
    ("Pale Blue Eyes", "The Velvet Underground", "1960s", 1969, 8, True, False, "carmel"),
    ("Ready for the Times to Get Better", "Kate Wolf", "1970s", 1978, 7, True, False, "santa_cruz"),
    ("Carmel by the Sea", "Anita Carter", "1960s", 1965, 7, True, True, "carmel"),
    ("Big Sur", "The Thrills", "2000s", 2003, 7, True, True, "big_sur"),
    ("Big Sur", "Jack Johnson", "2010s", 2017, 7, True, True, "big_sur"),
    # ─── Surf & Beach Boys ────────────────────────────────────────────────────
    ("California Girls", "The Beach Boys", "1960s", 1965, 8, True, True, None),
    ("Good Vibrations", "The Beach Boys", "1960s", 1966, 9, True, True, None),
    ("Surfin' U.S.A.", "The Beach Boys", "1960s", 1963, 8, True, False, "santa_cruz"),
    ("Don't Worry Baby", "The Beach Boys", "1960s", 1964, 8, True, False, None),
    ("Sloop John B", "The Beach Boys", "1960s", 1966, 7, True, False, None),
    ("Surfer Girl", "The Beach Boys", "1960s", 1963, 7, True, False, "santa_cruz"),
    ("Wipe Out", "The Surfaris", "1960s", 1963, 7, True, True, "santa_cruz"),
    ("Pipeline", "The Chantays", "1960s", 1962, 7, True, True, "santa_cruz"),
    ("Misirlou", "Dick Dale & His Del-Tones", "1960s", 1962, 8, True, True, "santa_cruz"),
    ("Walk Don't Run", "The Ventures", "1960s", 1960, 7, True, False, "santa_cruz"),
    ("Sleep Walk", "Santo & Johnny", "1950s", 1959, 7, True, True, "carmel"),
    # ─── Singer-songwriter & AAA ───────────────────────────────────────────────
    ("Wild Horses", "The Rolling Stones", "1970s", 1971, 8, True, True, "salinas"),
    ("Unknown Legend", "Neil Young", "1990s", 1992, 8, True, False, None),
    ("Sweet Baby James", "James Taylor", "1970s", 1970, 9, True, True, None),
    ("California", "Joni Mitchell", "1970s", 1971, 9, True, True, None),
    ("Blue", "Joni Mitchell", "1970s", 1971, 9, True, False, "carmel"),
    ("And It Stoned Me", "Van Morrison", "1970s", 1970, 8, True, False, None),
    ("Tupelo Honey", "Van Morrison", "1970s", 1971, 8, True, False, "carmel"),
    ("Graceland", "Paul Simon", "1980s", 1986, 8, True, True, None),
    ("Diamonds on the Soles of Her Shoes", "Paul Simon", "1980s", 1986, 8, True, False, None),
    ("Slip Slidin' Away", "Paul Simon", "1970s", 1977, 8, True, False, None),
    ("Closer to Fine", "Indigo Girls", "1980s", 1989, 8, True, True, None),
    ("The Stable Song", "Gregory Alan Isakov", "2000s", 2007, 8, True, True, "carmel"),
    # ─── Salinas Valley / Woody Guthrie / Western ─────────────────────────────
    ("This Land Is Your Land", "Woody Guthrie", "1940s", 1945, 9, True, True, "salinas"),
    ("Pastures of Plenty", "Woody Guthrie", "1940s", 1941, 9, True, True, "salinas"),
    ("Deportee (Plane Wreck at Los Gatos)", "Woody Guthrie", "1940s", 1948, 9, True, True, "salinas"),
    ("Do Re Mi", "Woody Guthrie", "1940s", 1940, 8, True, False, "salinas"),
    ("Tom Joad", "Woody Guthrie", "1940s", 1940, 9, True, True, "salinas"),
    ("The Ghost of Tom Joad", "Bruce Springsteen", "1990s", 1995, 9, True, True, "salinas"),
    ("Youngstown", "Bruce Springsteen", "1990s", 1995, 8, True, False, "salinas"),
    ("Atlantic City", "Bruce Springsteen", "1980s", 1982, 9, True, True, None),
    ("This Hard Land", "Bruce Springsteen", "1990s", 1995, 8, True, False, "salinas"),
    ("Pancho and Lefty", "Townes Van Zandt", "1970s", 1972, 9, True, True, "salinas"),
    ("Tecumseh Valley", "Townes Van Zandt", "1960s", 1969, 8, True, False, "salinas"),
    ("If I Needed You", "Townes Van Zandt", "1970s", 1972, 8, True, False, None),
    ("Angel Flying Too Close to the Ground", "Willie Nelson", "1980s", 1980, 8, True, True, "salinas"),
    ("On the Road Again", "Willie Nelson", "1980s", 1980, 8, True, False, "salinas"),
    ("Blue Eyes Crying in the Rain", "Willie Nelson", "1970s", 1975, 8, True, False, "salinas"),
    ("El Paso", "Marty Robbins", "1950s", 1959, 8, True, True, "salinas"),
    ("Big Iron", "Marty Robbins", "1950s", 1959, 7, True, False, "salinas"),
    ("Cool Water", "Sons of the Pioneers", "1940s", 1941, 6, True, False, "salinas"),
    ("Tumbling Tumbleweeds", "Sons of the Pioneers", "1930s", 1934, 6, True, False, "salinas"),
    ("Rawhide", "Frankie Laine", "1950s", 1958, 7, True, True, "salinas"),
    ("Ghost Riders in the Sky", "Vaughn Monroe", "1940s", 1949, 7, True, True, "salinas"),
    ("Ring of Fire", "Johnny Cash", "1960s", 1963, 9, True, True, "salinas"),
    ("Folsom Prison Blues", "Johnny Cash", "1950s", 1955, 8, True, False, "salinas"),
    ("I Walk the Line", "Johnny Cash", "1950s", 1956, 8, True, False, None),
    ("Jackson", "Johnny Cash & June Carter Cash", "1960s", 1967, 7, True, False, "salinas"),
    ("Streets of Bakersfield", "Dwight Yoakam & Buck Owens", "1980s", 1988, 8, True, True, "salinas"),
    ("Guitars, Cadillacs", "Dwight Yoakam", "1980s", 1986, 7, True, False, "salinas"),
    ("Act Naturally", "Buck Owens", "1960s", 1963, 7, True, False, "salinas"),
    ("Together Again", "Buck Owens", "1960s", 1964, 7, True, False, "salinas"),
    ("Amarillo by Morning", "George Strait", "1980s", 1983, 7, True, True, "salinas"),
    ("The Cowboy Rides Away", "George Strait", "1980s", 1985, 7, True, False, "salinas"),
    ("Mama Tried", "Merle Haggard", "1960s", 1968, 8, True, True, "salinas"),
    ("California Cottonfields", "Merle Haggard", "1970s", 1976, 9, True, True, "salinas"),
    ("Working Man Blues", "Merle Haggard", "1960s", 1969, 7, True, False, "salinas"),
    ("Hungry Eyes", "Merle Haggard", "1960s", 1969, 7, True, False, "salinas"),
    ("De Colores", "Joan Baez", "1970s", 1974, 8, True, True, "salinas"),
    ("Gracias a la Vida", "Joan Baez", "1970s", 1974, 8, True, False, "salinas"),
    ("Volver, Volver", "Vicente Fernández", "1970s", 1972, 8, True, True, "salinas"),
    ("La Bamba", "Ritchie Valens", "1950s", 1958, 9, True, True, None),
    # ─── More classic rock / AAA ──────────────────────────────────────────────
    ("Go Your Own Way", "Fleetwood Mac", "1970s", 1977, 8, True, False, None),
    ("Rhiannon", "Fleetwood Mac", "1970s", 1975, 8, True, False, None),
    ("American Girl", "Tom Petty & The Heartbreakers", "1970s", 1976, 9, True, True, None),
    ("Free Fallin'", "Tom Petty", "1980s", 1989, 9, True, True, None),
    ("Wildflowers", "Tom Petty", "1990s", 1994, 9, True, True, "carmel"),
    ("You Wreck Me", "Tom Petty", "1990s", 1994, 7, True, False, None),
    ("Mary Jane's Last Dance", "Tom Petty & The Heartbreakers", "1990s", 1993, 8, True, False, None),
    ("Running on Empty", "Jackson Browne", "1970s", 1977, 8, True, True, None),
    ("These Days", "Jackson Browne", "1970s", 1973, 8, True, False, "carmel"),
    ("California Stars", "Billy Bragg & Wilco", "1990s", 1998, 8, True, True, None),
    ("Jesus, Etc.", "Wilco", "2000s", 2002, 8, True, True, None),
    ("This Must Be the Place (Naive Melody)", "Talking Heads", "1980s", 1983, 8, True, True, None),
    ("Once in a Lifetime", "Talking Heads", "1980s", 1980, 8, True, True, None),
    ("Fade Into You", "Mazzy Star", "1990s", 1993, 8, True, True, "carmel"),
    # ─── Local Santa Cruz / Monterey ──────────────────────────────────────────
    ("California Hustle", "SambaDá", "2010s", 2014, 6, True, False, "santa_cruz"),
    ("Another in Your Life", "AJ Lee & Blue Summit", "2020s", 2021, 7, True, True, "santa_cruz"),
    ("I'll Come Back", "AJ Lee & Blue Summit", "2020s", 2021, 7, True, True, "santa_cruz"),
    ("Harvest Moon", "AJ Lee & Blue Summit", "2020s", 2024, 6, True, False, "santa_cruz"),
    ("Army of One", "Drain", "2020s", 2020, 6, True, False, "santa_cruz"),
    ("Good Good Things", "Drain", "2020s", 2023, 6, True, False, "santa_cruz"),
    ("Hyper Vigilance", "Drain", "2020s", 2020, 6, True, False, "santa_cruz"),
    ("Watch You Burn", "Drain", "2020s", 2023, 6, True, False, "santa_cruz"),
    ("Paint My Face", "The Devil Makes Three", "2010s", 2013, 7, True, False, "santa_cruz"),
    ("Stranger", "The Devil Makes Three", "2010s", 2013, 7, True, False, "santa_cruz"),
    ("All Hail", "The Devil Makes Three", "2000s", 2009, 7, True, False, "santa_cruz"),
    ("Graveyard", "The Devil Makes Three", "2000s", 2002, 7, True, False, "santa_cruz"),
    ("Ganja Smuggling", "The Expendables", "2000s", 2007, 6, True, False, "santa_cruz"),
    ("Let Loose", "The Expendables", "2000s", 2004, 6, True, False, "santa_cruz"),
    ("Positive Mind", "The Expendables", "2000s", 2007, 6, True, False, "santa_cruz"),
    ("Sacrifice", "The Expendables", "2000s", 2004, 6, True, False, "santa_cruz"),
    ("Wells", "The Expendables", "2000s", 2004, 6, True, False, "santa_cruz"),
    ("The General", "Dispatch", "1990s", 1997, 8, True, True, "santa_cruz"),
    ("Bang Bang", "Dispatch", "1990s", 1997, 7, True, False, "santa_cruz"),
    ("Two Coins", "Dispatch", "1990s", 1997, 7, True, False, "santa_cruz"),
    ("A Credit to His Gender", "Good Riddance", "1990s", 1995, 6, True, False, "santa_cruz"),
    ("Dry Season", "Good Riddance", "1990s", 1995, 6, True, False, "santa_cruz"),
    ("One for the Braves", "Good Riddance", "1990s", 1997, 6, True, False, "santa_cruz"),
    ("Shadows of Defeat", "Good Riddance", "1990s", 1999, 6, True, False, "santa_cruz"),
    ("Caress Me Down", "Sublime", "1990s", 1996, 7, True, False, "santa_cruz"),
    ("Wrong Way", "Sublime", "1990s", 1996, 7, True, False, "santa_cruz"),
    ("Pull of the Moon", "The Mermen", "1990s", 1994, 6, True, False, "santa_cruz"),
    ("With No Definite Future and No Purpose Other Than to Prevail Somehow", "The Mermen", "1990s", 1995, 6, True, False, "santa_cruz"),
    ("Shed Some Skin", "Slow Gherkin", "1990s", 1998, 6, True, False, "santa_cruz"),
    ("Trapped Like Rats in Myers Flat", "Slow Gherkin", "1990s", 1998, 6, True, False, "santa_cruz"),
    ("Gotta Be a Better Way", "Lebo", "2010s", 2017, 5, True, False, "santa_cruz"),
    ("Ooh Girl", "Wooster", "2010s", 2013, 5, True, False, "santa_cruz"),
    ("Roses Are Red", "Wooster", "2010s", 2012, 5, True, False, "santa_cruz"),
    ("Rise Up", "Extra Large", "2000s", None, 5, True, False, "santa_cruz"),
    ("Sweetwater", "Extra Large", "2000s", None, 5, True, False, "santa_cruz"),
    ("SambaDá", "SambaDá", "2000s", 2009, 6, True, False, "santa_cruz"),
    ("Jonah's Whale", "Jonah and the Whalewatchers", "1990s", 1990, 7, True, True, "monterey"),
    ("Conscious Party", "Jonah and the Whalewatchers", "2000s", None, 6, True, False, "monterey"),
    ("No Worries", "Jonah and the Whalewatchers", "2000s", None, 6, True, False, "monterey"),
    # ─── Sublime ──────────────────────────────────────────────────────────────
    ("Badfish", "Sublime", "1990s", 1992, 8, True, True, "santa_cruz"),
    ("Doin' Time", "Sublime", "1990s", 1996, 8, True, True, "santa_cruz"),
    ("Santeria", "Sublime", "1990s", 1996, 8, True, True, "santa_cruz"),
    ("What I Got", "Sublime", "1990s", 1996, 8, True, True, "santa_cruz"),
    # ─── Big Sur atmospheric ───────────────────────────────────────────────────
    ("Road Trippin'", "Red Hot Chili Peppers", "1990s", 1999, 8, True, True, "big_sur"),
    ("Holocene", "Bon Iver", "2010s", 2011, 8, True, True, "big_sur"),
    ("Ends of the Earth", "Lord Huron", "2010s", 2012, 8, True, True, "big_sur"),
    ("Cold Little Heart", "Michael Kiwanuka", "2010s", 2016, 8, True, True, "big_sur"),
    ("Sleep on the Floor", "The Lumineers", "2010s", 2016, 7, True, False, "big_sur"),
    ("Big Black Car", "Gregory Alan Isakov", "2000s", 2009, 8, True, False, "big_sur"),
    # ─── Riptide / general Santa Cruz ─────────────────────────────────────────
    ("Riptide", "Vance Joy", "2010s", 2013, 7, True, True, "santa_cruz"),
    # ─── California songs (general) ───────────────────────────────────────────
    ("California Nights", "Best Coast", "2010s", 2015, 7, True, True, None),
    ("Time Spent in Los Angeles", "Dawes", "2010s", 2011, 8, True, True, None),
    ("California", "Lana Del Rey", "2010s", 2019, 7, True, True, None),
    ("Venice Bitch", "Lana Del Rey", "2010s", 2018, 7, True, True, None),
    ("West Coast", "Lana Del Rey", "2010s", 2014, 7, True, True, None),
    ("Dani California", "Red Hot Chili Peppers", "2000s", 2006, 8, True, True, None),
    ("Beverly Hills", "Weezer", "2000s", 2005, 6, True, True, None),
    ("California Love", "2Pac feat. Dr. Dre and Roger Troutman", "1990s", 1995, 8, True, True, None),
    ("Californication", "Red Hot Chili Peppers", "1990s", 1999, 8, True, True, None),
    ("Telegraph Ave.", "Childish Gambino", "2010s", 2013, 7, True, True, None),
    ("California Gurls", "Katy Perry feat. Snoop Dogg", "2010s", 2010, 6, True, True, None),
    ("Los Angeles", "The Midnight", "2010s", 2014, 7, True, True, None),
    ("San Francisco", "The Mowgli's", "2010s", 2012, 7, True, True, None),
    ("Ventura", "Lucinda Williams", "2000s", 2003, 7, True, True, None),
    ("California", "Phantom Planet", "2000s", 2002, 7, True, True, None),
    ("Santa Monica", "Everclear", "1990s", 1995, 7, True, True, None),
    ("Malibu", "Hole", "1990s", 1998, 7, True, True, None),
    ("San Francisco Knights", "People Under the Stairs", "1990s", 1998, 6, True, True, None),
    ("California", "Chappell Roan", "2020s", 2020, 7, True, False, None),
    ("Oakland", "Childish Gambino", "2010s", 2014, 6, True, False, None),
    ("California", "EMA", "2010s", 2011, 6, True, False, None),
    ("San Francisco", "Foxygen", "2010s", 2013, 6, True, False, None),
    ("California", "Grimes", "2010s", 2015, 6, True, False, None),
    ("The Bay", "Metronomy", "2010s", 2011, 6, True, False, None),
    ("Welcome to Hollywood", "Beyoncé and Jay-Z", "2000s", 2006, 6, True, False, None),
    ("Hollywood", "Madonna", "2000s", 2003, 6, True, False, None),
    ("California", "Rufus Wainwright", "2000s", 2001, 7, True, False, None),
    ("California One / Youth and Beauty Brigade", "The Decemberists", "2000s", 2002, 7, True, False, None),
    ("Going Back to Cali", "The Notorious B.I.G.", "1990s", 1997, 7, True, False, None),
    # ─── Contemporary California artists ──────────────────────────────────────
    ("Birds of a Feather", "Billie Eilish", "2020s", 2024, 8, True, True, None),
    ("Happier Than Ever", "Billie Eilish", "2020s", 2021, 8, True, True, None),
    ("What Was I Made For?", "Billie Eilish", "2020s", 2023, 8, True, True, None),
    ("The Steps", "HAIM", "2020s", 2020, 8, True, True, None),
    ("Not Like Us", "Kendrick Lamar", "2020s", 2024, 8, True, True, None),
    ("Drivers License", "Olivia Rodrigo", "2020s", 2021, 8, True, True, None),
    ("Good 4 U", "Olivia Rodrigo", "2020s", 2021, 7, True, True, None),
    ("Kyoto", "Phoebe Bridgers", "2020s", 2020, 8, True, True, None),
    ("Cinderella", "Remi Wolf", "2020s", 2024, 7, True, True, None),
    ("Photo ID", "Remi Wolf", "2020s", 2020, 7, True, True, None),
    ("No One Noticed", "The Marías", "2020s", 2024, 7, True, True, None),
    ("Boyfriend", "Best Coast", "2010s", 2010, 7, True, True, None),
    ("The Only Place", "Best Coast", "2010s", 2012, 7, True, True, None),
    ("Bad Guy", "Billie Eilish", "2010s", 2019, 8, True, True, None),
    ("Ocean Eyes", "Billie Eilish", "2010s", 2016, 8, True, True, None),
    ("Black Lipstick", "Chicano Batman", "2010s", 2014, 7, True, True, None),
    ("Friendship (Is a Small Boat in a Storm)", "Chicano Batman", "2010s", 2017, 7, True, True, None),
    ("First", "Cold War Kids", "2010s", 2014, 7, True, True, None),
    ("Lo Que Siento", "Cuco", "2010s", 2017, 7, True, True, None),
    ("Lover Is a Day", "Cuco", "2010s", 2016, 7, True, True, None),
    ("A Little Bit of Everything", "Dawes", "2010s", 2011, 8, True, True, None),
    ("Summer Girl", "HAIM", "2010s", 2019, 8, True, True, None),
    ("The Wire", "HAIM", "2010s", 2013, 8, True, True, None),
    ("Alright", "Kendrick Lamar", "2010s", 2015, 8, True, True, None),
    ("When Am I Gonna Lose You", "Local Natives", "2010s", 2019, 7, True, True, None),
    ("Motion Sickness", "Phoebe Bridgers", "2010s", 2017, 8, True, True, None),
    ("Goodie Bag", "Still Woozy", "2010s", 2017, 7, True, True, None),
    ("Cariño", "The Marías", "2010s", 2018, 7, True, True, None),
    ("EARFQUAKE", "Tyler, The Creator", "2010s", 2019, 7, True, True, None),
    ("See You Again", "Tyler, The Creator feat. Kali Uchis", "2010s", 2017, 7, True, True, None),
    ("Bad Habit", "Steve Lacy", "2020s", 2022, 8, True, True, None),
    ("Racist, Sexist Boy", "The Linda Lindas", "2020s", 2021, 7, True, True, None),
    ("Calling After Me", "Wallows", "2020s", 2024, 7, True, True, None),
    ("Catamaran", "Allah-Las", "2010s", 2012, 7, True, True, None),
    ("Come Down", "Anderson .Paak", "2010s", 2016, 8, True, True, None),
    ("Lost in a Crowd", "Fantastic Negrito", "2010s", 2015, 7, True, True, None),
    ("Never Catch Me", "Flying Lotus feat. Kendrick Lamar", "2010s", 2014, 8, True, True, None),
    ("Nights", "Frank Ocean", "2010s", 2016, 8, True, True, None),
    ("Pink + White", "Frank Ocean", "2010s", 2016, 8, True, True, None),
    ("Sweet Life", "Frank Ocean", "2010s", 2012, 8, True, True, None),
    ("Mariners Apartment Complex", "Lana Del Rey", "2010s", 2018, 7, True, True, None),
    ("The Sound of Sunshine", "Michael Franti & Spearhead", "2010s", 2010, 7, True, True, None),
    ("Dark Red", "Steve Lacy", "2010s", 2017, 7, True, True, None),
    ("One Million Lovers", "The Growlers", "2010s", 2013, 7, True, True, None),
    ("Them Changes", "Thundercat", "2010s", 2015, 7, True, True, None),
    ("A Walk", "Tycho", "2010s", 2011, 7, True, True, None),
    ("Awake", "Tycho", "2010s", 2014, 7, True, True, None),
    ("King of the Beach", "Wavves", "2010s", 2010, 7, True, True, None),
    ("Hang Me Up to Dry", "Cold War Kids", "2000s", 2006, 7, True, True, None),
    ("When My Time Comes", "Dawes", "2000s", 2009, 8, True, True, None),
    ("Airplanes", "Local Natives", "2000s", 2009, 7, True, True, None),
    ("City of Angels", "Ozomatli", "2000s", 2007, 7, True, True, None),
    ("Lost Cause", "Beck", "2000s", 2002, 7, True, True, None),
    ("American Idiot", "Green Day", "2000s", 2004, 7, True, True, None),
    ("Say Hey (I Love You)", "Michael Franti & Spearhead", "2000s", 2008, 7, True, True, None),
    ("Island in the Sun", "Weezer", "2000s", 2001, 7, True, True, None),
    ("Nuthin' but a G Thang", "Dr. Dre feat. Snoop Dogg", "1990s", 1992, 8, True, True, None),
    ("Still D.R.E.", "Dr. Dre feat. Snoop Dogg", "1990s", 1999, 8, True, True, None),
    ("Kiko and the Lavender Moon", "Los Lobos", "1990s", 1992, 7, True, True, None),
    ("Como Ves", "Ozomatli", "1990s", 1998, 7, True, True, None),
    ("Gin and Juice", "Snoop Dogg", "1990s", 1993, 7, True, True, None),
    ("Love and Hate in a Different Time", "Gabriels", "2020s", 2021, 8, True, True, None),
    ("Leave the Door Open", "Silk Sonic", "2020s", 2021, 8, True, True, None),
    ("Not Strong Enough", "boygenius", "2020s", 2023, 8, True, True, None),
    ("Loser", "Beck", "1990s", 1993, 7, True, True, None),
    ("Where It's At", "Beck", "1990s", 1996, 7, True, True, None),
    ("Midnight in a Perfect World", "DJ Shadow", "1990s", 1996, 7, True, True, None),
    ("Basket Case", "Green Day", "1990s", 1994, 7, True, True, None),
    ("When I Come Around", "Green Day", "1990s", 1994, 7, True, True, None),
    ("It Was a Good Day", "Ice Cube", "1990s", 1992, 8, True, True, None),
    ("Don't Speak", "No Doubt", "1990s", 1995, 8, True, True, None),
    ("Just a Girl", "No Doubt", "1990s", 1995, 8, True, True, None),
    ("Spiderwebs", "No Doubt", "1990s", 1995, 7, True, True, None),
    ("93 'Til Infinity", "Souls of Mischief", "1990s", 1993, 8, True, True, None),
    ("Time-Sick Son of a Grizzly Bear", "The Mother Hips", "1990s", 1995, 7, True, True, None),
    ("Regulate", "Warren G feat. Nate Dogg", "1990s", 1994, 8, True, True, None),
    ("Say It Ain't So", "Weezer", "1990s", 1994, 7, True, True, None),
    ("Am I Wrong", "Anderson .Paak feat. ScHoolboy Q", "2010s", 2016, 7, True, True, None),
    ("Space Song", "Beach House", "2010s", 2015, 8, True, True, None),
    ("The Joke", "Brandi Carlile", "2010s", 2017, 8, True, True, None),
    ("Redbone", "Childish Gambino", "2010s", 2016, 8, True, True, None),
    ("40oz. On Repeat", "FIDLAR", "2010s", 2015, 6, True, True, None),
    ("Pumped Up Kicks", "Foster the People", "2010s", 2010, 7, True, True, None),
    ("If We Were Vampires", "Jason Isbell and the 400 Unit", "2010s", 2017, 8, True, True, None),
    ("Honey", "Kehlani", "2010s", 2017, 7, True, True, None),
    ("The Recipe", "Kendrick Lamar feat. Dr. Dre", "2010s", 2012, 8, True, True, None),
    ("Money Trees", "Kendrick Lamar feat. Jay Rock", "2010s", 2012, 8, True, True, None),
    ("Ice El Hielo", "La Santa Cecilia", "2010s", 2013, 7, True, True, None),
    ("La Negra", "La Santa Cecilia", "2010s", 2013, 7, True, True, None),
    ("The Night We Met", "Lord Huron", "2010s", 2015, 8, True, True, None),
    ("Adorn", "Miguel", "2010s", 2012, 7, True, True, None),
    ("Freaks", "Surf Curse", "2010s", 2013, 7, True, True, None),
    ("Sweater Weather", "The Neighbourhood", "2010s", 2012, 7, True, True, None),
    ("Girlfriend", "Ty Segall", "2010s", 2010, 6, True, True, None),
    ("Are You Bored Yet?", "Wallows feat. Clairo", "2010s", 2019, 7, True, True, None),
    ("Lunch", "Billie Eilish", "2020s", 2024, 7, True, False, None),
    ("Lost Track", "HAIM", "2020s", 2022, 7, True, False, None),
    ("Deja Vu", "Olivia Rodrigo", "2020s", 2021, 7, True, False, None),
    ("Get Him Back!", "Olivia Rodrigo", "2020s", 2023, 7, True, False, None),
    ("Obsessed", "Olivia Rodrigo", "2020s", 2024, 7, True, False, None),
    ("Vampire", "Olivia Rodrigo", "2020s", 2023, 7, True, False, None),
    ("Garden Song", "Phoebe Bridgers", "2020s", 2020, 8, True, False, None),
    ("I Know the End", "Phoebe Bridgers", "2020s", 2020, 8, True, False, None),
    ("Disco Man", "Remi Wolf", "2020s", 2021, 7, True, False, None),
    ("Liquor Store", "Remi Wolf", "2020s", 2021, 7, True, False, None),
    ("Soup", "Remi Wolf", "2020s", 2024, 7, True, False, None),
    ("Again", "Still Woozy", "2020s", 2024, 7, True, False, None),
    ("Kenny", "Still Woozy", "2020s", 2021, 7, True, False, None),
    ("Window", "Still Woozy", "2020s", 2020, 7, True, False, None),
    ("Hush", "The Marías", "2020s", 2021, 7, True, False, None),
    ("Run Your Mouth", "The Marías", "2020s", 2024, 7, True, False, None),
    ("Sticky", "Tyler, The Creator", "2020s", 2024, 7, True, False, None),
    ("Sweet / I Thought You Wanted to Dance", "Tyler, The Creator", "2020s", 2021, 7, True, False, None),
    ("Little of Your Love", "HAIM", "2010s", 2017, 7, True, False, None),
    ("Want You Back", "HAIM", "2010s", 2017, 7, True, False, None),
    ("DNA.", "Kendrick Lamar", "2010s", 2017, 8, True, False, None),
    ("HUMBLE.", "Kendrick Lamar", "2010s", 2017, 8, True, False, None),
    ("King Kunta", "Kendrick Lamar", "2010s", 2015, 8, True, False, None),
    ("Swimming Pools (Drank)", "Kendrick Lamar", "2010s", 2012, 8, True, False, None),
    ("Dark Necessities", "Red Hot Chili Peppers", "2010s", 2016, 7, True, False, None),
    ("Only in My Dreams", "The Marías", "2010s", 2017, 7, True, False, None),
    ("A&W", "Lana Del Rey", "2020s", 2023, 7, True, False, None),
    ("Dragonball Durag", "Thundercat", "2020s", 2020, 7, True, False, None),
    ("Wake Up", "Arcade Fire", "2000s", 2004, 8, True, True, None),
    ("The Story", "Brandi Carlile", "2000s", 2007, 8, True, True, None),
    ("Short Skirt / Long Jacket", "Cake", "2000s", 2001, 7, True, True, None),
    ("Tell Me When to Go", "E-40 feat. Keak da Sneak", "2000s", 2006, 7, True, True, None),
    ("Home", "Edward Sharpe & The Magnetic Zeros", "2000s", 2009, 8, True, True, None),
    ("Dog Days Are Over", "Florence + The Machine", "2000s", 2008, 8, True, True, None),
    ("Hollaback Girl", "Gwen Stefani", "2000s", 2004, 6, True, True, None),
    ("Drive", "Incubus", "2000s", 2000, 8, True, True, None),
    ("Wish You Were Here", "Incubus", "2000s", 2001, 7, True, True, None),
    ("What's Golden", "Jurassic 5", "2000s", 2002, 7, True, True, None),
    ("Sunday Morning", "Maroon 5", "2000s", 2002, 7, True, True, None),
    ("Float On", "Modest Mouse", "2000s", 2004, 8, True, True, None),
    ("No One Knows", "Queens of the Stone Age", "2000s", 2002, 7, True, True, None),
    ("Everything in Its Right Place", "Radiohead", "2000s", 2000, 8, True, True, None),
    ("Such Great Heights", "The Postal Service", "2000s", 2003, 8, True, True, None),
    ("New Slang", "The Shins", "2000s", 2001, 8, True, True, None),
    ("Drops of Jupiter", "Train", "2000s", 2001, 7, True, True, None),
    ("Maps", "Yeah Yeah Yeahs", "2000s", 2003, 8, True, True, None),
    ("I Miss You", "blink-182", "2000s", 2003, 7, True, True, None),
    ("Hospital Beds", "Cold War Kids", "2000s", 2006, 7, True, False, None),
    ("Sun Hands", "Local Natives", "2000s", 2009, 7, True, False, None),
    ("Wide Eyes", "Local Natives", "2000s", 2009, 7, True, False, None),
    ("Saturday Night", "Ozomatli", "2000s", 2004, 6, True, False, None),
    ("By the Way", "Red Hot Chili Peppers", "2000s", 2002, 7, True, False, None),
    ("Snow (Hey Oh)", "Red Hot Chili Peppers", "2000s", 2006, 7, True, False, None),
    ("To Live & Die in L.A.", "2Pac", "1990s", 1996, 7, True, True, None),
    ("The Distance", "Cake", "1990s", 1996, 7, True, True, None),
    ("A Long December", "Counting Crows", "1990s", 1996, 8, True, True, None),
    ("Mr. Jones", "Counting Crows", "1990s", 1993, 8, True, True, None),
    ("Novocaine for the Soul", "Eels", "1990s", 1996, 7, True, True, None),
    ("Been Caught Stealing", "Jane's Addiction", "1990s", 1990, 7, True, True, None),
    ("I Got 5 on It", "Luniz", "1990s", 1995, 7, True, True, None),
    ("Teardrop", "Massive Attack", "1990s", 1998, 8, True, True, None),
    ("You Get What You Give", "New Radicals", "1990s", 1998, 7, True, True, None),
    ("Glory Box", "Portishead", "1990s", 1994, 8, True, True, None),
    ("Bulls on Parade", "Rage Against the Machine", "1990s", 1996, 7, True, True, None),
    ("Ruby Soho", "Rancid", "1990s", 1995, 7, True, True, None),
    ("Time Bomb", "Rancid", "1990s", 1995, 7, True, True, None),
    ("Story of My Life", "Social Distortion", "1990s", 1990, 7, True, True, None),
    ("Interstate Love Song", "Stone Temple Pilots", "1990s", 1994, 7, True, True, None),
    ("Semi-Charmed Life", "Third Eye Blind", "1990s", 1997, 7, True, True, None),
    ("All the Small Things", "blink-182", "1990s", 1999, 7, True, True, None),
    ("E-Pro", "Beck", "2000s", 2005, 6, True, False, None),
    ("Boulevard of Broken Dreams", "Green Day", "2000s", 2004, 7, True, False, None),
    ("Holiday", "Green Day", "2000s", 2004, 7, True, False, None),
    ("Minority", "Green Day", "2000s", 2000, 7, True, False, None),
    ("Hella Good", "No Doubt", "2000s", 2001, 6, True, False, None),
    ("Hash Pipe", "Weezer", "2000s", 2001, 6, True, False, None),
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

        existing_keys = set(
            db.execute(select(Song.normalized_title, Song.normalized_artist)).all()
        )

        now = utcnow()

        to_add = [
            s for s in SONGS_DATA
            if (normalize(s[0]), normalize(s[1])) not in existing_keys
        ]
        print(f"{len(SONGS_DATA)} songs in catalog, {len(existing_keys)} already in DB, adding {len(to_add)} new...")
        if not to_add:
            print("All songs already present.")
        song_objects = []
        for title, artist, decade, year, aaa, seeded, dj, town in to_add:
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

        if not to_add:
            print("No new songs to add. Done.")
            return

        # Aliases and demo data only seeded on first run (song_objects indices assume full catalog)
        if len(existing_keys) > 0:
            db.commit()
            print(f"Added {len(to_add)} new songs. Done.")
            return

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
