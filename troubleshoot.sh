#!/bin/bash

echo "🔧 Alpha Edge Troubleshooting Script"
echo "======================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✅ npm version: $(npm --version)"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Please run this script from the Alpha Edge directory"
    exit 1
fi

echo "✅ In Alpha Edge directory"

# Kill any existing processes on port 3000
echo "🔄 Killing any existing processes on port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Clear node_modules and reinstall if needed
if [ "$1" = "clean" ]; then
    echo "🧹 Cleaning and reinstalling dependencies..."
    rm -rf node_modules package-lock.json
    npm install
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the development server
echo "🚀 Starting development server..."
echo "Once started, open http://localhost:3000/connect in your browser"
npm run dev
