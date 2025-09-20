# Note-Taker AI - Makefile for easy management

# Colors for output
RED=\033[0;31m
GREEN=\033[0;32m
YELLOW=\033[1;33m
BLUE=\033[0;34m
PURPLE=\033[0;35m
CYAN=\033[0;36m
WHITE=\033[1;37m
NC=\033[0m # No Color

.PHONY: help start stop restart status logs clean build dev prod

# Default target
help:
	@echo "$(CYAN)Note-Taker AI - Available Commands$(NC)"
	@echo "$(CYAN)==================================$(NC)"
	@echo ""
	@echo "$(GREEN)🚀 Startup Commands:$(NC)"
	@echo "  $(WHITE)start$(NC)          - Start the system and wait for readiness"
	@echo "  $(WHITE)start-bg$(NC)       - Start the system in background"
	@echo "  $(WHITE)dev$(NC)            - Start in development mode with logs"
	@echo ""
	@echo "$(RED)🛑 Stop Commands:$(NC)"
	@echo "  $(WHITE)stop$(NC)           - Stop all services"
	@echo "  $(WHITE)restart$(NC)        - Restart all services"
	@echo ""
	@echo "$(BLUE)📊 Status Commands:$(NC)"
	@echo "  $(WHITE)status$(NC)         - Show system status"
	@echo "  $(WHITE)health$(NC)         - Check system health"
	@echo "  $(WHITE)logs$(NC)           - Show logs for all services"
	@echo "  $(WHITE)logs-api$(NC)       - Show API logs only"
	@echo "  $(WHITE)logs-frontend$(NC)  - Show frontend logs only"
	@echo "  $(WHITE)logs-ollama$(NC)    - Show Ollama logs only"
	@echo ""
	@echo "$(PURPLE)🔧 Maintenance Commands:$(NC)"
	@echo "  $(WHITE)build$(NC)          - Build all Docker images"
	@echo "  $(WHITE)clean$(NC)          - Clean up containers and volumes"
	@echo "  $(WHITE)clean-all$(NC)      - Clean up everything including images"
	@echo ""
	@echo "$(YELLOW)🌐 Access URLs:$(NC)"
	@echo "  $(CYAN)Frontend:$(NC) http://localhost:3000"
	@echo "  $(CYAN)API Docs:$(NC) http://localhost:8000/docs"
	@echo "  $(CYAN)Health:$(NC)   http://localhost:8000/api/health"

# Startup commands
start:
	@echo "$(GREEN)🚀 Starting Note-Taker AI System...$(NC)"
	@./scripts/start-and-wait.sh

start-bg:
	@echo "$(GREEN)🚀 Starting Note-Taker AI System in background...$(NC)"
	@docker-compose -f infra/compose/docker-compose.yml up -d
	@echo "$(GREEN)✅ Services started in background$(NC)"
	@echo "$(BLUE)📊 Check status with: $(WHITE)make status$(NC)"
	@echo "$(YELLOW)🌐 Access at: $(CYAN)http://localhost:3000$(NC)"

dev:
	@echo "$(GREEN)🚀 Starting Note-Taker AI in development mode...$(NC)"
	@docker-compose -f infra/compose/docker-compose.yml up

# Stop commands
stop:
	@echo "$(RED)🛑 Stopping Note-Taker AI System...$(NC)"
	@docker-compose -f infra/compose/docker-compose.yml down
	@echo "$(GREEN)✅ System stopped$(NC)"

restart:
	@echo "$(YELLOW)🔄 Restarting Note-Taker AI System...$(NC)"
	@docker-compose -f infra/compose/docker-compose.yml restart
	@echo "$(GREEN)✅ System restarted$(NC)"

# Status commands
status:
	@echo "$(BLUE)📊 Note-Taker AI System Status$(NC)"
	@echo "$(BLUE)==============================$(NC)"
	@docker-compose -f infra/compose/docker-compose.yml ps
	@echo ""
	@echo "$(CYAN)🔍 Health Check:$(NC)"
	@curl -s http://localhost:8000/api/health 2>/dev/null | jq . || echo "$(RED)❌ API not responding$(NC)"

health:
	@echo "$(PURPLE)🏥 System Health Check$(NC)"
	@echo "$(PURPLE)======================$(NC)"
	@curl -s http://localhost:8000/api/health | jq . || echo "$(RED)❌ Health check failed$(NC)"

# Log commands
logs:
	@echo "$(BLUE)📋 Showing logs for all services...$(NC)"
	@docker-compose -f infra/compose/docker-compose.yml logs --tail=50

logs-api:
	@echo "$(BLUE)📋 Showing API logs...$(NC)"
	@docker-compose -f infra/compose/docker-compose.yml logs api --tail=50

logs-frontend:
	@echo "$(BLUE)📋 Showing frontend logs...$(NC)"
	@docker-compose -f infra/compose/docker-compose.yml logs frontend --tail=50

logs-ollama:
	@echo "$(BLUE)📋 Showing Ollama logs...$(NC)"
	@docker-compose -f infra/compose/docker-compose.yml logs ollama --tail=50

# Build commands
build:
	@echo "$(YELLOW)🔨 Building Docker images...$(NC)"
	@docker-compose -f infra/compose/docker-compose.yml build
	@echo "$(GREEN)✅ Build complete$(NC)"

# Clean commands
clean:
	@echo "$(PURPLE)🧹 Cleaning up containers and volumes...$(NC)"
	@docker-compose -f infra/compose/docker-compose.yml down -v
	@echo "$(GREEN)✅ Cleanup complete$(NC)"

clean-all:
	@echo "$(PURPLE)🧹 Cleaning up everything...$(NC)"
	@docker-compose -f infra/compose/docker-compose.yml down -v --rmi all
	@echo "$(GREEN)✅ Complete cleanup done$(NC)"

# Quick access commands
open:
	@echo "$(YELLOW)🌐 Opening application...$(NC)"
	@open http://localhost:3000 2>/dev/null || xdg-open http://localhost:3000 2>/dev/null || echo "$(CYAN)Please open http://localhost:3000 in your browser$(NC)"

api-docs:
	@echo "$(YELLOW)📚 Opening API documentation...$(NC)"
	@open http://localhost:8000/docs 2>/dev/null || xdg-open http://localhost:8000/docs 2>/dev/null || echo "$(CYAN)Please open http://localhost:8000/docs in your browser$(NC)"
