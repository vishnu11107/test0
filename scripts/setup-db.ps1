# Database setup script for Meet AI Platform (PowerShell)

Write-Host "🚀 Setting up database..." -ForegroundColor Cyan

# Check if .env.local exists
if (-not (Test-Path .env.local)) {
    Write-Host "❌ .env.local file not found!" -ForegroundColor Red
    Write-Host "Please copy .env.example to .env.local and configure your DATABASE_URL"
    exit 1
}

# Check if DATABASE_URL is set
$envContent = Get-Content .env.local -Raw
if ($envContent -notmatch "DATABASE_URL=") {
    Write-Host "❌ DATABASE_URL not found in .env.local" -ForegroundColor Red
    Write-Host "Please add your Neon PostgreSQL connection string"
    exit 1
}

Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host "🔨 Generating migrations..." -ForegroundColor Yellow
npm run db:generate

Write-Host "🚀 Pushing schema to database..." -ForegroundColor Yellow
npm run db:push

Write-Host "🌱 Seeding database with demo data..." -ForegroundColor Yellow
npm run db:seed

Write-Host "✅ Database setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "You can now:"
Write-Host "  - Run 'npm run dev' to start the development server"
Write-Host "  - Run 'npm run db:studio' to open Drizzle Studio"
Write-Host ""
Write-Host "Demo user credentials:"
Write-Host "  Email: demo@meetai.com"
Write-Host "  Password: demo123"
