#!/bin/bash

# =====================================================
# Phase 1 Database Migration Script
# Date: June 19, 2025
# Purpose: Execute Phase 1 database migration safely
# =====================================================

echo "🚀 Starting Phase 1 Database Migration..."
echo "============================================="

# 1. Backup database
echo "📦 Creating database backup..."
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
echo "Backup will be saved as: $BACKUP_FILE"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable not set"
    exit 1
fi

# Create backup
pg_dump "$DATABASE_URL" > "$BACKUP_FILE"
if [ $? -eq 0 ]; then
    echo "✅ Database backup created successfully: $BACKUP_FILE"
else
    echo "❌ ERROR: Failed to create database backup"
    exit 1
fi

# 2. Run migration
echo ""
echo "🔄 Running Phase 1 database migration..."
psql "$DATABASE_URL" -f ./prisma/migrations/phase1_foundation_migration.sql

if [ $? -eq 0 ]; then
    echo "✅ Phase 1 migration completed successfully!"
else
    echo "❌ ERROR: Migration failed. Check the logs above."
    echo "You can restore from backup: psql $DATABASE_URL < $BACKUP_FILE"
    exit 1
fi

# 3. Regenerate Prisma client
echo ""
echo "🔄 Regenerating Prisma client..."
npx prisma generate

if [ $? -eq 0 ]; then
    echo "✅ Prisma client regenerated successfully!"
else
    echo "❌ ERROR: Failed to regenerate Prisma client"
    exit 1
fi

# 4. Verification
echo ""
echo "✅ Phase 1 Database Migration Complete!"
echo "============================================="
echo "📋 Next Steps:"
echo "1. Test the application to ensure no breaking changes"
echo "2. Proceed with Phase 1B: Backend API Updates"
echo "3. Begin Phase 1C: Frontend Implementation"
echo ""
echo "🔄 To rollback if needed:"
echo "psql \$DATABASE_URL < $BACKUP_FILE"
echo ""
