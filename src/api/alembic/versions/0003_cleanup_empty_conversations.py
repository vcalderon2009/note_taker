"""Cleanup empty conversations with no messages

Revision ID: 0003_cleanup_empty_conversations
Revises: 0002_add_categories
Create Date: 2025-09-18 13:20:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0003_cleanup_empty_conversations"
down_revision = "0002_add_categories"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Delete conversations that have no messages
    op.execute(
        sa.text(
            """
            DELETE FROM conversations c
            WHERE NOT EXISTS (
                SELECT 1 FROM messages m WHERE m.conversation_id = c.id
            );
            """
        )
    )


def downgrade() -> None:
    # No-op: cannot restore deleted conversations
    pass
