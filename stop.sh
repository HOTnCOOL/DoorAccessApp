#!/bin/bash

# Door Access App - Stop Script
# This script stops the Door Access App

# Text colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print banner
echo -e "${YELLOW}"
echo "==============================================="
echo "         DOOR ACCESS APP - STOPPING"
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

# Ask if user wants to keep the data
read -p "Do you want to keep the data (users, doors, logs)? [Y/n]: " keep_data
keep_data=${keep_data:-Y}

if [[ ${keep_data^^} == "Y" ]]; then
    echo "Stopping the Door Access App (preserving data)..."
    docker-compose down
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Door Access App has been stopped. All data is preserved.${NC}"
        echo "To restart the app, run: ./run.sh"
    else
        echo -e "${RED}Error occurred while stopping the app.${NC}"
    fi
else
    echo -e "${RED}WARNING: This will delete ALL data including users, doors, and access logs.${NC}"
    read -p "Are you sure you want to continue? [y/N]: " confirm_delete
    
    if [[ ${confirm_delete^^} == "Y" ]]; then
        echo "Stopping the Door Access App and removing all data..."
        docker-compose down -v
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}Door Access App has been stopped and all data has been removed.${NC}"
            echo "To reinstall the app, run: ./install.sh"
        else
            echo -e "${RED}Error occurred while stopping the app.${NC}"
        fi
    else
        echo "Operation canceled. No changes were made."
    fi
fi