# Alpha Edge - Global Elite Trader Platform

🚀 **The Global Leaderboard for Elite Traders**

Alpha Edge is a professional trading analytics platform that identifies and connects the world's top-performing traders. Only those who consistently prove their skills gain access to capital management opportunities and exclusive trading partnerships.

## ✨ Key Features

### 🏆 Global Leaderboard
- Real-time trader rankings based on verified performance
- Comprehensive risk-adjusted metrics
- Live account verification requirements

### 📊 Advanced Analytics
- Professional-grade performance metrics
- Risk analysis and drawdown tracking
- Sharpe ratio, Sortino ratio, and expectancy calculations
- Monthly performance analysis

### 🔗 Multi-Platform Integration
- **14+ Trading Platforms Supported:**
  - Brokers: Interactive Brokers, Alpaca, Schwab, E*TRADE, Robinhood, MetaTrader
  - Exchanges: Binance, Coinbase Pro, Kraken, KuCoin, Bybit, OKX, Gate.io, Huobi
- API key authentication with encryption
- File upload support for HTML/CSV statements

### 🛡️ Enterprise Security
- Military-grade encryption for sensitive data
- File malware scanning and validation
- XSS protection and content security policies
- Rate limiting and audit logging
- GDPR-compliant data handling

### 📱 Mobile-First Design
- Responsive neumorphic UI design
- Touch-optimized interactions
- Offline-capable functionality
- Progressive Web App features

## 🚀 Quick Start

### Option 1: Open Demo (No Installation Required)
1. Open `demo.html` in your web browser
2. See the complete UI preview of the platform

### Option 2: Full Development Environment

#### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

#### Installation

**Method A: Using nvm (Recommended)**
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart terminal or run:
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install and use Node.js LTS
nvm install --lts
nvm use --lts
```

**Method B: Direct Download**
1. Go to [https://nodejs.org](https://nodejs.org)
2. Download the LTS version for macOS
3. Install the package

**Method C: Manual Installation (if download fails)**
```bash
# Download Node.js binary
curl -L -o node.tar.gz https://nodejs.org/dist/v18.17.1/node-v18.17.1-darwin-x64.tar.gz

# Extract
tar -xf node.tar.gz

# Add to PATH (add to your ~/.zshrc or ~/.bash_profile)
export PATH="/path/to/node-v18.17.1-darwin-x64/bin:$PATH"
```

#### Install Dependencies
```bash
cd "/Users/a00013/Alpha Edge"
npm install
```

#### Start Development Server
```bash
npm run dev
```

#### Open Browser
Navigate to `http://localhost:3000`

## 📊 Features

- **Landing Page**: Professional introduction to the global trading leaderboard
- **User Authentication**: Secure registration and login system
- **Dashboard**: Comprehensive trading metrics and performance analysis
- **Global Leaderboard**: Rankings of verified elite traders worldwide
- **Platform Integration**: Connect to 14+ brokers and cryptocurrency exchanges
- **Trade Import**: Upload and parse trading statements from any broker
- **Advanced Analytics**: Risk metrics, win rates, and performance scoring
- **Security**: Military-grade encryption and malware scanning
- **Offline Operation**: Works completely independently of external services

## 🏗️ Project Structure

```
alpha-edge/
├── 📁 src/
│   ├── components/           # Reusable UI components (NeumorphicCard, SecurityMonitor)
│   ├── pages/               # Main application pages
│   │   ├── Home.jsx         # Landing page with authentication
│   │   ├── Dashboard.jsx    # Trading analytics dashboard
│   │   ├── Leaderboard.jsx  # Global trader rankings
│   │   ├── Connect.jsx      # Account connection options
│   │   ├── ImportTrades.jsx # File upload with security scanning
│   │   └── BrokerExchangeConnect.jsx # API integration interface
│   ├── entities/            # Layout and navigation components
│   ├── services/            # Business logic and utilities
│   │   ├── localDataService.js      # Local storage management
│   │   └── securityService.js       # Security & encryption
│   ├── App.jsx              # Main application with routing
│   ├── main.jsx             # React entry point
│   └── index.css            # Global styles with mobile optimizations
├── 📁 public/               # Static assets
├── 📄 vercel.json           # Vercel deployment configuration
├── 📄 .vercelignore         # Files to exclude from deployment
├── 📄 DEPLOYMENT.md         # Complete deployment guide
├── 📄 API_INTEGRATION_GUIDE.md # API setup documentation
└── 📄 README.md             # This file
```

## 🔧 Technology Stack

### Frontend Framework
- **React 18** - Modern React with hooks and concurrent features
- **React Router 6** - Client-side routing with protected routes
- **Vite** - Lightning-fast build tool and dev server
- **TypeScript-ready** - Configured for future TypeScript migration

### UI/UX Design
- **Tailwind CSS** - Utility-first CSS with custom neumorphic design system
- **Lucide React** - Consistent icon library
- **Recharts** - Professional data visualization
- **Mobile-first** - Responsive design with touch optimizations

### Security & Data
- **AES Encryption** - Military-grade encryption for sensitive data
- **Content Security Policy** - XSS protection and secure resource loading
- **File Security** - Malware scanning and validation
- **Rate Limiting** - DDoS protection and abuse prevention
- **Local Storage** - Encrypted client-side data persistence

### Development & Deployment
- **ESLint + Prettier** - Code quality and formatting
- **Vercel** - Production deployment platform
- **GitHub Actions** - CI/CD pipeline ready
- **PWA Features** - Service worker and offline capabilities

## 📈 Trading Metrics

The platform calculates comprehensive trading performance metrics including:

- Win Rate & Profit Factor
- Maximum Drawdown
- Risk per Trade
- Sharpe & Sortino Ratios
- Annualized Return
- Expectancy & Risk/Reward Ratio
- Trade Frequency Analysis
- Monthly Performance Tracking

## 🎨 Design

Features a modern neumorphic design with:
- Soft shadows and highlights
- Subtle color gradients
- Responsive layout
- Clean, professional interface

## 🔒 Privacy & Independence

- No external API dependencies
- All data stored locally in browser
- Completely offline operation
- No data collection or tracking

## 🚀 Deployment

### Vercel (Recommended)
The platform is pre-configured for Vercel deployment:

1. **Connect GitHub Repository** to Vercel
2. **Automatic Deployment** on every push to main
3. **Global CDN** with edge network
4. **SSL Certificate** included
5. **Analytics & Monitoring** built-in

See `DEPLOYMENT.md` for complete Vercel setup instructions.

### Manual Build
```bash
npm run build
```

The built files will be in the `dist/` directory, ready for deployment to:
- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- Any static hosting service

### Production URLs
- **Live Demo**: Deployed on Vercel
- **Repository**: https://github.com/avoid-sys/alpha-edge
- **Documentation**: See `API_INTEGRATION_GUIDE.md` for backend setup

## 📞 Support

If you encounter issues:

1. Make sure Node.js is properly installed: `node --version`
2. Check npm: `npm --version`
3. Clear node modules and reinstall: `rm -rf node_modules && npm install`
4. Try different Node.js installation method

## 📝 License

This project is independent and self-contained.
