# Database Schema

This document provides a comprehensive overview of the Note-Taker AI database schema, including tables, relationships, and data models.

## Overview

The database uses PostgreSQL and follows a normalized design with clear relationships between entities. The schema supports the core functionality of conversations, messages, notes, tasks, and user management.

## Core Tables

### Users Table
Stores user information and authentication data.

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
```

**Fields:**
- `id`: Primary key
- `email`: User's email address (unique)
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp

### Conversations Table
Stores conversation metadata and context.

```sql
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);
CREATE INDEX idx_conversations_title ON conversations(title);
```

**Fields:**
- `id`: Primary key
- `user_id`: Foreign key to users table
- `title`: Conversation title
- `created_at`: Conversation start timestamp
- `updated_at`: Last activity timestamp

### Messages Table
Stores individual messages within conversations.

```sql
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    tokens_in INTEGER DEFAULT 0,
    tokens_out INTEGER DEFAULT 0,
    latency_ms INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_role ON messages(role);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at);
```

**Fields:**
- `id`: Primary key
- `conversation_id`: Foreign key to conversations table
- `role`: Message role (user, assistant, system)
- `content`: Message content
- `tokens_in`: Input tokens consumed
- `tokens_out`: Output tokens generated
- `latency_ms`: Processing time in milliseconds
- `created_at`: Message timestamp

### Notes Table
Stores organized notes and information.

```sql
CREATE TABLE notes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_conversation_id ON notes(conversation_id);
CREATE INDEX idx_notes_created_at ON notes(created_at);
CREATE INDEX idx_notes_updated_at ON notes(updated_at);
CREATE INDEX idx_notes_tags ON notes USING GIN(tags);
CREATE INDEX idx_notes_title ON notes(title);
```

**Fields:**
- `id`: Primary key
- `user_id`: Foreign key to users table
- `conversation_id`: Foreign key to conversations table (nullable)
- `title`: Note title
- `body`: Note content
- `tags`: Array of tags
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

### Tasks Table
Stores actionable items and to-dos.

```sql
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed', 'cancelled')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    due_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_conversation_id ON tasks(conversation_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_at ON tasks(due_at);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_user_due ON tasks(user_id, due_at);
```

**Fields:**
- `id`: Primary key
- `user_id`: Foreign key to users table
- `conversation_id`: Foreign key to conversations table (nullable)
- `title`: Task title
- `description`: Task description
- `status`: Task status (todo, in_progress, completed, cancelled)
- `priority`: Task priority (low, medium, high)
- `due_at`: Due date and time
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

## Supporting Tables

### Categories Table
Stores note and task categories.

```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6',
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_name ON categories(name);
CREATE UNIQUE INDEX idx_categories_user_name ON categories(user_id, name);
```

**Fields:**
- `id`: Primary key
- `name`: Category name
- `color`: Category color (hex code)
- `user_id`: Foreign key to users table
- `created_at`: Creation timestamp

### Tool Runs Table
Stores AI tool execution logs.

```sql
CREATE TABLE tool_runs (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    tool_name VARCHAR(100) NOT NULL,
    input_json JSONB NOT NULL,
    output_json JSONB,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_tool_runs_conversation_id ON tool_runs(conversation_id);
CREATE INDEX idx_tool_runs_tool_name ON tool_runs(tool_name);
CREATE INDEX idx_tool_runs_status ON tool_runs(status);
CREATE INDEX idx_tool_runs_created_at ON tool_runs(created_at);
```

**Fields:**
- `id`: Primary key
- `conversation_id`: Foreign key to conversations table
- `tool_name`: Name of the tool executed
- `input_json`: Tool input parameters
- `output_json`: Tool output results
- `status`: Execution status
- `error_message`: Error message if failed
- `created_at`: Start timestamp
- `completed_at`: Completion timestamp

### Audit Logs Table
Stores system audit and activity logs.

```sql
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER,
    metadata_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
```

**Fields:**
- `id`: Primary key
- `user_id`: Foreign key to users table (nullable)
- `action`: Action performed
- `entity_type`: Type of entity affected
- `entity_id`: ID of entity affected
- `metadata_json`: Additional metadata
- `created_at`: Action timestamp

## Relationships

### Entity Relationship Diagram

```
Users (1) ──── (N) Conversations
Users (1) ──── (N) Notes
Users (1) ──── (N) Tasks
Users (1) ──── (N) Categories
Users (1) ──── (N) Audit Logs

Conversations (1) ──── (N) Messages
Conversations (1) ──── (N) Notes
Conversations (1) ──── (N) Tasks
Conversations (1) ──── (N) Tool Runs

Notes (N) ──── (N) Categories (many-to-many)
Tasks (N) ──── (N) Categories (many-to-many)
```

### Foreign Key Constraints

```sql
-- Users to Conversations
ALTER TABLE conversations 
ADD CONSTRAINT fk_conversations_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Users to Notes
ALTER TABLE notes 
ADD CONSTRAINT fk_notes_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Users to Tasks
ALTER TABLE tasks 
ADD CONSTRAINT fk_tasks_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Conversations to Messages
ALTER TABLE messages 
ADD CONSTRAINT fk_messages_conversation_id 
FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;

-- Conversations to Notes
ALTER TABLE notes 
ADD CONSTRAINT fk_notes_conversation_id 
FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL;

-- Conversations to Tasks
ALTER TABLE tasks 
ADD CONSTRAINT fk_tasks_conversation_id 
FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL;
```

## Data Types and Constraints

### Enums and Check Constraints

```sql
-- Message roles
ALTER TABLE messages 
ADD CONSTRAINT chk_messages_role 
CHECK (role IN ('user', 'assistant', 'system'));

-- Task status
ALTER TABLE tasks 
ADD CONSTRAINT chk_tasks_status 
CHECK (status IN ('todo', 'in_progress', 'completed', 'cancelled'));

-- Task priority
ALTER TABLE tasks 
ADD CONSTRAINT chk_tasks_priority 
CHECK (priority IN ('low', 'medium', 'high'));

-- Tool run status
ALTER TABLE tool_runs 
ADD CONSTRAINT chk_tool_runs_status 
CHECK (status IN ('pending', 'running', 'completed', 'failed'));
```

### JSONB Fields

The schema uses JSONB for flexible data storage:

```sql
-- Notes tags (array of strings)
tags TEXT[] DEFAULT '{}'

-- Tool input/output (flexible JSON)
input_json JSONB NOT NULL
output_json JSONB

-- Audit metadata (flexible JSON)
metadata_json JSONB
```

## Indexes and Performance

### Primary Indexes
- All primary keys are automatically indexed
- Foreign keys have indexes for join performance

### Composite Indexes
- `(user_id, status)` on tasks for user task filtering
- `(user_id, due_at)` on tasks for due date queries
- `(conversation_id, created_at)` on messages for chronological ordering

### GIN Indexes
- `tags` on notes for array operations
- `input_json` and `output_json` on tool_runs for JSON queries

### Query Optimization Examples

```sql
-- Get user's recent tasks
SELECT * FROM tasks 
WHERE user_id = 1 
ORDER BY created_at DESC 
LIMIT 10;

-- Get overdue tasks
SELECT * FROM tasks 
WHERE user_id = 1 
AND due_at < NOW() 
AND status != 'completed';

-- Search notes by tags
SELECT * FROM notes 
WHERE user_id = 1 
AND 'meeting' = ANY(tags);

-- Get conversation with message count
SELECT c.*, COUNT(m.id) as message_count
FROM conversations c
LEFT JOIN messages m ON c.id = m.conversation_id
WHERE c.user_id = 1
GROUP BY c.id
ORDER BY c.created_at DESC;
```

## Migration Strategy

### Alembic Migrations
The database uses Alembic for schema migrations:

```python
# Example migration
def upgrade():
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )

