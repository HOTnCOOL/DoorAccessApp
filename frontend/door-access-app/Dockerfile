FROM node:16-alpine as build

WORKDIR /app

# Install curl for downloading face models
RUN apk add --no-cache curl

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Create directory for face models
RUN mkdir -p public/models

# Download face recognition models
WORKDIR /app/public
RUN chmod +x ./setup-models.sh && ./setup-models.sh
WORKDIR /app

# Create .env file with API URL
RUN echo "VITE_API_URL=http://localhost:8001/api" > .env

# Build the application
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine

# Copy built files from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy models directory
COPY --from=build /app/public/models /usr/share/nginx/html/models

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]