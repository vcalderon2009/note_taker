# 🤖 Note-Taker AI Assistant

An intelligent, conversational AI assistant that acts as your second brain, seamlessly capturing, organizing, and acting upon your thoughts, tasks, and plans. Transform unstructured conversational input into structured data with both short-term and long-term memory capabilities.

## 🌟 Overview

Note-Taker AI is designed to reduce cognitive load by providing a natural, conversational interface for productivity management. Instead of switching between multiple apps, users can simply "talk" to the AI assistant, which intelligently processes their input and organizes it into notes, tasks, and structured information.

### Core Value Proposition
- **Reduced Friction**: Natural conversation replaces manual organization
- **Contextual Memory**: Remembers past conversations and context
- **Intelligent Organization**: Automatically structures brain dumps and complex inputs
- **Proactive Assistance**: Evolves from capture tool to intelligent assistant

## 🚀 Current Features

### Phase 1: MVP - Conversational Capture & Organization ✅

**Core Functionality:**
- **Chat Interface**: Clean, responsive chat UI built with Next.js and Tailwind CSS
- **Intent Recognition**: AI-powered classification of user input (notes, tasks, brain dumps, chit-chat)
- **Smart Organization**: Automatically structures complex inputs into organized notes with titles and sections
- **Task Management**: Create, view, and manage tasks through conversation
- **Conversation Memory**: Short-term memory within conversations for contextual follow-ups
- **Thinking Visualization**: Real-time display of AI reasoning process (similar to Google's Gemini)

**Technical Implementation:**
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: FastAPI with Python 3.11+, SQLAlchemy ORM
- **Database**: PostgreSQL with Alembic migrations
- **AI Integration**: Ollama (local) and OpenAI support
- **State Management**: React Query for server state
- **Real-time Updates**: Optimistic UI updates with error handling

### Current Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (Next.js)     │◄──►│   (FastAPI)     │◄──►│   (PostgreSQL)  │
│                 │    │                 │    │                 │
│ • Chat UI       │    │ • Orchestrator  │    │ • Conversations │
│ • Sidebar       │    │ • LLM Adapter   │    │ • Messages      │
│ • Thinking UI   │    │ • Services      │    │ • Notes         │
│ • Dashboard     │    │ • Rate Limiting │    │ • Tasks         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   AI Provider   │
                       │   (Ollama/      │
                       │    OpenAI)      │
                       └─────────────────┘
```

## 🛠 Technology Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **State Management**: React Query (TanStack Query)
- **UI Components**: Custom component library with Lucide React icons
- **HTTP Client**: Axios

### Backend
- **Framework**: FastAPI
- **Language**: Python 3.11+
- **ORM**: SQLAlchemy 2.0
- **Database**: PostgreSQL
- **Migrations**: Alembic
- **Validation**: Pydantic 2.8+
- **Logging**: Structlog

### AI & Infrastructure
- **LLM Providers**: Ollama (local), OpenAI
- **Containerization**: Docker & Docker Compose
- **Process Management**: Makefile with automated startup
- **Development**: Poetry for Python dependencies, npm for Node.js

## 📁 Project Structure

```
note_taker/
├── src/
│   ├── frontend/                 # Next.js frontend application
│   │   ├── src/
│   │   │   ├── app/             # App Router pages
│   │   │   ├── components/      # React components
│   │   │   │   ├── chat/        # Chat interface components
│   │   │   │   ├── dashboard/   # Dashboard components
│   │   │   │   ├── layout/      # Layout components
│   │   │   │   ├── sidebar/     # Sidebar components
│   │   │   │   └── ui/          # Reusable UI components
│   │   │   ├── hooks/           # Custom React hooks
│   │   │   ├── services/        # API services
│   │   │   └── types/           # TypeScript type definitions
│   │   └── package.json
│   └── api/                     # FastAPI backend application
│       ├── app/
│       │   ├── routes/          # API route handlers
│       │   ├── models/          # Database models and schemas
│       │   ├── services/        # Business logic services
│       │   ├── adapters/        # External service adapters
│       │   ├── middleware/      # Custom middleware
│       │   └── prompts/         # AI prompt management
│       ├── alembic/             # Database migrations
│       └── pyproject.toml
├── infra/
│   └── compose/                 # Docker Compose configurations
├── scripts/                     # Utility scripts
├── pre-planning/               # Project planning documents
└── Makefile                    # Development commands
```

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Make (optional, for convenience commands)
- 4GB+ RAM (8GB+ recommended)
- 6GB+ disk space for AI models

### One-Command Setup
```bash
# Clone the repository
git clone <repository-url>
cd note_taker

# Start the entire system
make start
```

This will:
- Download and start all required services
- Download AI models (first time only, ~5-10 minutes)
- Start the application at http://localhost:3000
- Provide real-time startup progress

### Manual Setup
```bash
# Start services
docker-compose up -d

# Check status
make status

# View logs
make logs
```

### Access Points
- **Application**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/health

## 🎯 Roadmap

### Phase 2: Intelligent Assistant - Memory & Dashboard (Planned)
- **Long-term Memory**: Vector database integration for persistent context
- **Enhanced Dashboard**: Unified view of tasks, notes, and insights
- **Advanced Task Management**: Status updates, deadlines, reminders
- **Memory Retrieval**: Semantic search across past conversations
- **Thinking UI Enhancement**: Detailed reasoning visualization

### Phase 3: Multi-Agent System (Future)
- **Specialized Agents**: Dedicated agents for notes, tasks, and calendar
- **Agent-to-Agent Communication**: A2A protocol for agent collaboration
- **External Integrations**: Google Calendar, email, and other productivity tools
- **Proactive Suggestions**: Background analysis and intelligent recommendations
- **Internet Access**: Controlled web search and information gathering

## 🔧 Development

### Available Commands
```bash
# Development
make dev          # Start with live logs
make build        # Build Docker images
make clean        # Clean up containers
make restart      # Restart all services

# Monitoring
make status       # Show system status
make health       # Check health endpoints
make logs         # View all logs
make logs-api     # View API logs only

# Database
make migrate      # Run database migrations
make reset-db     # Reset database (development only)
```

### Development Workflow
1. **Frontend Changes**: Edit files in `src/frontend/src/`
2. **Backend Changes**: Edit files in `src/api/app/`
3. **Database Changes**: Create migrations in `src/api/alembic/versions/`
4. **Testing**: Run tests with `make test` (when implemented)

## 🏗 Architecture Decisions

### Design Principles
- **User-first**: Fast, low-friction capture; clarity over cleverness
- **Thin slices**: Ship minimal verticals that deliver end-to-end value
- **Stable interfaces**: Abstract LLMs, tools, and storage behind clean boundaries
- **Observability**: Measure quality, latency, and failures from day 1
- **Bias to simplicity**: Prefer reliable tech for core paths

### Key Technical Decisions
- **Idempotency**: All mutating endpoints support idempotency keys
- **Structured Output**: AI responses conform to JSON schemas with validation
- **Circuit Breakers**: Bounded timeouts and retry logic for external calls
- **Background Jobs**: Lightweight job processing for summarization and embeddings
- **Privacy First**: PII redaction before embeddings, configurable data retention

## 🔒 Security & Privacy

- **Data Encryption**: At rest (database) and in transit (TLS)
- **PII Protection**: Automatic redaction before AI processing
- **Access Control**: Per-user data isolation
- **Rate Limiting**: Protection against abuse
- **Audit Logging**: Complete action tracking for compliance

## 📊 Performance

### Current Benchmarks
- **P50 Latency**: < 4s for GPT-4o-class models
- **P95 Latency**: < 8s for local models
- **Cold Start**: < 1.5s API startup
- **Database Queries**: < 150ms P95

### Resource Requirements
- **Minimum**: 4GB RAM, 2 CPU cores
- **Recommended**: 8GB RAM, 4 CPU cores
- **Production**: 16GB RAM, 8 CPU cores

## 🤝 Contributing

This project follows a phased development approach with clear milestones:

1. **Phase 1**: Core conversational capture (Current)
2. **Phase 2**: Memory and dashboard features
3. **Phase 3**: Multi-agent system and integrations

### Development Guidelines
- Follow the established architecture patterns
- Maintain test coverage for new features
- Use conventional commit messages
- Update documentation for API changes
- Ensure backward compatibility

## 📄 License

[Add your license information here]

## 🙏 Acknowledgments

- Built with modern web technologies and AI-first design principles
- Inspired by the need for frictionless productivity tools
- Leverages open-source AI models and frameworks

---

**Ready to transform your productivity? Start a conversation with your AI assistant! 🚀**
