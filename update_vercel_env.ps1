# Script to update Vercel Environment Variables
# Usage: ./update_vercel_env.ps1

Write-Host "Checking Vercel login status..."
vercel whoami
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: You are not logged in to Vercel." -ForegroundColor Red
    Write-Host "Please run 'vercel login' in your terminal, follow the instructions, and then run this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host "Linking Vercel project..."
# Link to the current project (assumes it was already linked or will auto-confirm with --yes if possible, 
# but usually requires interaction if not linked. We hope it is linked or user can interact).
cmd /c "vercel link --yes"

# Define variables
$EMAIL = "yousposh-sheets@youshop-prod.iam.gserviceaccount.com"
$SPREADSHEET_ID = "1k76HdtTH4mVY13rK1l3xafpHRjS4cckbYdyo3t8jUl0"
$PRIVATE_KEY_BASE64 = "LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JSUV2QUlCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktZd2dnU2lBZ0VBQW9JQkFRREUzWlIrdmRpNWhyb3EKcEM2TG1lMnRiSW9oUmQ4ZUdPMVpFdnJUMWs5UlhKdXZZc2pVQmp3NklMbzhsQUdLU1V4VmtVT2tKYmo1NnNiRwpQYlpqY0IyYnNiUTk2bDVYSnpJQzNBOW96dS9zcDV1dDVvS2t0V3JDRG5WZHo2WFc1cWtDZW1iNXFQS2JTYm5PCktrWE56MFI3R09EaWljdWlocmJodXpxV1pxeUZKSWFNaWdGaXFLUEN1VGY3aGUwbWM2Y0JtZDB6V1k4QlZVdEQKQTEwSmEwMGtTRm1DQ0pLeDcxczR3RmtGbmZtK2RncGpYVEswM005azdWOElnRkdXbTJSYzdkTE0vdU5MeTFqeQpSYmM3cjhYSnp3WnJtSzlMMnROdUlsV2RSVmNEQXVNaTZTSVhNMzNXVWlFWThRQzhyaFFVenJvL0YxYUU0TGpDCkpYWnNTb2Q3QWdNQkFBRUNnZ0VBQzdSaTVsQXlTUUdPSXdmazdvN2wxemhMVkNRYjJtWEFBdHBDaUlMRzczN3kKa0xCdVlWREhsdXNvTjM3VFFwNE9DRTVkTjY2NGV6OXV0dzJuUU8xRERXVTQ0cStERVdwMnFqM2NPcTZIREVxQQowb3VRZSt0L1grOU5JaGs4OG5SL1d2TGRHWDNtZ3I0VTZvR1A2ZWNuV3F4RmZxS1R0V09PRHdpN09JTDlRZU1wCnZBV2hGTEZqL0xabWJ4aE92emY1dE1qV1hhNTdvSENmRm04TmQwWkpWenppQU5TZTJMU2tOMXloMXNBenBPtpSGtXWlpSZWFQZUFFc3FndzljCnFZOFlENTNVWjlCTUZTNFhwam1GMVU1WkhrS3VJNFl5Q1d2NzBFU0FyNXdsZlN0SW1mTlZoTDhkZTJVYmY0eW8KM3RsTjFXTXp0K3J6Y3N4STJIcmNpdz09Ci0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS0K"

# Function to add env var
function Add-VercelEnv {
    param($name, $value)
    Write-Host "Removing existing $name (if any)..."
    cmd /c "vercel env rm $name production --yes" 2>$null
    
    Write-Host "Adding $name..."
    $value | vercel env add $name production
}

# Add variables
Add-VercelEnv "GOOGLE_SERVICE_ACCOUNT_EMAIL" $EMAIL
Add-VercelEnv "GOOGLE_SHEETS_SPREADSHEET_ID" $SPREADSHEET_ID
Add-VercelEnv "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64" $PRIVATE_KEY_BASE64

Write-Host "Environment variables updated." -ForegroundColor Green
Write-Host "Redeploying to apply changes..."
cmd /c "vercel deploy --prod"
