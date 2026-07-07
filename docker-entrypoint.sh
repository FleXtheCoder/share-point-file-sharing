#!/bin/sh
set -e

echo "Running database migrations..."
prisma db push --schema=/app/prisma/schema.prisma

echo "Starting application..."
exec su-exec nextjs node server.js
