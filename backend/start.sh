#!/usr/bin/env bash
set -e

# Push database schema (creates/migrates tables)
npx prisma db push --accept-data-loss

# Seed demo data (only if users table is empty)
COUNT=$(node -e "const{P}=require('@prisma/client');new P().user.count().then(c=>console.log(c)).catch(()=>console.log(0))")
if [ "$COUNT" = "0" ]; then
  echo "Seeding demo data..."
  npx tsx src/seed.ts
fi

# Start the server
node dist/index.js
