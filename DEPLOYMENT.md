# 🚀 SongScribe Website Deployment Guide

## Current Deployment: Cloudflare Pages

This website is deployed to **Cloudflare Pages**, a modern edge hosting platform that automatically deploys from your `main` branch.

---

## Quick Start (5 minutes)

### Prerequisites
- Cloudflare account (free)
- GitHub repository with this code
- Domain (optional - Cloudflare provides `*.pages.dev` subdomain)

### 1. Connect to Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click **Pages** in the sidebar
3. Click **Create a project** → **Connect to Git**
4. Select the `songscribe-website` repository
5. Configure build settings:
   - **Framework**: Jekyll
   - **Build command**: `bundle exec jekyll build`
   - **Build output directory**: `_site`
   - **Node.js version**: 18.x

### 2. Set Environment Variables

Add this environment variable:
```
JEKYLL_ENV = production
```

### 3. Deploy

Click **Save and Deploy**. Your site goes live at:
```
https://songscribe-website.pages.dev
```

**Full setup guide**: See [CLOUDFLARE_PAGES_SETUP.md](./CLOUDFLARE_PAGES_SETUP.md)

---

## 🔄 Deploying Updates

### Automatic Deployment (Recommended)

Every push to `main` automatically deploys:

```bash
# Make changes
git add .
git commit -m "Update website"
git push origin main
```

Cloudflare automatically:
- ✅ Detects the push
- ✅ Installs dependencies (Gemfile)
- ✅ Builds Jekyll site
- ✅ Deploys to global CDN
- ✅ Deploy time: 1-3 minutes

### Manual Deployment via CLI

```bash
# Build locally first
npm run build:production && npm run optimize

# Deploy to Cloudflare Pages
npm run deploy:cf
```

Or manually:
```bash
npx wrangler pages deploy _site --project-name=songscribe-website
```

---

## 📊 Production Build Commands

### Option 1: Deploy Script (Recommended)
```bash
npm run deploy
```
Then push to main branch.

### Option 2: Manual Steps
```bash
# Install dependencies
bundle install && npm install

# Build for production
JEKYLL_ENV=production bundle exec jekyll build

# Optimize assets (optional)
npm run optimize

# Deploy (if using CLI)
npm run deploy:cf
```

---

## 🎯 Custom Domain Setup

### Use Your Own Domain

In Cloudflare Dashboard:

1. Navigate to Pages → songscribe-website
2. Click **Settings** → **Custom domain**
3. Add your domain (e.g., `songscribe.app`)
4. Follow DNS configuration

### DNS Configuration

If your domain is NOT on Cloudflare:

```
Type: CNAME
Name: songscribe
Value: songscribe-website.pages.dev
TTL: Auto
```

---

## 📱 Features of Cloudflare Pages

✅ **Automatic HTTPS** - SSL/TLS included  
✅ **Global CDN** - Fast content delivery worldwide  
✅ **Smart Caching** - Automatic cache optimization  
✅ **Zero-Config** - Automatic environment setup  
✅ **Instant Rollbacks** - Revert bad deployments  
✅ **Analytics** - View traffic and performance  
✅ **Free Custom Domain** - With Cloudflare account  

---

## 🛠️ Troubleshooting

### Build Failing

Check the build log in Cloudflare Dashboard:
1. Pages → songscribe-website → Deployments
2. Click the failed deployment
3. View the **Build log**

**Common issues**:
- Ruby version mismatch
- Missing Gemfile dependencies
- Jekyll configuration errors

### Images Not Loading

1. Verify image paths use relative URLs (e.g., `/assets/images/...`)
2. Ensure `baseurl` is empty in `_config.yml`
3. Confirm images are committed to git
4. Clear browser cache

### Site Showing Old Version

Clear Cloudflare cache:
1. Dashboard → Pages → songscribe-website
2. Go to **Settings**
3. Look for cache clear option (available in Pro plans)

For free tier, wait 30 minutes or check the deployment status.

---

## 📈 Monitoring

### View Deployments
- **Dashboard**: Pages → songscribe-website → Deployments
- **GitHub**: Repository → Actions tab (if configured)

### Check Performance
- **Analytics**: Pages → songscribe-website → Analytics
- **Real User Metrics**: Cloudflare Dashboard → Speed → Core Web Vitals

---

## 🔐 Security

Cloudflare Pages provides:
- ✅ Automatic HTTPS/TLS
- ✅ DDoS protection
- ✅ WAF (Web Application Firewall)
- ✅ Bot Management
- ✅ Access Control

---

## Cost

**Cloudflare Pages Pricing**:
- **Free tier**: Unlimited sites, builds, and bandwidth
- **Pro/Business**: Advanced features and priority support

This project uses the free tier, which includes everything needed.

---

## Development Workflow

### Local Development
```bash
# Start local server with live reload
npm run dev

# Visit http://localhost:4000
```

### Before Pushing
```bash
# Build production version
npm run build:production

# Optimize assets
npm run optimize

# Preview output
npm run preview
```

### Push to Deploy
```bash
git add .
git commit -m "Update website"
git push origin main
# → Cloudflare automatically deploys
```

---

## Previous Deployment (GitHub Pages)

This project was previously deployed to GitHub Pages. To migrate:

1. ✅ Update DNS (if using custom domain)
2. ✅ Test Cloudflare Pages deployment
3. ✅ Verify everything works
4. ✅ Update documentation (this file)
5. ⚠️ Keep GitHub repository as backup

---

## Resources

- 📖 [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- 📖 [Jekyll Documentation](https://jekyllrb.com/docs/)
- 🔗 [Full Setup Guide](./CLOUDFLARE_PAGES_SETUP.md)
- 📧 Support: support@cloudflare.com

---

## Next Steps

1. **Sign up** for Cloudflare (free)
2. **Connect** GitHub repository to Pages
3. **Configure** build settings (see Quick Start above)
4. **Deploy** - automatic on every push to `main`
5. **Monitor** via Cloudflare Dashboard
6. **Optimize** with `npm run optimize`

Your website is now deployed on a global edge network! 🚀
