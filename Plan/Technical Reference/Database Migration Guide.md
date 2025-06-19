# 🛠️ Database Migration & Maintenance Guide

**For ProjectFlo Phase Implementation**  
**Updated:** June 19, 2025

---

## 🚨 **CRITICAL LESSONS LEARNED - PRISMA MIGRATION BEST PRACTICES**

### **❌ COMMON MISTAKES TO AVOID**

1. **Never run `prisma migrate dev` after significant schema changes without checking migration SQL**
2. **Don't use `createMany()` in seed scripts for tables with unique constraints**
3. **Always regenerate Prisma client after schema changes**
4. **Check enum values are properly updated in both schema AND migration SQL**
5. **Use `prisma db push --force-reset` only as last resort - it destroys data**

---

## ✅ **CORRECT MIGRATION WORKFLOW FOR PHASE IMPLEMENTATION**

### **Step 1: Pre-Migration Verification**
```bash
# 1. Check current database state
npx prisma db pull  # Sync schema with database
npx prisma generate # Regenerate client

# 2. Backup current data (if any)
pg_dump projectflo_dev > backup_$(date +%Y%m%d_%H%M%S).sql
```

### **Step 2: Schema Updates**
```bash
# 1. Edit prisma/schema.prisma with new models/fields
# 2. Create migration with descriptive name
npx prisma migrate dev --name "phase1_timeline_and_analytics_system"

# 3. If migration fails due to enum/data issues:
# - Edit the migration SQL manually in prisma/migrations/
# - Add enum value updates BEFORE table creation
# - Add data migrations if needed
```

### **Step 3: Enum Value Migration (CRITICAL)**
When adding new enum values, the migration SQL must include:
```sql
-- Add new enum values FIRST
ALTER TYPE "ComponentType" ADD VALUE IF NOT EXISTS 'COVERAGE_LINKED';
ALTER TYPE "ComponentType" ADD VALUE IF NOT EXISTS 'EDIT';
ALTER TYPE "PricingModifierType" ADD VALUE IF NOT EXISTS 'TIMELINE_LENGTH';

-- Then create/modify tables
CREATE TABLE "timeline_layers" (
    -- table definition
);
```

### **Step 4: Safe Migration Execution**
```bash
# 1. Apply migration
npx prisma migrate dev

# 2. If migration fails, use reset approach:
npx prisma db push --force-reset  # ONLY if no important data
npx prisma generate

# 3. Verify migration success
npx prisma db pull  # Should show no changes if successful
```

### **Step 5: Seed Data Management**
```bash
# 1. Use upsert for records with unique constraints
# Example: await prisma.timelineLayer.upsert({ where: { name: "Video" }, ... })

# 2. Run seed safely
npx prisma db seed

# 3. If seed fails, fix script and re-run (upsert handles duplicates)
```

---

## 🔍 **PHASE-SPECIFIC MIGRATION CHECKPOINTS**

### **Phase 1 Database Readiness Verification**
```bash
# Run this script after any Phase 1 migration:
npx ts-node check-phase1.ts

# Expected results:
# ✅ Timeline Layers: 5 layers
# ✅ Component Types: COVERAGE_LINKED + EDIT
# ✅ All 6 timeline tables exist
# ✅ Analytics fields present
# ✅ Timeline component CRUD working
```

### **Migration Recovery Commands**
```bash
# If migration corrupts database:
npx prisma db push --force-reset    # Nuclear option - destroys data
npx prisma db seed                  # Restore seed data
npx prisma generate                 # Regenerate client

# If only enum issues:
# 1. Edit migration SQL to add enum values first
# 2. Delete migration from _prisma_migrations table
# 3. Re-run: npx prisma migrate dev
```

---

## 📋 **PHASE MIGRATION CHECKLIST**

### **Before Starting Any Phase Migration:**
- [ ] Current database state documented
- [ ] Backup created (if production data exists)
- [ ] Migration plan reviewed and approved
- [ ] Test database ready for trial run

### **During Migration:**
- [ ] Schema changes implemented gradually
- [ ] Enum values added before dependent tables
- [ ] Foreign key relationships verified
- [ ] Computed fields and indexes included
- [ ] Migration SQL manually reviewed

### **After Migration:**
- [ ] Prisma client regenerated (`npx prisma generate`)
- [ ] Seed script updated for new fields/enums
- [ ] Phase-specific verification script run
- [ ] All tables and relationships verified
- [ ] Sample CRUD operations tested

---

## 🚨 **EMERGENCY RECOVERY PROCEDURES**

### **If Migration Completely Fails:**
```bash
# 1. Drop and recreate database
dropdb projectflo_dev
createdb projectflo_dev

# 2. Fresh setup
npx prisma db push --force-reset
npx prisma db seed
npx prisma generate

# 3. Verify with audit script
npx ts-node check-phase1.ts
```

### **If Seed Script Fails:**
```bash
# 1. Identify failed records (usually unique constraint violations)
# 2. Update seed script to use upsert instead of create/createMany
# 3. Re-run seed
npx prisma db seed
```

---

## 📊 **PHASE COMPLETION VERIFICATION**

### **Phase 1 Complete When:**
- [ ] All 6 timeline tables exist with correct structure
- [ ] 5 timeline layers seeded (Video, Audio, Music, Graphics, B-Roll)
- [ ] Component types updated (COVERAGE_LINKED, EDIT)
- [ ] Analytics fields integrated and functional
- [ ] Dependency tracking system ready
- [ ] Pricing modifiers with conditional logic working
- [ ] Audit script passes all checks

### **Ready for Backend Implementation When:**
- [ ] Database foundation complete and verified
- [ ] All required models accessible via Prisma client
- [ ] Seed data properly populated
- [ ] CRUD operations tested and working
- [ ] No migration or constraint errors

---

## 🔧 **USEFUL DEBUGGING COMMANDS**

```bash
# Check current database schema
npx prisma db pull && git diff prisma/schema.prisma

# View migration history
npx prisma migrate status

# Reset single table (PostgreSQL)
psql projectflo_dev -c "TRUNCATE TABLE timeline_layers CASCADE;"

# Check enum values
psql projectflo_dev -c "SELECT unnest(enum_range(NULL::\"ComponentType\"));"

# View database contents
npx prisma studio

# Generate fresh client after any schema change
npx prisma generate
```

---

**Remember:** Always test migrations on development database first, and never run destructive commands on production without verified backups!
