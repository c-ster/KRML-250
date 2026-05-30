"""KRML 250 API — main FastAPI application."""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import (
    admin,
    defenses,
    leaderboard,
    participants,
    predictions,
    songs,
    submissions,
    swipe,
)

logging.basicConfig(level=getattr(logging, settings.log_level.upper(), logging.INFO))
logger = logging.getLogger(__name__)


app = FastAPI(
    title="KRML 250 API",
    version="1.0.0",
    description="The Soundtrack of the Monterey Bay — listener-driven music campaign",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PREFIX = "/api/v1"
app.include_router(participants.router, prefix=PREFIX)
app.include_router(songs.router, prefix=PREFIX)
app.include_router(submissions.router, prefix=PREFIX)
app.include_router(swipe.router, prefix=PREFIX)
app.include_router(defenses.router, prefix=PREFIX)
app.include_router(predictions.router, prefix=PREFIX)
app.include_router(leaderboard.router, prefix=PREFIX)
app.include_router(admin.router, prefix=PREFIX)


@app.get("/health")
def health():
    return {"status": "ok", "service": "krml-250-api"}
