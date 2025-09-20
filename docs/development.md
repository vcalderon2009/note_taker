# Development Guide

This guide covers everything you need to know to contribute to the Note-Taker AI project.

## Development Environment Setup

### Prerequisites

- **Docker** (20.10+) and **Docker Compose** (2.0+)
- **Node.js** (18+) and **npm** (for frontend development)
- **Python** (3.11+) and **Poetry** (for backend development)
- **Git** (for version control)
- **Make** (optional, for convenience commands)

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/note-taker.git
   cd note_taker
   ```

2. **Start development environment**
   ```bash
   make dev
   ```

3. **Verify setup**
   ```bash
   make status
   make health
   ```

## Project Structure

```
note_taker/
├── src/
│   ├── frontend/                 # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/             # App Router pages
│   │   │   ├── components/      # React components
│   │   │   ├── hooks/           # Custom hooks
│   │   │   ├── services/        # API services
│   │   │   ├── types/           # TypeScript types
│   │   │   └── lib/             # Utility functions
│   │   ├── package.json
│   │   └── next.config.ts
│   └── api/                     # FastAPI backend
│       ├── app/
│       │   ├── routes/          # API routes
│       │   ├── models/          # Database models
│       │   ├── services/        # Business logic
│       │   ├── adapters/        # External integrations
│       │   └── middleware/      # Custom middleware
│       ├── alembic/             # Database migrations
│       └── pyproject.toml
├── docs/                        # Documentation
├── infra/                       # Infrastructure configs
├── scripts/                     # Utility scripts
└── Makefile                     # Development commands
```

## Development Workflow

### 1. Branch Strategy

We use GitFlow with the following branches:
- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: Feature development branches
- `hotfix/*`: Critical bug fixes

### 2. Creating a Feature

```bash
# Create and switch to feature branch
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name

# Make your changes
# ... code changes ...

# Commit your changes
git add .
git commit -m "feat: add your feature description"

# Push and create PR
git push origin feature/your-feature-name
```

### 3. Code Style and Standards

#### Frontend (TypeScript/React)

**Code Style:**
- Use TypeScript for all new code
- Follow React best practices and hooks patterns
- Use functional components with hooks
- Prefer composition over inheritance

**File Naming:**
- Components: `PascalCase.tsx` (e.g., `ChatContainer.tsx`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `useApi.ts`)
- Utilities: `camelCase.ts` (e.g., `utils.ts`)

**Example Component:**
```typescript
interface ChatContainerProps {
  conversationId: number;
  className?: string;
}

export function ChatContainer({ conversationId, className }: ChatContainerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Component logic here
  
  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Component JSX */}
    </div>
  );
}
```

#### Backend (Python/FastAPI)

**Code Style:**
- Follow PEP 8 guidelines
- Use type hints for all functions
- Use Pydantic models for data validation
- Follow FastAPI best practices

**File Naming:**
- Modules: `snake_case.py`
- Classes: `PascalCase`
- Functions: `snake_case`

**Example Service:**
```python
from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session

class NoteCreate(BaseModel):
    title: str
    body: str
    tags: List[str] = []

class NotesService:
    def __init__(self, db: Session):
        self.db = db
    
    async def create_note(self, note_data: NoteCreate, user_id: int) -> Note:
        # Service logic here
        pass
```

### 4. Testing

#### Frontend Testing

```bash
# Run frontend tests
cd src/frontend
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

**Test Structure:**
```typescript
// components/__tests__/ChatContainer.test.tsx
import { render, screen } from '@testing-library/react';
import { ChatContainer } from '../ChatContainer';

describe('ChatContainer', () => {
  it('renders chat interface', () => {
    render(<ChatContainer conversationId={1} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
});
```

#### Backend Testing

```bash
# Run backend tests
cd src/api
poetry run pytest

# Run tests with coverage
poetry run pytest --cov=app

# Run specific test file
poetry run pytest tests/test_notes.py
```

**Test Structure:**
```python
# tests/test_notes.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_note():
    response = client.post(
        "/api/notes",
        json={
            "title": "Test Note",
            "body": "Test content",
            "tags": ["test"]
        }
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Test Note"
```

### 5. Database Migrations

When making database changes:

```bash
# Create a new migration
cd src/api
poetry run alembic revision --autogenerate -m "Description of changes"

# Apply migrations
poetry run alembic upgrade head

# Rollback migration
poetry run alembic downgrade -1
```

**Migration Example:**
```python
# alembic/versions/0004_add_user_preferences.py
"""Add user preferences

Revision ID: 0004
Revises: 0003
Create Date: 2024-01-15 10:30:00.000000

"""
from alembic import op
import sqlalchemy as sa

def upgrade():
    op.create_table('user_preferences',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('theme', sa.String(50), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'])
    )

def downgrade():
    op.drop_table('user_preferences')
```

## Development Commands

### Make Commands

```bash
# Development
make dev              # Start with live logs
make start            # Start all services
make stop             # Stop all services
make restart          # Restart all services

# Building
make build            # Build all Docker images
make build-frontend   # Build frontend only
make build-api        # Build API only

# Testing
make test             # Run all tests
make test-frontend    # Run frontend tests
make test-api         # Run API tests

# Database
make migrate          # Run database migrations
make reset-db         # Reset database (dev only)
make db-shell         # Open database shell

# Utilities
make clean            # Clean up containers
make clean-all        # Clean everything including images
make logs             # View all logs
make status           # Check system status
```

