# SongScribe - Coming Soon

A minimal Coming Soon page for SongScribe at [songscribe.io](https://songscribe.io).

## Setup

This is a static HTML page with no build process required. Simply deploy to Cloudflare Pages.

## Cloudflare Pages Configuration

### Initial Setup

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Pages** → **Create a project**
3. Click **Connect to Git**
4. Select repository: `Atlas-Rhea/songscribe-website`
5. Configure build settings:
   - **Production branch**: `main`
   - **Build command**: (leave empty - static HTML, no build needed)
   - **Build output directory**: `/` (root)
   - **Framework preset**: None

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
├── index.html              # Coming Soon page
├── assets/
│   ├── css/
│   │   └── main.css       # Minimal styles
│   └── images/
│       ├── logo-full.svg  # SongScribe logo
│       └── favicon.svg    # Favicon
├── manifest.json          # PWA manifest
├── robots.txt             # SEO robots file
├── _redirects             # Cloudflare redirects
└── functions/
    └── _headers           # Cloudflare headers
```

## Development

The full marketing site is on the `songscribe-dev` branch. Switch to that branch to work on the complete site.

```bash
git checkout songscribe-dev
```

