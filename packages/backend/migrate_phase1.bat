@echo off
REM =====================================================
REM Phase 1 Database Migration Script (Windows)
REM Date: June 19, 2025
REM Purpose: Execute Phase 1 database migration safely
REM =====================================================

echo 🚀 Starting Phase 1 Database Migration...
echo =============================================

REM 1. Check if DATABASE_URL is set
if "%DATABASE_URL%"=="" (
    echo ❌ ERROR: DATABASE_URL environment variable not set
    pause
    exit /b 1
)

REM 2. Create backup filename with timestamp
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "BACKUP_FILE=backup_%YYYY%%MM%%DD%_%HH%%Min%%Sec%.sql"

echo 📦 Creating database backup...
echo Backup will be saved as: %BACKUP_FILE%

REM 3. Create backup
pg_dump "%DATABASE_URL%" > "%BACKUP_FILE%"
if errorlevel 1 (
    echo ❌ ERROR: Failed to create database backup
    pause
    exit /b 1
) else (
    echo ✅ Database backup created successfully: %BACKUP_FILE%
)

REM 4. Run migration
echo.
echo 🔄 Running Phase 1 database migration...
psql "%DATABASE_URL%" -f .\prisma\migrations\phase1_foundation_migration.sql

if errorlevel 1 (
    echo ❌ ERROR: Migration failed. Check the logs above.
    echo You can restore from backup: psql "%DATABASE_URL%" ^< "%BACKUP_FILE%"
    pause
    exit /b 1
) else (
    echo ✅ Phase 1 migration completed successfully!
)

REM 5. Regenerate Prisma client
echo.
echo 🔄 Regenerating Prisma client...
call npx prisma generate

if errorlevel 1 (
    echo ❌ ERROR: Failed to regenerate Prisma client
    pause
    exit /b 1
) else (
    echo ✅ Prisma client regenerated successfully!
)

REM 6. Success message
echo.
echo ✅ Phase 1 Database Migration Complete!
echo =============================================
echo 📋 Next Steps:
echo 1. Test the application to ensure no breaking changes
echo 2. Proceed with Phase 1B: Backend API Updates
echo 3. Begin Phase 1C: Frontend Implementation
echo.
echo 🔄 To rollback if needed:
echo psql "%%DATABASE_URL%%" ^< "%BACKUP_FILE%"
echo.
pause
