# ===== Stage 1: Build Application =====
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies (use npm ci for faster, reliable builds)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# ===== Stage 2: Serve Application =====
FROM nginx:alpine

WORKDIR /usr/share/nginx/html

# Ensure conf.d directory exists
RUN mkdir -p /etc/nginx/conf.d


# Install envsubst for environment variable substitution
RUN apk add --no-cache gettext

# Remove default nginx static assets and configs
RUN rm -rf ./* /etc/nginx/conf.d/default.conf

# Copy built application from build stage
COPY --from=build /app/dist .

# Create nginx templates directory
RUN mkdir -p /etc/nginx/templates

# Copy nginx configuration template
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Copy custom nginx main config (limits worker processes)
COPY nginx-main.conf /etc/nginx/nginx.conf

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Default PORT (Railway will override via environment variable)
# Railway dynamically assigns PORT (e.g., 5173, 8080, etc.)
ENV PORT=8080

# Expose common ports (EXPOSE is just documentation - Railway uses PORT env var dynamically)
EXPOSE 8080

# Use entrypoint script to handle PORT substitution
ENTRYPOINT ["/docker-entrypoint.sh"]

