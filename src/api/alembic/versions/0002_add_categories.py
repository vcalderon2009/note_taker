"""Add categories table and update notes/tasks

Revision ID: 0002_add_categories
Revises: 0001_initial
Create Date: 2025-09-18 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0002_add_categories'
down_revision = '0001_initial'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create categories table
    op.create_table('categories',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('color', sa.String(length=7), nullable=True),
        sa.Column('icon', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create unique index on user_id, name
    op.create_index('ix_categories_user_name', 'categories', ['user_id', 'name'], unique=True)
    
    # Add category_id column to notes table
    op.add_column('notes', sa.Column('category_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_notes_category_id', 'notes', 'categories', ['category_id'], ['id'])
    
    # Add category_id column to tasks table
    op.add_column('tasks', sa.Column('category_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_tasks_category_id', 'tasks', 'categories', ['category_id'], ['id'])


def downgrade() -> None:
    # Remove foreign key constraints and columns
    op.drop_constraint('fk_tasks_category_id', 'tasks', type_='foreignkey')
    op.drop_column('tasks', 'category_id')
    
    op.drop_constraint('fk_notes_category_id', 'notes', type_='foreignkey')
    op.drop_column('notes', 'category_id')
    
    # Drop categories table
    op.drop_index('ix_categories_user_name', table_name='categories')
    op.drop_table('categories')
