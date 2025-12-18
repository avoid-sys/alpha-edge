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

### Vercel (Recommended) - Automatic Deployment
The platform is pre-configured for **automatic Vercel deployment**:

#### Quick Setup
1. **Connect Repository**: Go to [Vercel](https://vercel.com) and import your GitHub repository
2. **Automatic Deployment**: Every push to `main` triggers deployment
3. **Custom Domain**: Add your domain (optional)
4. **Environment Variables**: Configure Supabase keys (optional)

#### Configuration Files Created
- **`vercel.json`** - Build configuration and routing
- **`.vercelignore`** - Files excluded from deployment
- **Automatic builds** - No manual intervention needed

#### Deployment Status
- **✅ Build Command**: `npm run build`
- **✅ Output Directory**: `dist/`
- **✅ SPA Routing**: Client-side routing configured
- **✅ Global CDN**: Fast worldwide delivery

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

## 🐛 Troubleshooting

### Vercel Deployment Issues

**If you see "404: NOT_FOUND" or "DEPLOYMENT_NOT_FOUND":**

1. **Check Vercel Dashboard**: Go to your Vercel project → Deployments tab
2. **View Build Logs**: Click on the latest deployment to see error details
3. **Common Issues**:
   - Build timeout (large bundle)
   - Missing dependencies
   - Environment variables not set
   - Framework not detected

**If you see a white screen:**

1. **Check Browser Console**: Press F12 → Console tab
2. **Look for JavaScript errors**
3. **CSP blocking**: Scripts might be blocked by security policy

**Quick Fixes:**

```bash
# Test build locally
npm run build

# Clear cache and rebuild
rm -rf node_modules/.vite
npm run build

# Check bundle size
ls -lh dist/assets/
```

### Local Development Issues

If you encounter local development issues:

1. **Node.js Version**: Ensure Node.js 16+ is installed
2. **Dependencies**: `rm -rf node_modules && npm install`
3. **Port Issues**: Development server might need different port
4. **Permissions**: Try running with different permissions

### Database Issues

**Demo Mode**: The app works in demo mode without Supabase
**Full Database**: Run `database-setup.sql` in Supabase dashboard

## 📞 Support

- **Vercel Issues**: Check [vercel.com/status](https://vercel.com/status)
- **Build Logs**: Available in Vercel dashboard
- **Console Errors**: Check browser developer tools

## 📝 License

This project is independent and self-contained.
