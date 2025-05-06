#!/bin/bash

# Door Access App - One-Click Installation Script
# This script sets up the entire Door Access application with Docker

# Text colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print banner
echo -e "${GREEN}"
echo "==============================================="
echo "        DOOR ACCESS APP INSTALLATION"
echo "==============================================="
echo -e "${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed.${NC}"
    echo "Please install Docker and Docker Compose before running this script."
    echo "Visit https://docs.docker.com/get-docker/ for installation instructions."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed.${NC}"
    echo "Please install Docker Compose before running this script."
    echo "Visit https://docs.docker.com/compose/install/ for installation instructions."
    exit 1
fi

# Offer configuration options
echo -e "${GREEN}Door Access App Configuration${NC}"
echo -e "${YELLOW}Press Enter to use default values or provide custom values.${NC}"
echo ""

# Ask for MongoDB URI
read -p "Use built-in MongoDB? [Y/n]: " use_builtin_mongo
use_builtin_mongo=${use_builtin_mongo:-Y}

if [[ ${use_builtin_mongo^^} == "N" ]]; then
    read -p "Enter your MongoDB URI: " mongo_uri
    if [ -z "$mongo_uri" ]; then
        echo -e "${RED}Error: MongoDB URI is required when not using built-in MongoDB.${NC}"
        exit 1
    fi
    
    # Update docker-compose.yml to use external MongoDB
    sed -i "s|MONGO_URI=mongodb://dooraccessapp:dooraccesssecret@mongodb:27017/dooraccess?authSource=admin|MONGO_URI=$mongo_uri|g" docker-compose.yml
    
    # Comment out the MongoDB service in docker-compose.yml
    sed -i '/# MongoDB service/,/door-access-network/s/^/#/' docker-compose.yml
    sed -i '/depends_on:/,/- mongodb/s/^/#/' docker-compose.yml
fi

# Ask for admin email and password
read -p "Admin Email [admin@example.com]: " admin_email
admin_email=${admin_email:-admin@example.com}

read -p "Admin Password [admin123]: " admin_password
admin_password=${admin_password:-admin123}

# Update environment variables in docker-compose.yml
sed -i "s|ADMIN_EMAIL=admin@example.com|ADMIN_EMAIL=$admin_email|g" docker-compose.yml
sed -i "s|ADMIN_PASSWORD=admin123|ADMIN_PASSWORD=$admin_password|g" docker-compose.yml

# Generate a random JWT secret
jwt_secret=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
sed -i "s|JWT_SECRET=defaultsecretkeyyoushouldchangethisinproduction|JWT_SECRET=$jwt_secret|g" docker-compose.yml

# Ask for port configuration
read -p "Backend Port [8001]: " backend_port
backend_port=${backend_port:-8001}

read -p "Frontend Port [80]: " frontend_port
frontend_port=${frontend_port:-80}

# Update ports in docker-compose.yml
sed -i "s|\( *- \"\)[0-9]\\+:8001\"|\\1$backend_port:8001\"|g" docker-compose.yml
sed -i "s|\( *- \"\)[0-9]\\+:80\"|\\1$frontend_port:80\"|g" docker-compose.yml

echo ""
echo -e "${GREEN}Starting Door Access App...${NC}"
echo "This may take a few minutes for the first run as Docker images are downloaded and built."
echo ""

# Clean up any existing containers
docker-compose down -v --remove-orphans

# Start the application with Docker Compose
docker-compose up -d

# Check if the application started successfully
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}Door Access App has been successfully installed!${NC}"
    echo ""
    echo "Access the application at:"
    echo -e "- Frontend: ${YELLOW}http://localhost:$frontend_port${NC}"
    echo -e "- Backend API: ${YELLOW}http://localhost:$backend_port${NC}"
    echo ""
    echo "Admin credentials:"
    echo -e "- Email: ${YELLOW}$admin_email${NC}"
    echo -e "- Password: ${YELLOW}$admin_password${NC}"
    echo ""
    echo -e "${RED}IMPORTANT: Please change the default admin password after first login!${NC}"
else
    echo ""
    echo -e "${RED}Error: Failed to start Door Access App.${NC}"
    echo "Please check the Docker logs for more information:"
    echo "docker-compose logs"
fi

echo ""
echo -e "${GREEN}=== Installation Complete ===${NC}"
echo "For more information, check the README.md file."
echo "To stop the application: docker-compose down"
echo "To start the application: docker-compose up -d"