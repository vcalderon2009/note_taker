#!/bin/bash

# Automatic startup script for Note-Taker AI
# This script starts the system and waits for everything to be ready

set -e

echo -e "\033[0;36m🚀 Starting Note-Taker AI System\033[0m"
echo -e "\033[0;36m================================\033[0m"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://localhost:8000"
FRONTEND_URL="http://localhost:3000"
MAX_WAIT_TIME=600  # 10 minutes
CHECK_INTERVAL=10  # 10 seconds

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check if a service is responding
check_service() {
    local url=$1
    local name=$2
    
    if curl -s -f "$url" > /dev/null 2>&1; then
        print_status $GREEN "✅ $name is responding"
        return 0
    else
        print_status $YELLOW "⏳ $name is not ready yet..."
        return 1
    fi
}

# Function to check system readiness
check_system_ready() {
    local response=$(curl -s "$API_URL/api/health" 2>/dev/null)
    if [ $? -eq 0 ]; then
        local system_ready=$(echo "$response" | jq -r '.system_ready' 2>/dev/null)
        if [ "$system_ready" = "true" ]; then
            return 0
        fi
    fi
    return 1
}

# Function to show system status
show_system_status() {
    local response=$(curl -s "$API_URL/api/health" 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo ""
        print_status $BLUE "📊 System Status:"
        echo "$response" | jq -r '
            "  Status: " + .status +
            " | Database: " + .services.database.status +
            " | Ollama: " + .services.ollama.status +
            " | Models: " + (.models | length | tostring) + "/2" +
            " | Ready: " + (.system_ready | tostring)
        ' 2>/dev/null || echo "  Unable to parse system status"
    fi
}

# Start the system
print_status $BLUE "Starting Docker Compose services..."
docker-compose -f infra/compose/docker-compose.yml up -d

echo ""
print_status $BLUE "Waiting for system to be ready..."
print_status $YELLOW "This may take several minutes on first startup while models are downloaded."
echo ""

# Wait for system to be ready
start_time=$(date +%s)
while true; do
    current_time=$(date +%s)
    elapsed=$((current_time - start_time))
    
    # Check if we've exceeded max wait time
    if [ $elapsed -gt $MAX_WAIT_TIME ]; then
        print_status $RED "❌ Timeout: System did not become ready within $MAX_WAIT_TIME seconds"
        print_status $YELLOW "Check the logs with: docker-compose -f infra/compose/docker-compose.yml logs"
        exit 1
    fi
    
    # Show elapsed time
    printf "\r⏱️  Elapsed: ${elapsed}s / ${MAX_WAIT_TIME}s"
    
    # Check if system is ready
    if check_system_ready; then
        echo ""
        print_status $GREEN "🎉 System is ready!"
        show_system_status
        echo ""
        print_status $GREEN "✅ You can now access the application at: $FRONTEND_URL"
        print_status $GREEN "✅ API documentation at: $API_URL/docs"
        echo ""
        print_status $BLUE "To stop the system, run: docker-compose -f infra/compose/docker-compose.yml down"
        exit 0
    fi
    
    sleep $CHECK_INTERVAL
done
