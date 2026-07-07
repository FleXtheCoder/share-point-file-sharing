#!/bin/sh
set -e

PRISMA="/app/node_modules/prisma/build/index.js"

if [ ! -f "$PRISMA" ]; then
  echo "ERROR: Prisma CLI missing at $PRISMA"
  ls -la /app/node_modules 2>/dev/null || true
  exit 1
fi

echo "Running database migrations..."
node "$PRISMA" db push --schema=/app/prisma/schema.prisma --skip-generate

echo "Starting application..."
exec su-exec nextjs node server.js
