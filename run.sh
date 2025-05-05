#!/bin/bash

# Door Access App - Quick Start Script
# This script starts the Door Access App with Docker Compose

# Text colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print banner
echo -e "${GREEN}"
echo "==============================================="
echo "        DOOR ACCESS APP QUICK START"
echo "==============================================="
echo -e "${NC}"

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed.${NC}"
    echo "Please install Docker Compose before running this script."
    echo "Visit https://docs.docker.com/compose/install/ for installation instructions."
    exit 1
fi

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}Error: docker-compose.yml not found.${NC}"
    echo "Make sure you are in the correct directory or run install.sh first."
    exit 1
fi

# Start the application
echo -e "Starting Door Access App..."
docker-compose up -d

# Check if the application started successfully
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}Door Access App is now running!${NC}"
    
    # Extract ports from docker-compose.yml
    backend_port=$(grep -A1 "backend:" docker-compose.yml | grep "ports:" -A1 | grep -oP '"\K[^:]+')
    frontend_port=$(grep -A1 "frontend:" docker-compose.yml | grep "ports:" -A1 | grep -oP '"\K[^:]+')
    
    echo ""
    echo "Access the application at:"
    echo -e "- Frontend: ${YELLOW}http://localhost:${frontend_port:-80}${NC}"
    echo -e "- Backend API: ${YELLOW}http://localhost:${backend_port:-8001}${NC}"
    
    # Check if admin credentials are in docker-compose.yml
    admin_email=$(grep "ADMIN_EMAIL" docker-compose.yml | head -1 | cut -d'=' -f2)
    
    if [ ! -z "$admin_email" ]; then
        echo ""
        echo "Admin login:"
        echo -e "- Email: ${YELLOW}${admin_email}${NC}"
        echo -e "- Password: (Use the password you set during installation)"
    fi
else
    echo ""
    echo -e "${RED}Error: Failed to start Door Access App.${NC}"
    echo "Please check the Docker logs for more information:"
    echo "docker-compose logs"
fi

echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "- View logs: docker-compose logs"
echo "- Stop application: docker-compose down"
echo "- Restart application: docker-compose restart"