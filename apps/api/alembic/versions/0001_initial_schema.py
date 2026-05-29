"""Initial schema for KRML 250.

Revision ID: 0001
Revises:
Create Date: 2026-05-29
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # participants
    op.create_table(
        "participants",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("email", sa.String(320), nullable=False),
        sa.Column("email_verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("city", sa.String(200), nullable=False),
        sa.Column("zip", sa.String(20), nullable=False),
        sa.Column(
            "town",
            sa.Enum(
                "carmel", "monterey", "pacific_grove", "seaside", "marina",
                "salinas", "santa_cruz", "watsonville", "castroville", "other",
                name="townenum",
            ),
            nullable=False,
        ),
        sa.Column("consent_campaign_rules", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("consent_publish_submission", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("verification_token", sa.String(200), nullable=True),
        sa.Column("verification_token_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("has_used_edit", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )

    # songs
    op.create_table(
        "songs",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("canonical_title", sa.String(500), nullable=False),
        sa.Column("canonical_artist", sa.String(500), nullable=False),
        sa.Column("normalized_title", sa.String(500), nullable=False),
        sa.Column("normalized_artist", sa.String(500), nullable=False),
        sa.Column("decade", sa.String(20), nullable=True),
        sa.Column("release_year", sa.Integer(), nullable=True),
        sa.Column("town_tag", sa.String(100), nullable=True),
        sa.Column("aaa_fit_score", sa.Integer(), nullable=True),
        sa.Column("krml_seeded", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("dj_pick", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column(
            "status",
            sa.Enum("pending", "approved", "excluded", "needs_review", name="songstatusenum"),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    # song_aliases
    op.create_table(
        "song_aliases",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("song_id", sa.String(), nullable=False),
        sa.Column("submitted_title", sa.String(500), nullable=False),
        sa.Column("submitted_artist", sa.String(500), nullable=False),
        sa.Column("normalized_title", sa.String(500), nullable=False),
        sa.Column("normalized_artist", sa.String(500), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["song_id"], ["songs.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    # submissions
    op.create_table(
        "submissions",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("participant_id", sa.String(), nullable=False),
        sa.Column("song_id", sa.String(), nullable=False),
        sa.Column("submission_slot", sa.Integer(), nullable=False),
        sa.Column("why_text", sa.Text(), nullable=False),
        sa.Column("town_tag", sa.String(100), nullable=True),
        sa.Column("decade_tag", sa.String(20), nullable=True),
        sa.Column("active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("original_submission_id", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["participant_id"], ["participants.id"]),
        sa.ForeignKeyConstraint(["song_id"], ["songs.id"]),
        sa.ForeignKeyConstraint(["original_submission_id"], ["submissions.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    # submission_edits
    op.create_table(
        "submission_edits",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("participant_id", sa.String(), nullable=False),
        sa.Column("original_submission_id", sa.String(), nullable=False),
        sa.Column("replacement_submission_id", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["participant_id"], ["participants.id"]),
        sa.ForeignKeyConstraint(["original_submission_id"], ["submissions.id"]),
        sa.ForeignKeyConstraint(["replacement_submission_id"], ["submissions.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    # swipe_votes
    op.create_table(
        "swipe_votes",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("participant_id", sa.String(), nullable=False),
        sa.Column("song_id", sa.String(), nullable=False),
        sa.Column(
            "vote",
            sa.Enum("yes", "no", "unknown", name="swipevoteenum"),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["participant_id"], ["participants.id"]),
        sa.ForeignKeyConstraint(["song_id"], ["songs.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("participant_id", "song_id"),
    )

    # song_defenses
    op.create_table(
        "song_defenses",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("participant_id", sa.String(), nullable=False),
        sa.Column("song_id", sa.String(), nullable=False),
        sa.Column("defense_text", sa.String(500), nullable=False),
        sa.Column(
            "approval_status",
            sa.Enum("pending", "approved", "rejected", name="defensestatusenum"),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("approved_excerpt", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["participant_id"], ["participants.id"]),
        sa.ForeignKeyConstraint(["song_id"], ["songs.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    # predictions
    op.create_table(
        "predictions",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("participant_id", sa.String(), nullable=False),
        sa.Column("song_1_id", sa.String(), nullable=False),
        sa.Column("song_2_id", sa.String(), nullable=False),
        sa.Column("song_3_id", sa.String(), nullable=False),
        sa.Column("song_4_id", sa.String(), nullable=False),
        sa.Column("song_5_id", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("locked_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["participant_id"], ["participants.id"]),
        sa.ForeignKeyConstraint(["song_1_id"], ["songs.id"]),
        sa.ForeignKeyConstraint(["song_2_id"], ["songs.id"]),
        sa.ForeignKeyConstraint(["song_3_id"], ["songs.id"]),
        sa.ForeignKeyConstraint(["song_4_id"], ["songs.id"]),
        sa.ForeignKeyConstraint(["song_5_id"], ["songs.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("participant_id"),
    )

    # dj_notes
    op.create_table(
        "dj_notes",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("dj_name", sa.String(200), nullable=False),
        sa.Column("song_id", sa.String(), nullable=False),
        sa.Column("note", sa.Text(), nullable=False),
        sa.Column("display_publicly", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["song_id"], ["songs.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    # sponsor_placements
    op.create_table(
        "sponsor_placements",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("sponsor_name", sa.String(300), nullable=False),
        sa.Column("placement_type", sa.String(100), nullable=False),
        sa.Column("image_url", sa.String(1000), nullable=True),
        sa.Column("link_url", sa.String(1000), nullable=True),
        sa.Column("active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    # campaign_settings
    op.create_table(
        "campaign_settings",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("key", sa.String(200), nullable=False),
        sa.Column("value", sa.Text(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("key"),
    )


def downgrade() -> None:
    op.drop_table("campaign_settings")
    op.drop_table("sponsor_placements")
    op.drop_table("dj_notes")
    op.drop_table("predictions")
    op.drop_table("song_defenses")
    op.drop_table("swipe_votes")
    op.drop_table("submission_edits")
    op.drop_table("submissions")
    op.drop_table("song_aliases")
    op.drop_table("songs")
    op.drop_table("participants")
    # Drop enums
    sa.Enum(name="townenum").drop(op.get_bind())
    sa.Enum(name="songstatusenum").drop(op.get_bind())
    sa.Enum(name="swipevoteenum").drop(op.get_bind())
    sa.Enum(name="defensestatusenum").drop(op.get_bind())
