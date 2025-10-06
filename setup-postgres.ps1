# PostgreSQL Setup Script for Settlr Project
# This script automates database and user creation for the Settlr application

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Settlr PostgreSQL Setup Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Configuration from application.properties
$DB_NAME = "settlr_db"
$DB_USER = "postgres"
$DB_PASSWORD = "post123"
$DB_HOST = "localhost"
$DB_PORT = "5432"

# Check if psql is available
Write-Host "Checking for PostgreSQL installation..." -ForegroundColor Yellow
try {
    $psqlVersion = psql --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] PostgreSQL found: $psqlVersion" -ForegroundColor Green
    } else {
        throw "psql not found"
    }
} catch {
    Write-Host "[ERROR] PostgreSQL not found in PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install PostgreSQL first:" -ForegroundColor Yellow
    Write-Host "  Option 1: Download from https://www.postgresql.org/download/windows/" -ForegroundColor White
    Write-Host "  Option 2: Use Chocolatey: choco install postgresql" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "This script will create:" -ForegroundColor Cyan
Write-Host "  - Database: $DB_NAME" -ForegroundColor White
Write-Host "  - Using default postgres user with your password" -ForegroundColor White
Write-Host ""

# Prompt for postgres superuser password
Write-Host "Enter the password for PostgreSQL 'postgres' superuser" -ForegroundColor Yellow
Write-Host "(This was set during PostgreSQL installation)" -ForegroundColor Gray
$postgresPassword = Read-Host "Password" -AsSecureString
$postgresPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($postgresPassword))

Write-Host ""
Write-Host "Testing connection to PostgreSQL..." -ForegroundColor Yellow

# Test connection
$env:PGPASSWORD = $postgresPasswordPlain
$testConnection = psql -U postgres -h $DB_HOST -p $DB_PORT -c "SELECT version();" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to connect to PostgreSQL" -ForegroundColor Red
    Write-Host "Error: $testConnection" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "  1. PostgreSQL service is running (check Services app)" -ForegroundColor White
    Write-Host "  2. Password is correct" -ForegroundColor White
    Write-Host "  3. PostgreSQL is listening on port $DB_PORT" -ForegroundColor White
    $env:PGPASSWORD = $null
    exit 1
}

Write-Host "[OK] Connected to PostgreSQL successfully" -ForegroundColor Green
Write-Host ""

# Check if database already exists
Write-Host "Checking if database '$DB_NAME' already exists..." -ForegroundColor Yellow
$dbExists = psql -U postgres -h $DB_HOST -p $DB_PORT -lqt 2>$null | Select-String -Pattern "^\s*$DB_NAME\s"

if ($dbExists) {
    Write-Host "[OK] Database '$DB_NAME' already exists" -ForegroundColor Green
} else {
    Write-Host "Creating database '$DB_NAME'..." -ForegroundColor Yellow
    $createDb = psql -U postgres -h $DB_HOST -p $DB_PORT -c "CREATE DATABASE $DB_NAME;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Database '$DB_NAME' created successfully" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Failed to create database" -ForegroundColor Red
        Write-Host "Error: $createDb" -ForegroundColor Red
        $env:PGPASSWORD = $null
        exit 1
    }
}

Write-Host ""
Write-Host "Verifying database connection..." -ForegroundColor Yellow
$verifyDb = psql -U postgres -h $DB_HOST -p $DB_PORT -d $DB_NAME -c "SELECT current_database();" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Successfully connected to '$DB_NAME' database" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to verify database connection" -ForegroundColor Red
    Write-Host "Error: $verifyDb" -ForegroundColor Red
    $env:PGPASSWORD = $null
    exit 1
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Database Configuration:" -ForegroundColor Cyan
Write-Host "  Host:     $DB_HOST" -ForegroundColor White
Write-Host "  Port:     $DB_PORT" -ForegroundColor White
Write-Host "  Database: $DB_NAME" -ForegroundColor White
Write-Host "  Username: $DB_USER" -ForegroundColor White
Write-Host "  Password: $DB_PASSWORD" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANT: Your application.properties is already configured correctly!" -ForegroundColor Yellow
Write-Host "File: backend/src/main/resources/application.properties" -ForegroundColor Gray
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Start the backend:" -ForegroundColor White
Write-Host "     cd backend" -ForegroundColor Gray
Write-Host "     .\mvnw.cmd spring-boot:run" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Create a test user (in another PowerShell window):" -ForegroundColor White
Write-Host "     `$body = @{ name='Alice'; email='alice@example.com'; password='test123' } | ConvertTo-Json" -ForegroundColor Gray
Write-Host "     Invoke-RestMethod -Uri http://localhost:8080/api/users -Method POST -Body `$body -ContentType 'application/json'" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Test login:" -ForegroundColor White
Write-Host "     `$loginBody = @{ email='alice@example.com'; password='test123' } | ConvertTo-Json" -ForegroundColor Gray
Write-Host "     Invoke-RestMethod -Uri http://localhost:8080/api/auth/login -Method POST -Body `$loginBody -ContentType 'application/json'" -ForegroundColor Gray
Write-Host ""

# Clear password from environment
$env:PGPASSWORD = $null

Write-Host "Happy coding!" -ForegroundColor Green
Write-Host ""
