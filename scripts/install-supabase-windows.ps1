# PowerShell script to install Supabase CLI on Windows

Write-Host "🚀 Installing Supabase CLI for Windows" -ForegroundColor Cyan
Write-Host ""

# Check if scoop is installed
if (Get-Command scoop -ErrorAction SilentlyContinue) {
    Write-Host "✅ Scoop is installed" -ForegroundColor Green
    
    # Add Supabase bucket
    Write-Host "Adding Supabase bucket..." -ForegroundColor Yellow
    scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
    
    # Install Supabase
    Write-Host "Installing Supabase CLI..." -ForegroundColor Yellow
    scoop install supabase
    
    Write-Host "✅ Supabase CLI installed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Scoop is not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "To install Scoop, run this in PowerShell:" -ForegroundColor Yellow
    Write-Host 'irm get.scoop.sh | iex' -ForegroundColor Cyan
    Write-Host ""
    Write-Host "After installing Scoop, run this script again."
    Write-Host ""
    Write-Host "Alternative: Download directly from GitHub" -ForegroundColor Yellow
    Write-Host "1. Visit: https://github.com/supabase/cli/releases" -ForegroundColor White
    Write-Host "2. Download: supabase_windows_amd64.tar.gz" -ForegroundColor White
    Write-Host "3. Extract and add to PATH" -ForegroundColor White
}