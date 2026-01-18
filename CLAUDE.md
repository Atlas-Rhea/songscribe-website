# CLAUDE.md - SongScribe Marketing Website

Guide for Claude Code when working on the SongScribe marketing website at [songscribe.io](https://songscribe.io).

## About SongScribe (The App)

SongScribe is an **offline-first Progressive Web App for musicians** to write songs with integrated chord placement, audio recording, and advanced waveform visualization.

### Key Features to Promote

| Feature | Description |
|---------|-------------|
| **Chord-Aware Editor** | Lyrics editor with inline chord placement that stays aligned |
| **Recording Tools** | Capture ideas with smart silence trimming and waveform visualization |
| **Instrument Tuner** | Accurate tuner that works even with background noise |
| **Chord Builder** | Create chord diagrams for guitar, bass, and piano |
| **Setlist Management** | Organize songs for rehearsals and live performances |
| **Pro Mode** | Fullscreen lyrics with auto-scroll and MIDI footswitch support |
| **PDF Export** | Clean exports for print or stage use |
| **100% Offline** | Works without internet - your music stays yours |
| **Cross-Platform** | Fast on desktop, tablet, and phone |

### Brand Voice

- "Built by musicians for musicians"
- "Your Music. Your Way. Offline."
- Warm, professional, musician-focused
- Emphasize simplicity and reliability over feature count

## Project Overview

**Type**: Static marketing website (Vite + vanilla JS)
**Domain**: songscribe.io
**Hosting**: Cloudflare Pages
**Current State**: "Coming Soon" landing page with email capture

### Tech Stack

- **Build**: Vite 5
- **3D Logo**: Three.js (layered SVG animation)
- **Email**: Mailchimp integration
- **Analytics**: Google Tag Manager (placeholder)
- **Legal**: Privacy Policy, Terms of Use, Cookie Consent (GDPR)

## Quick Start

```bash
npm install       # Install dependencies
npm run dev       # Start dev server
npm run build     # Production build to dist/
npm run preview   # Preview production build
```

## Project Structure

```
.
├── index.html              # Main landing page
├── privacy.html            # Privacy policy
├── terms.html              # Terms of use
├── src/
│   ├── main.js             # Entry point, 3D logo init
│   ├── LiquidLogoCSS.js    # 3D logo component (Three.js)
│   └── style-glass.css     # Glass effect styles
├── public/
│   ├── assets/
│   │   ├── css/main.css    # Main stylesheet
│   │   └── images/         # Logo layers, favicon, OG image
│   └── sitemap.xml         # SEO sitemap
├── legal/                  # Legal document sources
├── dist/                   # Build output (generated)
├── _redirects              # Cloudflare redirects
└── functions/_headers      # Cloudflare headers
```

## Development Branches

| Branch | Purpose |
|--------|---------|
| `main` | Production - "Coming Soon" page |
| `songscribe-dev` | Full marketing site development |

Switch to dev branch for new features:
```bash
git checkout songscribe-dev
```

## Marketing Infrastructure

### SEO (Already Configured)
- Canonical URLs
- Open Graph / Facebook tags
- Twitter Card tags
- JSON-LD structured data
- Sitemap at `/sitemap.xml`

### Analytics (Needs Setup)
- GTM container placeholder: `GTM-XXXXXXX`
- Replace in `index.html` lines 163-164 with actual ID
- Cookie consent banner handles GDPR compliance

### Email Capture
- Mailchimp form embedded in landing page
- Honeypot spam protection included

## Design Guidelines

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| Accent | `#FBBF24` | CTAs, highlights, brand orange |
| Background | Dark gradient | Hero sections |
| Text | White/light | On dark backgrounds |

### Typography
- Font: Inter (Google Fonts)
- Weights: 400, 600, 700

### Components
- Glass effect cards (see `style-glass.css`)
- 3D layered logo animation
- Cookie consent banner
- Email signup form

## Deployment

### Cloudflare Pages (Automatic)
- Push to `main` → Production deploy
- Push to `songscribe-dev` → Preview URL

### Manual Build
```bash
npm run build
# Upload dist/ to hosting
```

## Common Tasks

### Update Feature List
Edit the `<ul class="feature-list">` in `index.html` or reference `feat-list.md` for copy.

### Add New Page
1. Create `pagename.html` in root
2. Add redirect rule to `_redirects` if needed
3. Update sitemap.xml

### Update Legal Pages
Source documents in `legal/` folder:
- `PRIVACY_POLICY.md`
- `TERMS_OF_USE.md`

### Test Social Sharing
- [Facebook Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [LinkedIn Inspector](https://www.linkedin.com/post-inspector/)

## Pre-Launch Checklist

- [ ] Replace `GTM-XXXXXXX` with actual GTM container ID
- [ ] Generate `og-image.png` (1200x630px)
- [ ] Submit sitemap to Google Search Console
- [ ] Test all social sharing previews
- [ ] Verify cookie consent banner works
- [ ] Test email signup flow

## Related Resources

- **App Codebase**: `../songscribe-offline-muse/`
- **App Store Assets**: `../songscribe-offline-muse/AppStore Screenshot Assets/`
- **Marketing Setup Details**: `MARKETING-SETUP.md`
- **Deployment Guide**: `DEPLOYMENT.md`
