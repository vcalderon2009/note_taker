# Getting Started

This guide will help you get Note-Taker AI up and running on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Docker** (20.10+) and **Docker Compose** (2.0+)
- **Make** (optional, for convenience commands)
- **Git** (for cloning the repository)

### System Requirements

- **RAM**: 4GB minimum, 8GB+ recommended
- **Storage**: 6GB+ free space (for AI models)
- **CPU**: 2+ cores recommended
- **OS**: Linux, macOS, or Windows with WSL2

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/note-taker.git
cd note-taker
```

### 2. Quick Start (Recommended)

The easiest way to get started is with our one-command setup:

```bash
make start
```

This command will:
- Download and start all required services
- Download AI models automatically (first time only)
- Start the application
- Show real-time progress

### 3. Manual Setup

If you prefer manual control or need to troubleshoot:

```bash
# Start all services
docker-compose up -d

# Check if services are running
docker-compose ps

# View logs
docker-compose logs -f
```

## First Steps

### 1. Access the Application

Once the system is running, you can access:

- **Main Application**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/health

### 2. Verify Installation

Check that all services are healthy:

```bash
# Check system status
make status

# Check health endpoints
make health
```

You should see all services marked as "healthy" or "running".

### 3. Start Your First Conversation

1. Open http://localhost:3000 in your browser
2. You'll see the chat interface with a welcome message
3. Try typing: "I need to remember to call John tomorrow about the project"
4. Watch as the AI processes your input and creates a task

## Basic Usage

### Creating Notes

Simply type your thoughts naturally:

```
"Meeting notes from today: discussed the new feature requirements, 
decided to use React for the frontend, and scheduled a follow-up for next week"
```

The AI will automatically:
- Recognize this as a note
- Create a structured note with title and sections
- Save it to your sidebar

### Managing Tasks

Create tasks through conversation:

```
"Remind me to review the quarterly report by Friday"
"Update the project timeline and send it to the team"
"Schedule a meeting with the design team next Tuesday"
```

The AI will:
- Identify these as tasks
- Create task entries with appropriate details
- Make them visible in your task sidebar

### Brain Dumps

For complex, unstructured input:

```
"I've been thinking about the new product launch. We need to consider the marketing strategy, 
budget allocation, timeline, team assignments, and risk mitigation. Also, we should probably 
do some market research first and maybe run some focus groups to validate our assumptions."
```

The AI will:
- Recognize this as a brain dump
- Organize it into structured sections
- Extract key points and action items
- Create both notes and tasks as appropriate

## Understanding the Interface

### Chat Area
- **Main conversation area** where you interact with the AI
- **Message bubbles** show your input and AI responses
- **Thinking indicator** shows AI processing steps in real-time

### Sidebar
- **Notes tab**: View and manage your organized notes
- **Tasks tab**: See and edit your tasks
- **Conversations**: Switch between different conversation threads

### Thinking Process
- Watch the AI "think" through your request
- See the reasoning steps it takes
- Collapsible details for completed thinking processes

## Common Commands

### Development Commands

```bash
# Start with live logs (development)
make dev

# Restart all services
make restart

# Stop all services
make stop

# Clean up containers and volumes
make clean
```

### Monitoring Commands

```bash
# View all logs
make logs

# View specific service logs
make logs-api
make logs-frontend
make logs-ollama

# Check system status
make status
```

### Database Commands

```bash
# Run database migrations
make migrate

# Reset database (development only)
make reset-db
```

## Troubleshooting

### Common Issues

#### Services Won't Start
```bash
# Check Docker is running
docker --version
docker-compose --version

# Check available resources
docker system df
```

#### AI Models Not Loading
```bash
# Check Ollama service
make logs-ollama

# Manually pull models
docker-compose exec ollama ollama pull llama3.2:3b
docker-compose exec ollama ollama pull llama3.2:1b
```

#### Database Connection Issues
```bash
# Check database logs
make logs-db

# Reset database
make reset-db
```

#### Port Conflicts
If ports 3000 or 8000 are in use:

```bash
# Check what's using the ports
lsof -i :3000
lsof -i :8000

# Stop conflicting services or modify docker-compose.yml
```

### Getting Help

1. **Check the logs**: `make logs` for detailed error information
2. **Verify system requirements**: Ensure you have enough RAM and storage
3. **Restart services**: `make restart` often resolves temporary issues
4. **Clean start**: `make clean && make start` for a fresh start

### Performance Tips

#### First Startup
- First startup takes 5-10 minutes (model download)
- Subsequent startups take 1-2 minutes
- Models are cached between restarts

#### Resource Optimization
- Close other applications to free up RAM
- Ensure Docker has enough memory allocated
- Use SSD storage for better performance

## Next Steps

Now that you have Note-Taker AI running:

1. **Explore the Features**: Try different types of inputs (notes, tasks, brain dumps)
2. **Read the Architecture Guide**: Understand how the system works
3. **Check the API Documentation**: Learn about the backend capabilities
4. **Contribute**: See our [Development Guide](development.md) for contributing

## Production Deployment

For production deployment, see our [Deployment Guide](deployment.md) which covers:
- Environment configuration
- Security considerations
- Scaling and monitoring
- Backup strategies

---

**Ready to start organizing your thoughts? Try your first conversation! 🚀**
