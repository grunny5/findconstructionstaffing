@echo off
echo Testing Supabase CLI...

REM Try local project supabase.exe first
if exist "%~dp0supabase.exe" (
    echo Using local Supabase executable...
    "%~dp0supabase.exe" --version
    goto :eof
)

REM Try system PATH
where supabase >nul 2>&1
if %errorlevel% equ 0 (
    echo Using Supabase from PATH...
    supabase --version
    goto :eof
)

REM Try common installation locations
if exist "%LOCALAPPDATA%\supabase\bin\supabase.exe" (
    echo Using Supabase from LocalAppData...
    "%LOCALAPPDATA%\supabase\bin\supabase.exe" --version
    goto :eof
)

if exist "%USERPROFILE%\.supabase\bin\supabase.exe" (
    echo Using Supabase from user profile...
    "%USERPROFILE%\.supabase\bin\supabase.exe" --version
    goto :eof
)

REM Try Downloads folder as last resort
if exist "%USERPROFILE%\Downloads\supabase_windows_arm64\supabase.exe" (
    echo Using Supabase from Downloads folder...
    "%USERPROFILE%\Downloads\supabase_windows_arm64\supabase.exe" --version
    goto :eof
)

echo ERROR: Supabase CLI not found!
echo Please install Supabase CLI or place supabase.exe in the project directory.
echo Installation instructions: https://supabase.com/docs/guides/cli
exit /b 1