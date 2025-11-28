#!/bin/sh
# Docker entrypoint script for Railway compatibility
# Substitutes PORT environment variable in nginx config

set -e

# Read PORT from Railway environment variable (Railway sets this dynamically)
# If not set, default to 8080
PORT=${PORT:-8080}
export PORT

# Log what port we received from Railway
echo "Railway assigned PORT: $PORT"

# Remove any existing default.conf to avoid conflicts
rm -f /etc/nginx/conf.d/default.conf

# Verify template exists
if [ ! -f /etc/nginx/templates/default.conf.template ]; then
  echo "ERROR: Template file not found!"
  exit 1
fi

# Substitute PORT in nginx config template
envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

# Verify generated config
if [ ! -f /etc/nginx/conf.d/default.conf ]; then
  echo "ERROR: Failed to generate nginx config!"
  exit 1
fi

# Log the generated nginx config (for debugging)
echo "=== Generated Nginx Config ==="
cat /etc/nginx/conf.d/default.conf
echo "=== End Nginx Config ==="

# Log the configuration (for debugging)
echo "=== Nginx Configuration ==="
echo "Listening on port: $PORT"
echo "Document root: /usr/share/nginx/html"
echo "Files in document root:"
ls -la /usr/share/nginx/html/ | head -10

# Test nginx configuration
echo "Testing nginx configuration..."
nginx -t

# Start nginx
echo "Starting nginx on port $PORT..."
exec nginx -g "daemon off;"

