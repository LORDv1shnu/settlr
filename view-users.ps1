# Quick script to view users in the database

$DB_NAME = "settlr_db"
$DB_USER = "postgres"
$DB_HOST = "localhost"
$DB_PORT = "5432"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Settlr Database Viewer" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Prompt for password
Write-Host "Enter PostgreSQL password for user '$DB_USER':" -ForegroundColor Yellow
$password = Read-Host "Password" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

$env:PGPASSWORD = $passwordPlain

Write-Host ""
Write-Host "Users in database:" -ForegroundColor Green
Write-Host ""

psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -c "SELECT id, name, email, created_at FROM users ORDER BY id;"

Write-Host ""
Write-Host "Note: Passwords are stored in plaintext (demo only - not secure!)" -ForegroundColor Yellow
Write-Host ""

# Clear password
$env:PGPASSWORD = $null
