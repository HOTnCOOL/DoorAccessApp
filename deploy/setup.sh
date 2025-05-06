#!/bin/bash

echo "Setting up Door Access Control System..."

# Setup backend
echo "Installing backend dependencies..."
cd backend
npm install

# Prompt for MongoDB URI
read -p "Enter MongoDB URI (default: mongodb://localhost:27017/doorAccess): " mongo_uri
mongo_uri=${mongo_uri:-mongodb://localhost:27017/doorAccess}

# Prompt for JWT secret
read -p "Enter JWT secret (leave blank for random): " jwt_secret
if [ -z "$jwt_secret" ]; then
  jwt_secret=$(openssl rand -hex 32)
  echo "Generated random JWT secret"
fi

# Update .env file
sed -i "s|MONGO_URI=.*|MONGO_URI=$mongo_uri|g" .env
sed -i "s|JWT_SECRET=.*|JWT_SECRET=$jwt_secret|g" .env

echo "Backend setup complete!"
cd ..

# Setup frontend if needed
echo "Frontend is pre-built and ready to be served"
echo "You can use nginx, Apache, or any other web server to serve the frontend directory"

echo "Setup complete! See README.md for next steps."
