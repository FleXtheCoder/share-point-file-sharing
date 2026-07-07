#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma db push

echo "Starting application..."
exec su-exec nextjs node server.js
