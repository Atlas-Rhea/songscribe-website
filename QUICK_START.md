# 🚀 Cloudflare Pages Deployment - Quick Reference

## Production Build & Deploy Command

```bash
npm run deploy
git add .
git commit -m "Production build"
git push origin main
```

## OR Just Git Push (Cloudflare auto-builds)

```bash
git add .
git commit -m "Update website"
git push origin main
```

---

## One-Time Setup (10 minutes)

### 1. Go to Cloudflare Dashboard
```
https://dash.cloudflare.com
```

### 2. Create Pages Project
- Click **Pages** → **Create a project** → **Connect to Git**
- Select: `songscribe-website` repository
- Click **Begin setup**

### 3. Configure Build Settings
```
Framework:              Jekyll
Build command:          bundle exec jekyll build
Build output directory: _site
Node.js version:        18.x (or latest)
```

### 4. Add Environment Variable
```
JEKYLL_ENV = production
```

### 5. Click Deploy
Done! Your site is now at: `https://songscribe-website.pages.dev`

---

## All NPM Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Local dev server with live reload |
| `npm run build` | Build for development |
| `npm run build:production` | Build for production |
| `npm run optimize` | Compress images, CSS, JS |
| `npm run deploy` | **Production build + optimize** |
| `npm run deploy:cf` | Deploy to Cloudflare (if using CLI) |
| `npm run preview` | Preview production build |
| `npm run clean` | Remove build artifacts |

---

## Files Created/Updated

### New Files
- ✅ `CLOUDFLARE_PAGES_SETUP.md` - Full 200+ line setup guide
- ✅ `CLOUDFLARE_MIGRATION.md` - This migration checklist
- ✅ `functions/_headers` - Security headers & cache control
- ✅ `_redirects` - URL redirects (optional)
- ✅ `.gitignore` - Build artifact exclusion

### Updated Files
- ✅ `DEPLOYMENT.md` - New Cloudflare Pages instructions
- ✅ `README.md` - Updated with Cloudflare info
- ✅ `package.json` - Added `deploy:cf` command

---

## Deployment Workflow

### Your Workflow:
```
Make changes
    ↓
npm run deploy (build + optimize)
    ↓
git add . && git commit && git push
    ↓
Cloudflare auto-builds (1-3 min)
    ↓
Website live at songscribe.app
```

### What Cloudflare Does:
1. ✅ Detects your push
2. ✅ Clones repo
3. ✅ Installs Ruby gems (Gemfile)
4. ✅ Installs Node packages (package.json)
5. ✅ Runs: `bundle exec jekyll build`
6. ✅ Deploys to global CDN
7. ✅ HTTPS enabled automatically

---

## Key Differences from GitHub Pages

| What changed | Old (GitHub Pages) | New (Cloudflare Pages) |
|--------------|-------------------|----------------------|
| **URL** | github.io domain | Cloudflare domain |
| **Build time** | 5-10 minutes | 1-3 minutes |
| **CDN** | GitHub's CDN | Cloudflare's global CDN |
| **Performance** | Good | Excellent |
| **Custom domain** | Supported | Supported |
| **Rollbacks** | Manual | One-click |
| **Build logs** | Limited | Detailed |

---

## Troubleshooting

### Build Failed?
- Dashboard → Pages → songscribe-website → Deployments
- Click failed deployment → View build log
- Check: Gemfile, _config.yml, Ruby version

### Changes not showing?
- Check build succeeded (green checkmark)
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Wait 30 min for CDN propagation

### Need to rollback?
- Dashboard → Deployments → Find old deployment → Click (...) → Rollback

---

## Need More Help?

📖 **Full Setup Guide**: [CLOUDFLARE_PAGES_SETUP.md](./CLOUDFLARE_PAGES_SETUP.md)

📖 **Deployment Details**: [DEPLOYMENT.md](./DEPLOYMENT.md)

📖 **Migration Checklist**: [CLOUDFLARE_MIGRATION.md](./CLOUDFLARE_MIGRATION.md)

📚 **Cloudflare Docs**: https://developers.cloudflare.com/pages/

---

## Summary

✅ **All setup files created**
✅ **NPM commands ready**
✅ **Documentation complete**
✅ **Ready to deploy**

**Next**: Sign up for Cloudflare and follow the 10-minute setup above!

