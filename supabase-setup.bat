@echo off
echo Supabase CLI Setup for FindConstructionStaffing
echo ===============================================
echo.

REM Check if supabase works
.\supabase.exe --version > nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Supabase CLI not working properly.
    echo You may need the AMD64 version instead of ARM64.
    echo Download from: https://github.com/supabase/cli/releases
    pause
    exit /b 1
)

echo Step 1: Login to Supabase
echo -------------------------
.\supabase.exe login
echo.

echo Step 2: Initialize Supabase
echo --------------------------
.\supabase.exe init
echo.

echo Step 3: Link to your project
echo ---------------------------
echo Linking to project: chyaqualjbhkykgofcov
.\supabase.exe link --project-ref chyaqualjbhkykgofcov
echo.

echo Step 4: Push migrations
echo ----------------------
.\supabase.exe db push
echo.

echo Setup complete!
pause