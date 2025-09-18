from __future__ import annotations

import sqlalchemy as sa

from alembic import op

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "conversations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("title", sa.String(length=255)),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "messages",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "conversation_id", sa.Integer(), sa.ForeignKey("conversations.id"), nullable=False
        ),  # noqa: E501
        sa.Column("role", sa.String(length=32), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("tokens_in", sa.Integer()),
        sa.Column("tokens_out", sa.Integer()),
        sa.Column("latency_ms", sa.Integer()),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "notes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("conversation_id", sa.Integer(), sa.ForeignKey("conversations.id")),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("tags", sa.JSON()),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "tasks",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("conversation_id", sa.Integer(), sa.ForeignKey("conversations.id")),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("due_at", sa.DateTime()),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="todo"),
        sa.Column("priority", sa.Integer()),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "tool_runs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "conversation_id", sa.Integer(), sa.ForeignKey("conversations.id"), nullable=False
        ),  # noqa: E501
        sa.Column("tool_name", sa.String(length=128), nullable=False),
        sa.Column("input_json", sa.JSON()),
        sa.Column("output_json", sa.JSON()),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="success"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("action", sa.String(length=64), nullable=False),
        sa.Column("entity_type", sa.String(length=64), nullable=False),
        sa.Column("entity_id", sa.Integer()),
        sa.Column("metadata_json", sa.JSON()),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )

    op.create_index("idx_tasks_due_status", "tasks", ["due_at", "status"])
    op.create_index("idx_notes_created", "notes", ["created_at"])


def downgrade() -> None:
    op.drop_index("idx_notes_created", table_name="notes")
    op.drop_index("idx_tasks_due_status", table_name="tasks")
    op.drop_table("audit_logs")
    op.drop_table("tool_runs")
    op.drop_table("tasks")
    op.drop_table("notes")
    op.drop_table("messages")
    op.drop_table("conversations")
    op.drop_table("users")
