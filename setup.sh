#!/bin/bash

echo "🚀 Alpha Edge Setup Script"
echo "=========================="

# Check if Node.js is installed
if command -v node &> /dev/null; then
    echo "✅ Node.js is installed: $(node --version)"
else
    echo "❌ Node.js is not installed"

    # Try to install via nvm
    if [ -d "$HOME/.nvm" ]; then
        echo "📦 Found nvm, trying to install Node.js..."
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        nvm install --lts
        nvm use --lts
    else
        echo "🔧 Installing nvm..."
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        nvm install --lts
        nvm use --lts
    fi
fi

# Verify Node.js installation
if command -v node &> /dev/null; then
    echo "✅ Node.js installed successfully: $(node --version)"
    echo "✅ npm version: $(npm --version)"
else
    echo "❌ Node.js installation failed"
    echo "🔧 Manual installation options:"
    echo "   1. Download from: https://nodejs.org"
    echo "   2. Install via Homebrew: brew install node"
    exit 1
fi

# Install dependencies
echo "📦 Installing project dependencies..."
if npm install; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Start development server
echo "🚀 Starting development server..."
echo "📱 Once started, open: http://localhost:3000"
echo "🛑 Press Ctrl+C to stop the server"
echo ""

npm run dev
