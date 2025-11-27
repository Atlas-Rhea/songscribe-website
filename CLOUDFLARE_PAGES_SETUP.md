# Cloudflare Pages Setup and Deployment Guide

## Quick Start

### Prerequisites
- Cloudflare account (free tier is fine)
- GitHub account with this repository
- Domain (optional - Cloudflare provides a free subdomain)

---

## Step 1: Initial Setup (One-time)

### 1.1 Connect GitHub to Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select **Pages** from the left sidebar
3. Click **Create a project**
4. Click **Connect to Git**
5. Authorize Cloudflare to access your GitHub account
6. Select the `songscribe-website` repository
7. Click **Begin setup**

### 1.2 Configure Build Settings

In the build configuration screen:

- **Project name**: `songscribe-website` (or your preferred subdomain)
- **Production branch**: `main`
- **Framework**: Select **Jekyll** (or "None" if not available)
- **Build command**: `bundle exec jekyll build`
- **Build output directory**: `_site`
- **Node.js version**: `18.x` (or latest LTS)

### 1.3 Add Environment Variables

Click **Environment variables** and add:

```
JEKYLL_ENV = production
```

### 1.4 Complete Setup

Click **Save and Deploy**. Cloudflare will:
1. Clone your repository
2. Install Ruby dependencies (Gemfile)
3. Build the Jekyll site
4. Deploy to their global edge network

Your site will be live at: `https://songscribe-website.pages.dev`

---

## Step 2: Custom Domain (Optional)

### 2.1 Using Your Own Domain

1. In Cloudflare Pages project settings
2. Go to **Custom domains**
3. Click **Add custom domain**
4. Enter your domain (e.g., `songscribe.app`)
5. Follow the DNS configuration prompts

### 2.2 DNS Records (if not using Cloudflare nameservers)

If you manage DNS elsewhere:

```
Type: CNAME
Name: songscribe (or your subdomain)
Value: songscribe-website.pages.dev
TTL: Auto
```

---

## Step 3: Deployment Workflow

### Automatic Deployment (Recommended)

Every time you push to the `main` branch:

```bash
git add .
git commit -m "Update website"
git push origin main
```

Cloudflare automatically:
1. Detects the push
2. Pulls your repository
3. Runs the build command
4. Deploys to production

**Deployment time**: 1-3 minutes

### Manual Deploy via CLI (Optional)

If you want to deploy without git:

```bash
# Install Wrangler CLI (if not already installed)
npm install -g @cloudflare/wrangler

# Authenticate with Cloudflare
npx wrangler login

# Deploy
npx wrangler pages deploy _site --project-name=songscribe-website
```

---

## Step 4: Local Development

### Build Locally

```bash
# Install dependencies
bundle install
npm install

# Build for production
npm run build:production

# Optimize assets (optional but recommended)
npm run optimize

# Preview locally
npm run preview
```

### Test Build Output

```bash
# Verify the build output
ls -la _site/
```

---

## Deployment Commands

Update your deployment workflow:

```bash
# For local builds before push
npm run build:production && npm run optimize

# Then commit and push
git add .
git commit -m "Production build"
git push origin main
```

Or use the NPM script:

```bash
npm run deploy
```

Then push to main branch for automatic deployment.

---

## Monitoring & Analytics

### In Cloudflare Dashboard

1. Navigate to your Pages project
2. View **Deployments** tab:
   - See build logs
   - View deployment status
   - Rollback if needed

3. View **Analytics** tab:
   - Page views
   - Request volume
   - Cache hits/misses
   - Response times

### Build Logs

Access recent build logs:
1. **Deployments** tab
2. Click the deployment
3. View **Build log** section
4. See build steps and any errors

---

## Troubleshooting

### Build Failures

**Check**:
1. Ruby version compatibility (Cloudflare uses Ruby 3.1+)
2. Gemfile dependencies
3. Jekyll configuration (_config.yml)

**View logs**:
- Cloudflare Dashboard → Deployments → [Latest] → Build log

### Build Times Exceeding Limits

Cloudflare Pages free tier has a 15-minute build limit.

**Optimize**:
1. Reduce image sizes
2. Minimize plugin dependencies
3. Avoid expensive asset processing
4. Use `exclude` in _config.yml for unnecessary files

### Images Not Loading

1. Check image paths in HTML (use relative paths)
2. Verify `baseurl` in _config.yml (should be empty for root domain)
3. Confirm images are committed to git
4. Clear browser cache

### 404 Errors on Reload

Add `_redirects` file in project root:

```
/*  /index.html   200
```

This handles single-page app routing if needed.

---

## Best Practices

### Development Workflow

```bash
# 1. Create feature branch
git checkout -b feature/my-changes

# 2. Make changes and test locally
npm run dev

# 3. Build and verify
npm run build:production

# 4. Commit and push
git add .
git commit -m "Add my feature"
git push origin feature/my-changes

# 5. Create pull request on GitHub

# 6. Once approved, merge to main
# (Cloudflare automatically deploys)
```

### Rollback a Bad Deployment

1. Go to Cloudflare Dashboard
2. Navigate to **Deployments**
3. Find the previous good deployment
4. Click the three dots (...)
5. Select **Rollback to this deployment**

### Cache Invalidation

Cloudflare automatically cache-busts:
- HTML files (cache: 30 minutes)
- Static assets (cache: 1 year)

For immediate cache clear:
1. Dashboard → Pages project → **Settings**
2. Scroll to **Build & deployments**
3. Click **Clear cache** (if available)

---

## Performance Tips

### Image Optimization

```bash
# Run optimization before deployment
npm run optimize

# This:
# - Converts images to WebP
# - Compresses JPEGs
# - Minifies CSS and JS
```

### Content Delivery

Cloudflare automatically:
- Compresses with Brotli
- Serves from nearest edge location
- Caches static assets globally
- Adds GZIP compression

### SEO

1. XML sitemap: `/sitemap.xml` (generated by Jekyll)
2. Robots.txt: `/robots.txt` (already included)
3. Meta tags: Configured in HTML
4. Open Graph: Configured in _config.yml

---

## Environment-Specific Configuration

### Production (_config.yml)

```yaml
url: "https://songscribe.app"
JEKYLL_ENV: production
```

### Preview/Staging

Create separate branches:

```bash
# Staging branch for testing
git checkout -b staging
git push origin staging
```

Configure in Cloudflare:
- Go to **Pages** → **Settings**
- Add preview deployment for `staging` branch

---

## Monitoring Deployments

### View Deployment Status

```bash
# Option 1: Cloudflare Dashboard
# Pages → songscribe-website → Deployments

# Option 2: GitHub Actions (if configured)
# Repository → Actions tab
```

### Real-time Logs

```bash
# Using Wrangler CLI
npx wrangler tail
```

---

## Additional Resources

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Jekyll Build Guide](https://jekyllrb.com/docs/step-by-step/01-setup/)
- [Deploying Jekyll with Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/deploy-a-jekyll-site/)
- [Cloudflare Dashboard](https://dash.cloudflare.com)

---

## Support

For Cloudflare issues:
- Email: support@cloudflare.com
- Status: https://www.cloudflarestatus.com/

For Jekyll issues:
- Docs: https://jekyllrb.com/
- Community: https://talk.jekyllrb.com/

