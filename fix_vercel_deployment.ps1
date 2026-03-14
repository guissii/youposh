# Script to fix Vercel deployment by linking the correct root directory

Write-Host "Cleaning up incorrect Vercel configuration in backend..."
if (Test-Path "backend\.vercel") {
    Remove-Item -Path "backend\.vercel" -Recurse -Force
    Write-Host "Removed backend\.vercel folder."
} else {
    Write-Host "No backend\.vercel folder found."
}

Write-Host "Linking the project root to Vercel..."
# This command attempts to link the current directory (root) to the Vercel project 'youposh'
# It uses --yes to skip confirmation if possible
vercel link --yes --project youposh

if ($LASTEXITCODE -eq 0) {
    Write-Host "Successfully linked project root!" -ForegroundColor Green
    Write-Host "Now deploying from root..."
    vercel deploy --prod
} else {
    Write-Host "Failed to link project. Please try running 'vercel link' manually in this directory." -ForegroundColor Red
}
