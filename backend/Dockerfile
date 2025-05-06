FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy application code
COPY . .

# Create uploads directory for images
RUN mkdir -p uploads

# Create a default .env file if not exists
RUN if [ ! -f .env ]; then \
        cp .env.example .env || echo "No .env.example found"; \
    fi

# Expose the API port
EXPOSE 8001

# Add script to initialize admin user
COPY ./scripts/init-admin.js ./scripts/init-admin.js

# Start the application with admin initialization
CMD ["sh", "-c", "node ./scripts/init-admin.js && node server.js"]