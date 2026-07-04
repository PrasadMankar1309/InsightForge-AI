@echo off
REM Company Intel Studio - Quick Setup Script
REM This script sets up the project and gets it ready to run

echo.
echo ======================================
echo Company Intel Studio - Setup Script
echo ======================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed. Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo ✓ Node.js found
echo.

REM Check if .env.local exists
if exist ".env.local" (
    echo ✓ .env.local already exists
    echo.
    echo Current environment variables:
    type .env.local
    echo.
    set /p response="Do you want to overwrite .env.local? (y/n): "
    if /i not "%response%"=="y" (
        echo Skipping environment setup.
        goto install
    )
) else (
    echo Creating .env.local from template...
)

REM Copy .env.example to .env.local if it doesn't exist
copy .env.example .env.local >nul 2>nul

echo.
echo ======================================
echo API KEY SETUP
echo ======================================
echo.
echo You need three API keys to run this app:
echo.
echo 1. SERPER_API_KEY - Get from https://serper.dev/
echo    This is used to search for company websites.
echo.
echo 2. OPENROUTER_API_KEY - Get from https://openrouter.ai/
echo    This is used for AI analysis and insights.
echo.
echo 3. DISCORD_BOT_TOKEN (optional) - Get from Discord Developer Portal
echo    This is used to send notifications to Discord.
echo.

REM Create a temporary script to edit .env.local
setlocal enabledelayedexpansion

:get_serper
set /p serper_key="Enter SERPER_API_KEY (or press Enter to skip): "
if not "!serper_key!"=="" (
    for /f "delims=" %%a in ('powershell -Command "((Get-Content '.env.local') -replace 'SERPER_API_KEY=.*', 'SERPER_API_KEY=!serper_key!') | Set-Content '.env.local'"') do @echo.
)

:get_openrouter
set /p openrouter_key="Enter OPENROUTER_API_KEY (or press Enter to skip): "
if not "!openrouter_key!"=="" (
    for /f "delims=" %%a in ('powershell -Command "((Get-Content '.env.local') -replace 'OPENROUTER_API_KEY=.*', 'OPENROUTER_API_KEY=!openrouter_key!') | Set-Content '.env.local'"') do @echo.
)

:get_discord
set /p discord_token="Enter DISCORD_BOT_TOKEN (or press Enter to skip): "
if not "!discord_token!"=="" (
    for /f "delims=" %%a in ('powershell -Command "((Get-Content '.env.local') -replace 'DISCORD_BOT_TOKEN=.*', 'DISCORD_BOT_TOKEN=!discord_token!') | Set-Content '.env.local'"') do @echo.
)

set /p discord_channel="Enter DISCORD_CHANNEL_ID (or press Enter to skip): "
if not "!discord_channel!"=="" (
    for /f "delims=" %%a in ('powershell -Command "((Get-Content '.env.local') -replace 'DISCORD_CHANNEL_ID=.*', 'DISCORD_CHANNEL_ID=!discord_channel!') | Set-Content '.env.local'"') do @echo.
)

echo.
echo ✓ Environment variables saved to .env.local
echo.

:install
echo ======================================
echo INSTALLING DEPENDENCIES
echo ======================================
echo.

if exist "node_modules" (
    echo node_modules already exists. Skipping npm install.
    echo.
    set /p reinstall="Reinstall dependencies? (y/n): "
    if /i not "!reinstall!"=="y" (
        goto verify
    )
)

echo Running npm install...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)

echo ✓ Dependencies installed
echo.

:verify
echo ======================================
echo VERIFYING BUILD
echo ======================================
echo.

echo Running npm run build...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed. Check errors above.
    pause
    exit /b 1
)

echo ✓ Build successful!
echo.

echo ======================================
echo SETUP COMPLETE
echo ======================================
echo.
echo Your Company Intel Studio is ready!
echo.
echo Next steps:
echo   1. Run: npm run dev
echo   2. Open: http://localhost:3000
echo   3. Start researching companies!
echo.
echo For detailed instructions, see SETUP.md
echo.
pause
