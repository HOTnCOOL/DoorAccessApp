#!/bin/bash

# Door Access App - Restart Script
# This script restarts the Door Access App

# Text colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print banner
echo -e "${YELLOW}"
echo "==============================================="
echo "        DOOR ACCESS APP - RESTARTING"
echo "==============================================="
echo -e "${NC}"

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed.${NC}"
    echo "Please install Docker Compose before running this script."
    exit 1
fi

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}Error: docker-compose.yml not found.${NC}"
    echo "Make sure you are in the correct directory."
    exit 1
fi

echo "Restarting the Door Access App..."
docker-compose restart

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Door Access App has been restarted.${NC}"
    
    # Extract ports from docker-compose.yml
    backend_port=$(grep -A1 "backend:" docker-compose.yml | grep "ports:" -A1 | grep -oP '"\K[^:]+')
    frontend_port=$(grep -A1 "frontend:" docker-compose.yml | grep "ports:" -A1 | grep -oP '"\K[^:]+')
    
    echo ""
    echo "Access the application at:"
    echo -e "- Frontend: ${YELLOW}http://localhost:${frontend_port:-80}${NC}"
    echo -e "- Backend API: ${YELLOW}http://localhost:${backend_port:-8001}${NC}"
else
    echo -e "${RED}Error occurred while restarting the app.${NC}"
    echo "Please check the Docker logs for more information:"
    echo "docker-compose logs"
fi