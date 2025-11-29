# SongScribe - Coming Soon

A minimal Coming Soon page for SongScribe at [songscribe.io](https://songscribe.io).

## Setup

This site uses Vite and requires a build step before deployment.

## Cloudflare Pages Configuration

### Initial Setup

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Pages** → **Create a project**
3. Click **Connect to Git**
4. Select repository: `Atlas-Rhea/songscribe-website`
5. Configure build settings:
   - **Production branch**: `main`
   - **Build command**: `npm install && npm run build`
   - **Build output directory**: `dist`
   - **Framework preset**: Vite
   - **Node version**: 18 or higher

### Custom Domain

1. In your Pages project, go to **Settings** → **Custom domains**
2. Click **Add custom domain**
3. Enter: `songscribe.io`
4. Follow DNS configuration prompts

### Preview Deployments

To enable preview deployments for the `songscribe-dev` branch:

1. Go to **Settings** → **Builds & deployments**
2. Enable **Preview deployments**
3. The `songscribe-dev` branch will automatically create preview URLs

## File Structure

```
.
├── index.html              # Coming Soon page (source)
├── src/
│   ├── main.js            # Entry point with 3D logo initialization
│   ├── LiquidLogoCSS.js   # 3D logo component
│   └── style-glass.css    # 3D glass effect styles
├── public/
│   └── assets/
│       ├── css/
│       │   └── main.css   # Main stylesheet
│       └── images/
│           ├── Layer1.svg # 3D logo layer 1
│           ├── Layer2.svg # 3D logo layer 2
│           ├── Layer3.svg # 3D logo layer 3
│           └── favicon.svg
├── dist/                  # Build output (generated)
├── vite.config.js         # Vite configuration
├── package.json           # Dependencies and scripts
├── _redirects             # Cloudflare redirects
└── functions/
    └── _headers           # Cloudflare headers
```

## Development

The full marketing site is on the `songscribe-dev` branch. Switch to that branch to work on the complete site.

```bash
git checkout songscribe-dev
```

