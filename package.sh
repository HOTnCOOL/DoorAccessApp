#!/bin/bash

# Door Access App Packaging Script
# This script builds and packages the Door Access App for deployment

echo "===== Door Access App Packaging ====="
echo "Building the frontend..."

# Navigate to frontend directory
cd frontend/door-access-app

# Install dependencies
npm install

# Build the frontend
npm run build

# Go back to project root
cd ../../

# Create deployment directories
echo "Creating deployment package..."
mkdir -p deploy
mkdir -p deploy/backend
mkdir -p deploy/frontend

# Copy backend files
echo "Copying backend files..."
cp -r backend/models deploy/backend/
cp -r backend/middleware deploy/backend/
cp -r backend/routes deploy/backend/
cp -r backend/utils deploy/backend/
cp backend/server.js deploy/backend/
cp backend/package.json deploy/backend/
cp backend/.env.example deploy/backend/.env

# Copy frontend build
echo "Copying frontend build..."
cp -r frontend/door-access-app/dist/* deploy/frontend/

# Copy README and setup instructions
cp README.md deploy/
cat > deploy/INSTALL.txt << EOL
Door Access Control System - Installation Guide

1. Backend Setup:
   - Navigate to the backend directory
   - Run: npm install
   - Configure .env file with your settings
   - Start the server: npm start

2. Frontend Setup:
   - Serve the frontend directory with any web server
   - Configure the tablet to access the frontend URL
   - For production, set up HTTPS and proper security

3. Initial Configuration:
   - Access the admin panel at /login
   - Default credentials are in your .env file
   - Set up doors and users according to your requirements

For detailed instructions, see README.md
EOL

# Create a simple setup script
cat > deploy/setup.sh << EOL
#!/bin/bash

echo "Setting up Door Access Control System..."

# Setup backend
echo "Installing backend dependencies..."
cd backend
npm install

# Prompt for MongoDB URI
read -p "Enter MongoDB URI (default: mongodb://localhost:27017/doorAccess): " mongo_uri
mongo_uri=\${mongo_uri:-mongodb://localhost:27017/doorAccess}

# Prompt for JWT secret
read -p "Enter JWT secret (leave blank for random): " jwt_secret
if [ -z "\$jwt_secret" ]; then
  jwt_secret=\$(openssl rand -hex 32)
  echo "Generated random JWT secret"
fi

# Update .env file
sed -i "s|MONGO_URI=.*|MONGO_URI=\$mongo_uri|g" .env
sed -i "s|JWT_SECRET=.*|JWT_SECRET=\$jwt_secret|g" .env

echo "Backend setup complete!"
cd ..

# Setup frontend if needed
echo "Frontend is pre-built and ready to be served"
echo "You can use nginx, Apache, or any other web server to serve the frontend directory"

echo "Setup complete! See README.md for next steps."
EOL

# Make the script executable
chmod +x deploy/setup.sh

# Create a zip archive of the deployment package
echo "Creating zip archive..."
zip -r DoorAccessApp-deploy.zip deploy

echo "===== Packaging Complete ====="
echo "Deployment package created: DoorAccessApp-deploy.zip"
echo "You can now deploy this package to your server and tablet."