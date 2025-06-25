@echo off
echo Supabase CLI Setup for FindConstructionStaffing
echo ===============================================
echo.

REM Find Supabase executable
set SUPABASE_CMD=
if exist "%~dp0supabase.exe" (
    set "SUPABASE_CMD=%~dp0supabase.exe"
) else (
    where supabase >nul 2>&1
    if %errorlevel% equ 0 (
        set "SUPABASE_CMD=supabase"
    )
)

if "%SUPABASE_CMD%"=="" (
    echo ERROR: Supabase CLI not found!
    echo Please install Supabase CLI or place supabase.exe in the project directory.
    echo Download from: https://github.com/supabase/cli/releases
    pause
    exit /b 1
)

REM Check if supabase works
"%SUPABASE_CMD%" --version > nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Supabase CLI not working properly.
    echo You may need a different architecture version (AMD64 vs ARM64).
    echo Download from: https://github.com/supabase/cli/releases
    pause
    exit /b 1
)

echo Step 1: Login to Supabase
echo -------------------------
"%SUPABASE_CMD%" login
echo.

echo Step 2: Initialize Supabase
echo --------------------------
"%SUPABASE_CMD%" init
echo.

echo Step 3: Link to your project
echo ---------------------------
echo You need to provide your project reference ID.
echo Find it in Supabase Dashboard: Settings - General - Reference ID
echo.
set /p PROJECT_REF="Enter your Supabase project reference ID: "
"%SUPABASE_CMD%" link --project-ref %PROJECT_REF%
echo.

echo Step 4: Push migrations
echo ----------------------
"%SUPABASE_CMD%" db push
echo.

echo Setup complete!
pause