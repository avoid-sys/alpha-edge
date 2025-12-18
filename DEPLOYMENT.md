# 🚀 Vercel Deployment Guide

This guide provides step-by-step instructions for deploying Alpha Edge to Vercel with automatic redeployment on every Git push.

## 📋 Prerequisites

- ✅ **GitHub Repository**: https://github.com/avoid-sys/alpha-edge.git
- ✅ **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
- ✅ **Project Ready**: All configuration files are set up

## ⚡ Quick Deploy (5 minutes)

### Step 1: Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click **"Import Project"**
3. Select **"From Git Repository"**
4. Connect your **GitHub account**
5. Find and select **"avoid-sys/alpha-edge"**

### Step 2: Configure Project
Vercel will automatically detect the configuration:

- ✅ **Framework**: Vite (detected automatically)
- ✅ **Build Command**: `npm run build` (from package.json)
- ✅ **Output Directory**: `dist/` (from vercel.json)
- ✅ **Install Command**: `npm install` (default)

### Step 3: Environment Variables (Optional)
If you have Supabase configured, add these environment variables:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 4: Deploy
1. Click **"Deploy"**
2. Wait 2-3 minutes for build completion
3. **🎉 Your site is live!**

## 🔄 Automatic Redeployment

### How It Works
- **Every push** to the `main` branch triggers automatic deployment
- **No manual intervention** required
- **Instant updates** when you push code changes

### Deployment Flow
```
Git Push → GitHub → Vercel → Build → Deploy → Live
```

### Monitoring Deployments
1. Go to your Vercel dashboard
2. Select your project
3. View **"Deployments"** tab
4. See build logs and status

## ⚙️ Configuration Details

### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev"
}
```

### Key Features
- **SPA Routing**: All routes serve `index.html`
- **Static Build**: Optimized for static hosting
- **Fast Builds**: Incremental caching
- **CDN Distribution**: Global edge network

## 🌐 Custom Domain (Optional)

### Adding a Custom Domain
1. Go to Vercel project settings
2. Click **"Domains"**
3. Add your domain (e.g., `alphaedge.com`)
4. Follow DNS configuration instructions
5. **SSL certificate** is automatic

### Domain Configuration
```
CNAME yourdomain.com → yourdomain.vercel.app
```

## 🔧 Troubleshooting

### Build Fails
**Check:**
- Node.js version compatibility
- Dependencies in package.json
- Build scripts working locally

**Solution:**
```bash
# Test locally first
npm run build
npm run preview
```

### Routing Issues
**Problem:** Client-side routing not working
**Solution:** Check `vercel.json` routes configuration

### Environment Variables
**Problem:** Supabase not connecting
**Solution:** Verify environment variables in Vercel settings

### Performance Issues
**Check:**
- Bundle size (`npm run build`)
- Image optimization
- CDN configuration

## 📊 Vercel Features Used

### Automatic Features
- ✅ **Global CDN** - Fast worldwide delivery
- ✅ **SSL Certificates** - HTTPS automatic
- ✅ **Analytics** - Built-in performance monitoring
- ✅ **Edge Network** - 100+ locations worldwide
- ✅ **Image Optimization** - Automatic image processing
- ✅ **Preview Deployments** - Every PR gets a preview URL

### Performance Optimizations
- ✅ **Code Splitting** - Configured in vite.config.js
- ✅ **Lazy Loading** - Automatic route-based splitting
- ✅ **Compression** - Gzip/Brotli automatic
- ✅ **Caching** - Intelligent cache headers

## 🔍 Monitoring & Analytics

### Vercel Analytics
- **Real-time metrics** in Vercel dashboard
- **Performance monitoring**
- **Error tracking**
- **User analytics**

### Custom Monitoring
```javascript
// Add to your app for custom analytics
console.log('Page loaded:', window.location.pathname);
console.log('Build info:', import.meta.env.VITE_BUILD_INFO);
```

## 🚀 Production URL

After deployment, your app will be available at:
```
https://alpha-edge-[random].vercel.app
```

Or your custom domain if configured.

## 📞 Support

### Vercel Issues
- Check Vercel status: [vercel.com/status](https://vercel.com/status)
- View build logs in Vercel dashboard
- Check GitHub Actions if you have CI/CD

### Application Issues
- Test locally: `npm run dev`
- Check browser console for errors
- Verify environment variables

## 🎯 Best Practices

### Deployment
- ✅ **Test locally** before pushing
- ✅ **Use feature branches** for development
- ✅ **Monitor build times** and optimize if needed
- ✅ **Set up alerts** for failed deployments

### Performance
- ✅ **Optimize images** before deployment
- ✅ **Minimize bundle size** (currently ~500KB)
- ✅ **Use CDN** for external assets
- ✅ **Enable compression** (automatic)

### Security
- ✅ **HTTPS enabled** automatically
- ✅ **Secure headers** configured
- ✅ **CSP policies** in place
- ✅ **No sensitive data** in client-side code

---

**🎉 Your Alpha Edge platform is now deployed with automatic updates!**

Every time you push to GitHub, Vercel will automatically rebuild and redeploy your application. 🚀