def downgrade():
    op.drop_table('users')
```

### Migration Commands
```bash
# Create new migration
alembic revision --autogenerate -m "Add user preferences"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

## Backup and Recovery

### Backup Strategy
```bash
# Full database backup
pg_dump -h localhost -U note_taker_user note_taker_prod > backup.sql

# Compressed backup
pg_dump -h localhost -U note_taker_user note_taker_prod | gzip > backup.sql.gz

# Schema only
pg_dump -h localhost -U note_taker_user --schema-only note_taker_prod > schema.sql
```

### Recovery
```bash
# Restore from backup
psql -h localhost -U note_taker_user note_taker_prod < backup.sql

# Restore from compressed backup
gunzip -c backup.sql.gz | psql -h localhost -U note_taker_user note_taker_prod
```

## Security Considerations

### Data Protection
- All sensitive data encrypted at rest
- Connection encryption (SSL/TLS)
- Regular security updates

### Access Control
- User-based data isolation
- Row-level security (future)
- Audit logging for all changes

### Privacy
- PII redaction before AI processing
- Configurable data retention
- User data export/deletion

## Future Enhancements

### Planned Schema Changes
1. **User Preferences**: User settings and preferences
2. **Note Categories**: Many-to-many relationship
3. **Task Dependencies**: Task relationship tracking
4. **File Attachments**: File storage and metadata
5. **Search Indexes**: Full-text search capabilities

### Performance Optimizations
1. **Partitioning**: Time-based table partitioning
2. **Materialized Views**: Pre-computed aggregations
3. **Read Replicas**: Read-only database copies
4. **Connection Pooling**: Efficient connection management

---

This schema provides a solid foundation for the Note-Taker AI system while being designed to scale and evolve with future requirements.
