#!/bin/bash

# Monitor startup script for Note-Taker AI
# This script monitors the system startup and shows progress

API_URL="http://localhost:8000"
FRONTEND_URL="http://localhost:3000"

echo "🚀 Note-Taker AI Startup Monitor"
echo "================================"
echo ""

# Function to check if a service is responding
check_service() {
    local url=$1
    local name=$2
    
    if curl -s -f "$url" > /dev/null 2>&1; then
        echo "✅ $name is responding"
        return 0
    else
        echo "⏳ $name is not ready yet..."
        return 1
    fi
}

# Function to check health endpoint
check_health() {
    local response=$(curl -s "$API_URL/api/health" 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo "$response" | jq -r '
            "System Status: " + .status + 
            " | Database: " + .services.database.status + 
            " | Ollama: " + .services.ollama.status + 
            " | Models: " + (.models | length | tostring) + "/2" +
            " | Ready: " + (.system_ready | tostring)
        ' 2>/dev/null || echo "System Status: API responding but health check failed"
        return 0
    else
        echo "⏳ API health check failed"
        return 1
    fi
}

# Function to show detailed status
show_detailed_status() {
    echo ""
    echo "📊 Detailed Status:"
    echo "=================="
    
    local response=$(curl -s "$API_URL/api/health" 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo "$response" | jq -r '
            "Timestamp: " + .timestamp,
            "Overall Status: " + .status,
            "",
            "Services:",
            "  Database: " + .services.database.status + (if .services.database.error then " (Error: " + .services.database.error + ")" else "" end),
            "  Ollama: " + .services.ollama.status + (if .services.ollama.error then " (Error: " + .services.ollama.error + ")" else "" end),
            "",
            "Models (" + (.models | length | tostring) + "):",
            (.models[] | "  - " + .),
            "",
            "System Ready: " + (.system_ready | tostring)
        ' 2>/dev/null
    else
        echo "❌ Unable to get detailed status"
    fi
}

echo "Starting monitoring loop..."
echo "Press Ctrl+C to stop"
echo ""

# Main monitoring loop
while true; do
    echo -n "$(date '+%H:%M:%S') - "
    
    # Check if API is responding
    if check_service "$API_URL/docs" "API"; then
        # Check health endpoint
        if check_health; then
            # Check if frontend is responding
            if check_service "$FRONTEND_URL" "Frontend"; then
                echo ""
                echo "🎉 All services are ready!"
                show_detailed_status
                echo ""
                echo "You can now access the application at: $FRONTEND_URL"
                echo "API documentation at: $API_URL/docs"
                break
            fi
        fi
    fi
    
    sleep 5
done
