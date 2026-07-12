#!/bin/bash
set -e

echo "▶ Starting NutriTrack AI..."

# Start Flask backend (background)
cd /app/backend
gunicorn --bind 127.0.0.1:5000 --workers 2 --timeout 120 run:app &
echo "  Flask started on :5000"

# Start Next.js standalone (background)
cd /app/frontend
PORT=3000 HOSTNAME=127.0.0.1 node server.js &
echo "  Next.js started on :3000"

# Wait for services to be ready
sleep 3

# Start nginx (foreground — keeps container alive)
echo "  nginx starting on :8080"
nginx -g 'daemon off;'
