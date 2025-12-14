# 🚀 Quick Start Guide - Alpha Edge Platform

## The Problem
You're seeing "localhost refused to connect" because the development server isn't running. This requires Node.js to be installed first.

## Solutions (Choose One)

### Option 1: One-Click Setup (Recommended)
```bash
cd "/Users/a00013/Alpha Edge"
./setup.sh
```

### Option 2: Manual Installation

#### Step 1: Install Node.js
**Method A: Via Website (Easiest)**
1. Open: https://nodejs.org
2. Download the "LTS" version for macOS
3. Run the installer
4. Restart your terminal

**Method B: Via Terminal**
```bash
# Install nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Load nvm (add this to your ~/.zshrc if needed)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install Node.js
nvm install --lts
nvm use --lts
```

#### Step 2: Verify Installation
```bash
node --version  # Should show v18.x.x or higher
npm --version   # Should show a version number
```

#### Step 3: Install Dependencies
```bash
cd "/Users/a00013/Alpha Edge"
npm install
```

#### Step 4: Start Server
```bash
npm run dev
```

#### Step 5: Open Browser
Go to: http://localhost:3000

You will see the Alpha Edge landing page where you can:
- Learn about the global trading leaderboard
- Register as a new trader or sign in
- Explore the platform features

### Option 3: View Demo Only (No Installation)
Simply open `demo.html` in your web browser to see the platform preview.

## Troubleshooting

### If Node.js installation fails:
- Try the website download method
- Restart your terminal completely
- Check if you have administrator permissions

### If npm install fails:
```bash
rm -rf node_modules package-lock.json
npm install
```

### If server won't start:
```bash
# Kill any existing processes on port 3000
lsof -ti:3000 | xargs kill -9
npm run dev
```

### Check what's running on port 3000:
```bash
lsof -i :3000
```

## 🎯 Expected Result
Once running, you should see:
- ✅ Development server starts on http://localhost:3000
- ✅ Hot reload enabled
- ✅ Full React application with routing
- ✅ Trading dashboard, leaderboard, and import features

## 📞 Need Help?
1. Check the README.md for detailed documentation
2. Try the demo.html file for immediate preview
3. Restart your terminal and try again

The platform is fully functional and independent - no external services required!
