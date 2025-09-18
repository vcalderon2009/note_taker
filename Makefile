# Note-Taker AI Assistant - Development Makefile
# ==============================================

# Configuration
COMPOSE ?= infra/compose/docker-compose.yml
DC = docker compose -f $(COMPOSE)
API_DIR = src/api

# Colors for output
GREEN = \033[0;32m
BLUE = \033[0;34m
YELLOW = \033[0;33m
RED = \033[0;31m
NC = \033[0m # No Color

# Default target
.DEFAULT_GOAL := help

# Phony targets
.PHONY: help up down build restart logs ps clean sh-api sh-db migrate downgrade seed \
        poetry-install api-dev test test-watch lint format typecheck check-all \
        status health endpoints

##@ 🚀 Quick Start
help: ## Display this help message
	@echo "$(BLUE)Note-Taker AI Assistant - Development Commands$(NC)"
	@echo "=============================================="
	@awk 'BEGIN {FS = ":.*##"; printf "\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(YELLOW)%s$(NC)\n", substr($$0, 5) }' $(MAKEFILE_LIST)
	@echo ""

status: ## Show overall system status
	@echo "$(BLUE)📊 System Status$(NC)"
	@echo "=================="
	@echo "$(GREEN)🐳 Containers:$(NC)"
	@$(DC) ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "  No containers running"
	@echo ""
	@echo "$(GREEN)🔍 Health Check:$(NC)"
	@curl -s http://localhost:8000/health 2>/dev/null | python3 -c "import sys,json; data=json.load(sys.stdin); print(f'  API: {data[\"status\"]} ({data[\"service\"]})')" 2>/dev/null || echo "  API: Not responding"
	@echo ""

##@ 🐳 Container Management
up: ## Start all services in detached mode
	@echo "$(GREEN)🚀 Starting services...$(NC)"
	@$(DC) up -d
	@echo "$(GREEN)✅ Services started! Use 'make status' to check health$(NC)"

down: ## Stop all services
	@echo "$(YELLOW)🛑 Stopping services...$(NC)"
	@$(DC) down
	@echo "$(GREEN)✅ Services stopped$(NC)"

build: ## Build all container images
	@echo "$(GREEN)🔨 Building containers...$(NC)"
	@$(DC) build
	@echo "$(GREEN)✅ Build complete$(NC)"

restart: ## Rebuild and restart all services
	@echo "$(YELLOW)🔄 Restarting services with rebuild...$(NC)"
	@$(DC) down
	@$(DC) up -d --build
	@echo "$(GREEN)✅ Services restarted$(NC)"

clean: ## Stop services and remove volumes/images
	@echo "$(RED)🧹 Cleaning up containers and volumes...$(NC)"
	@$(DC) down -v --remove-orphans
	@docker system prune -f
	@echo "$(GREEN)✅ Cleanup complete$(NC)"

##@ 📊 Monitoring & Logs  
logs: ## Show recent API service logs (non-blocking)
	@echo "$(BLUE)📋 Recent API logs:$(NC)"
	@$(DC) logs --tail=50 api

logs-follow: ## Follow API service logs (blocking, Ctrl+C to exit)
	@echo "$(BLUE)📋 Following API logs (Ctrl+C to exit)...$(NC)"
	@$(DC) logs -f --tail=100 api

logs-all: ## Show recent logs for all services (non-blocking)
	@echo "$(BLUE)📋 Recent logs from all services:$(NC)"
	@$(DC) logs --tail=30

logs-all-follow: ## Follow logs for all services (blocking, Ctrl+C to exit)
	@echo "$(BLUE)📋 Following all service logs (Ctrl+C to exit)...$(NC)"
	@$(DC) logs -f --tail=50

logs-save: ## Save current logs to files
	@echo "$(BLUE)💾 Saving logs to files...$(NC)"
	@mkdir -p logs
	@$(DC) logs api > logs/api-$(shell date +%Y%m%d-%H%M%S).log
	@$(DC) logs frontend > logs/frontend-$(shell date +%Y%m%d-%H%M%S).log
	@$(DC) logs db > logs/db-$(shell date +%Y%m%d-%H%M%S).log
	@$(DC) logs ollama > logs/ollama-$(shell date +%Y%m%d-%H%M%S).log
	@echo "$(GREEN)✅ Logs saved to logs/ directory$(NC)"

ps: ## Show running containers
	@$(DC) ps

##@ 🔧 Development Tools
sh-api: ## Shell into API container
	@echo "$(BLUE)🐚 Opening shell in API container...$(NC)"
	@$(DC) exec api bash

sh-db: ## Shell into database container  
	@echo "$(BLUE)🐚 Opening shell in database container...$(NC)"
	@$(DC) exec db psql -U note_user -d note_db

sh-frontend: ## Shell into frontend container
	@echo "$(BLUE)🐚 Opening shell in frontend container...$(NC)"
	@$(DC) exec frontend sh

poetry-install: ## Install Python dependencies via Poetry
	@echo "$(GREEN)📦 Installing Python dependencies...$(NC)"
	@cd $(API_DIR) && poetry install --no-interaction --no-ansi
	@echo "$(GREEN)✅ Dependencies installed$(NC)"

npm-install: ## Install Node.js dependencies
	@echo "$(GREEN)📦 Installing Node.js dependencies...$(NC)"
	@cd src/frontend && npm install
	@echo "$(GREEN)✅ Dependencies installed$(NC)"

api-dev: poetry-install ## Run API in development mode (local)
	@echo "$(GREEN)🚀 Starting API in development mode...$(NC)"
	@cd $(API_DIR) && poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

frontend-dev: npm-install ## Run frontend in development mode (local)
	@echo "$(GREEN)🚀 Starting frontend in development mode...$(NC)"
	@cd src/frontend && npm run dev

##@ 🗄️  Database Operations
migrate: ## Run database migrations
	@echo "$(GREEN)⬆️  Running database migrations...$(NC)"
	@$(DC) exec api alembic upgrade head
	@echo "$(GREEN)✅ Migrations complete$(NC)"

downgrade: ## Rollback last database migration
	@echo "$(YELLOW)⬇️  Rolling back last migration...$(NC)"
	@$(DC) exec api alembic downgrade -1
	@echo "$(GREEN)✅ Rollback complete$(NC)"

seed: ## Seed database with sample data
	@echo "$(YELLOW)🌱 Database seeding not implemented yet$(NC)"
	@echo "TODO: Add seed script and run here"

##@ 🧪 Testing & Quality
test: ## Run all tests
	@echo "$(GREEN)🧪 Running tests...$(NC)"
	@cd $(API_DIR) && poetry run pytest -v --tb=short
	@echo "$(GREEN)✅ Tests complete$(NC)"

test-watch: ## Run tests in watch mode
	@echo "$(GREEN)🔍 Running tests in watch mode (Ctrl+C to exit)...$(NC)"
	@cd $(API_DIR) && poetry run pytest-watch

lint: ## Check code style and formatting
	@echo "$(GREEN)🔍 Checking code style...$(NC)"
	@cd $(API_DIR) && poetry run ruff check .
	@cd $(API_DIR) && poetry run black --check .
	@echo "$(GREEN)✅ Linting complete$(NC)"

format: ## Auto-format code
	@echo "$(GREEN)✨ Formatting code...$(NC)"
	@cd $(API_DIR) && poetry run black .
	@cd $(API_DIR) && poetry run ruff check --fix .
	@echo "$(GREEN)✅ Code formatted$(NC)"

typecheck: ## Run type checking
	@echo "$(GREEN)🔍 Running type checks...$(NC)"
	@cd $(API_DIR) && poetry run mypy app
	@echo "$(GREEN)✅ Type checking complete$(NC)"

check-all: lint typecheck test ## Run all quality checks
	@echo "$(GREEN)🎯 All quality checks passed!$(NC)"

##@ 🌐 API Testing
health: ## Check API health endpoint
	@echo "$(BLUE)🏥 Checking API health...$(NC)"
	@curl -s http://localhost:8000/health | python3 -m json.tool || echo "$(RED)❌ API not responding$(NC)"

endpoints: ## Test core API endpoints
	@echo "$(BLUE)🔗 Testing core API endpoints...$(NC)"
	@echo "$(GREEN)Health:$(NC)"
	@curl -s http://localhost:8000/health | python3 -m json.tool 2>/dev/null || echo "❌ Failed"
	@echo "$(GREEN)Notes:$(NC)"
	@curl -s http://localhost:8000/api/notes | python3 -c "import sys,json; data=json.load(sys.stdin); print(f'  Found {len(data)} notes')" 2>/dev/null || echo "❌ Failed"
	@echo "$(GREEN)Tasks:$(NC)"
	@curl -s http://localhost:8000/api/tasks | python3 -c "import sys,json; data=json.load(sys.stdin); print(f'  Found {len(data)} tasks')" 2>/dev/null || echo "❌ Failed"

test-orchestrator: ## Test AI orchestrator with sample inputs
	@echo "$(BLUE)🤖 Testing AI orchestrator...$(NC)"
	@echo "$(GREEN)Creating note:$(NC)"
	@curl -s -X POST http://localhost:8000/api/conversations/1/messages \
		-H "Content-Type: application/json" \
		-H "Idempotency-Key: test-note-$$(date +%s)" \
		-d '{"text": "Remember to review the quarterly reports"}' | python3 -m json.tool 2>/dev/null || echo "❌ Failed"
	@echo "$(GREEN)Creating task:$(NC)"
	@curl -s -X POST http://localhost:8000/api/conversations/1/messages \
		-H "Content-Type: application/json" \
		-H "Idempotency-Key: test-task-$$(date +%s)" \
		-d '{"text": "task: schedule team meeting for next week"}' | python3 -m json.tool 2>/dev/null || echo "❌ Failed"

##@ 📚 Documentation  
show-config: ## Show current configuration
	@echo "$(BLUE)⚙️  Current Configuration$(NC)"
	@echo "========================="
	@echo "Compose file: $(COMPOSE)"
	@echo "API directory: $(API_DIR)"
	@echo "Docker Compose: $(DC)"
	@echo ""

show-urls: ## Show important URLs
	@echo "$(BLUE)🔗 Important URLs$(NC)"
	@echo "=================="
	@echo "Frontend: http://localhost:3000"
	@echo "API Health: http://localhost:8000/health"
	@echo "API Docs: http://localhost:8000/docs"  
	@echo "Ollama: http://localhost:11434"
	@echo "Database: postgresql://note_user:note_pass@localhost:5432/note_db"
	@echo ""


