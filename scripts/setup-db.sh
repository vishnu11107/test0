#!/bin/bash

# Database setup script for Meet AI Platform

echo "🚀 Setting up database..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    echo "Please copy .env.example to .env.local and configure your DATABASE_URL"
    exit 1
fi

# Check if DATABASE_URL is set
if ! grep -q "DATABASE_URL=" .env.local; then
    echo "❌ DATABASE_URL not found in .env.local"
    echo "Please add your Neon PostgreSQL connection string"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🔨 Generating migrations..."
npm run db:generate

echo "🚀 Pushing schema to database..."
npm run db:push

echo "🌱 Seeding database with demo data..."
npm run db:seed

echo "✅ Database setup complete!"
echo ""
echo "You can now:"
echo "  - Run 'npm run dev' to start the development server"
echo "  - Run 'npm run db:studio' to open Drizzle Studio"
echo ""
echo "Demo user credentials:"
echo "  Email: demo@meetai.com"
echo "  Password: demo123"
