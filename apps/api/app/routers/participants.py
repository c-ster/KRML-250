"""Participant registration, verification, and profile routes."""
import logging
import secrets
from datetime import datetime, timedelta, timezone

logger = logging.getLogger(__name__)

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth import create_access_token, get_current_participant
from app.core.config import settings
from app.core.database import get_db
from app.models import orm
from app.models.schemas import (
    ParticipantOut,
    ParticipantRegister,
    ParticipantVerify,
    TokenResponse,
)
from app.services.email import send_verification_email

router = APIRouter(prefix="/participants", tags=["participants"])


def normalize(s: str) -> str:
    return s.strip().lower()


@router.post("", response_model=ParticipantOut, status_code=status.HTTP_201_CREATED)
def register(body: ParticipantRegister, db: Session = Depends(get_db)):
    existing = db.execute(
        select(orm.Participant).where(
            orm.Participant.email == body.email.lower().strip()
        )
    ).scalar_one_or_none()

    token = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(hours=24)

    if existing:
        if existing.email_verified_at:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered and verified. Use /participants/verify to log in.",
            )
        existing.verification_token = token
        existing.verification_token_expires_at = expires
        db.commit()
        try:
            send_verification_email(existing.email, existing.name, token)
        except Exception as exc:
            logger.error("Failed to send verification email to %s: %s", existing.email, exc)
        out = ParticipantOut.model_validate(existing)
        if settings.email_provider.lower() == "none":
            out.dev_verify_url = f"{settings.frontend_url}/250/verify/{token}"
        return out

    participant = orm.Participant(
        name=body.name.strip(),
        email=body.email.lower().strip(),
        city=body.city.strip(),
        zip=body.zip.strip(),
        town=body.town,
        consent_campaign_rules=body.consent_campaign_rules,
        consent_publish_submission=body.consent_publish_submission,
        verification_token=token,
        verification_token_expires_at=expires,
    )
    db.add(participant)
    db.commit()
    db.refresh(participant)

    try:
        send_verification_email(participant.email, participant.name, token)
    except Exception as exc:
        logger.error("Failed to send verification email to %s: %s", participant.email, exc)
    out = ParticipantOut.model_validate(participant)
    if settings.email_provider.lower() == "none":
        out.dev_verify_url = f"{settings.frontend_url}/250/verify/{token}"
    return out


@router.post("/verify", response_model=TokenResponse)
def verify(body: ParticipantVerify, db: Session = Depends(get_db)):
    participant = db.execute(
        select(orm.Participant).where(
            orm.Participant.verification_token == body.token
        )
    ).scalar_one_or_none()

    if not participant:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    now = datetime.now(timezone.utc)
    if participant.verification_token_expires_at and participant.verification_token_expires_at < now:
        raise HTTPException(status_code=400, detail="Token has expired. Please register again.")

    participant.email_verified_at = now
    participant.verification_token = None
    participant.verification_token_expires_at = None
    db.commit()
    db.refresh(participant)

    access_token = create_access_token(participant.id)
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        participant=ParticipantOut.model_validate(participant),
    )


@router.get("/me", response_model=ParticipantOut)
def me(current: orm.Participant = Depends(get_current_participant)):
    return current