### Individual Service Commands

#### Frontend Development

```bash
cd src/frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Run type checking
npm run type-check
```

#### Backend Development

```bash
cd src/api

# Install dependencies
poetry install

# Start development server
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run tests
poetry run pytest

# Run linting
poetry run ruff check .
poetry run black .

# Run type checking
poetry run mypy .
```

## Code Quality

### Linting and Formatting

#### Frontend
```bash
# ESLint for code quality
npm run lint

# Prettier for formatting
npm run format

# TypeScript checking
npm run type-check
```

#### Backend
```bash
# Ruff for linting
poetry run ruff check .

# Black for formatting
poetry run black .

# MyPy for type checking
poetry run mypy .
```

### Pre-commit Hooks

Install pre-commit hooks to ensure code quality:

```bash
# Install pre-commit
pip install pre-commit

# Install hooks
pre-commit install

# Run hooks manually
pre-commit run --all-files
```

## Debugging

### Frontend Debugging

1. **Browser DevTools**: Use React DevTools and browser debugging
2. **Console Logging**: Strategic console.log statements
3. **React Query DevTools**: Available in development mode
4. **Error Boundaries**: Catch and display errors gracefully

### Backend Debugging

1. **Logging**: Use structured logging with correlation IDs
2. **Debugger**: Use Python debugger (pdb) or IDE debugger
3. **API Testing**: Use FastAPI's automatic docs at `/docs`
4. **Database Inspection**: Use database admin tools

### Common Debugging Scenarios

#### API Connection Issues
```bash
# Check if API is running
curl http://localhost:8000/api/health

# Check API logs
make logs-api

# Test specific endpoint
curl -X POST http://localhost:8000/api/conversations \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Conversation"}'
```

#### Database Issues
```bash
# Check database connection
make db-shell

# Check migration status
cd src/api && poetry run alembic current

# Reset database if needed
make reset-db
```

#### Frontend Build Issues
```bash
# Clear Next.js cache
rm -rf src/frontend/.next

# Clear node_modules
rm -rf src/frontend/node_modules
npm install

# Check TypeScript errors
cd src/frontend && npm run type-check
```

## Performance Optimization

### Frontend Performance

1. **Code Splitting**: Use dynamic imports for large components
2. **Memoization**: Use React.memo and useMemo appropriately
3. **Bundle Analysis**: Analyze bundle size with webpack-bundle-analyzer
4. **Image Optimization**: Use Next.js Image component

### Backend Performance

1. **Database Queries**: Optimize SQL queries and use indexes
2. **Caching**: Implement appropriate caching strategies
3. **Async Operations**: Use async/await properly
4. **Connection Pooling**: Configure database connection pooling

## Security Considerations

### Frontend Security

1. **Input Validation**: Validate all user inputs
2. **XSS Prevention**: Sanitize user-generated content
3. **CSRF Protection**: Use CSRF tokens for state-changing operations
4. **Content Security Policy**: Implement CSP headers

### Backend Security

1. **Input Validation**: Use Pydantic for request validation
2. **SQL Injection**: Use SQLAlchemy ORM to prevent SQL injection
3. **Rate Limiting**: Implement rate limiting on all endpoints
4. **Authentication**: Implement proper authentication (future)

## Contributing Guidelines

### Pull Request Process

1. **Create Feature Branch**: From `develop` branch
2. **Write Tests**: Include tests for new functionality
3. **Update Documentation**: Update relevant documentation
4. **Code Review**: Ensure code meets quality standards
5. **Merge**: Merge to `develop` after approval

### Commit Message Format

Use conventional commits:

```
feat: add new feature
fix: fix bug
docs: update documentation
style: formatting changes
refactor: code refactoring
test: add or update tests
chore: maintenance tasks
```

### Code Review Checklist

- [ ] Code follows project style guidelines
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No breaking changes (or properly documented)
- [ ] Performance implications considered
- [ ] Security implications reviewed

## Troubleshooting

### Common Issues

#### Docker Issues
```bash
# Clean Docker system
docker system prune -a

# Rebuild images
make build

# Check Docker logs
docker-compose logs
```

#### Port Conflicts
```bash
# Check what's using ports
lsof -i :3000
lsof -i :8000

# Kill processes using ports
sudo kill -9 $(lsof -t -i:3000)
```

#### Database Connection Issues
```bash
# Check database container
docker-compose ps db

# Check database logs
docker-compose logs db

# Restart database
docker-compose restart db
```

### Getting Help

1. **Check Documentation**: Review this guide and API docs
2. **Search Issues**: Look for similar issues in GitHub
3. **Ask Questions**: Use GitHub Discussions
4. **Create Issue**: If you find a bug, create an issue

## Advanced Topics

### Custom AI Providers

To add a new AI provider:

1. Create adapter in `src/api/app/adapters/llm_provider/`
2. Implement the `LLMProvider` interface
3. Add configuration options
4. Update the provider factory

### Custom Middleware

To add custom middleware:

1. Create middleware in `src/api/app/middleware/`
2. Add to FastAPI app in `main.py`
3. Include tests for middleware
4. Update documentation

### Database Extensions

To add new database features:

1. Create migration for schema changes
2. Update ORM models
3. Add service layer methods
4. Create API endpoints
5. Add tests and documentation

---

Happy coding! 🚀 If you have questions or need help, don't hesitate to reach out through GitHub Discussions or create an issue.
