# CLAUDE.md - SongScribe Marketing Website

Guide for Claude Code when working on the SongScribe marketing website at [songscribe.io](https://songscribe.io).

## About SongScribe (The App)

SongScribe is a **native iOS app for iPhone and iPad** for writing songs: lyrics with chords placed on words, recording and overdub layers, a tuner, metronome, harmony card, setlists and Performance mode, and PDF/ChordPro export. It works fully offline and syncs through the user's own iCloud account. There is no Mac, desktop, Android or browser version.

**Source of truth for app facts:** `../songscribe-offline-muse/docs/website-guide/facts.md`. Check every product claim against it before writing copy. Its "Must not say" list applies to the whole site (no drum machine, no "six instruments", no "25+ tunings", no subscription or discount, setlists and Performance mode are free).

**Free vs Lifetime ($19.95 once):** Export, overdub layers, lossless recording and footswitch control are Lifetime. Mark them with `<span class="lifetime-tag">Lifetime</span>` (style in `main.css`). Never label setlists, Performance mode or the speed rail as paid.

### Brand Voice

- "Built by musicians for musicians"
- Warm, professional, musician-focused
- Emphasize simplicity and reliability over feature count

## Project Overview

**Type**: Static marketing site (Vite 5 + plain HTML + vanilla JS)
**Hosting**: Cloudflare Pages (push to `main` deploys production)
**Branch**: `main` is the live v2 site. `songscribe-dev` is stale.

## Quick Start

```bash
npm install
npm run dev        # dev server on :5174
npm run build      # production build to dist/
npm run preview
```

## Project Structure

```
index.html, about.html        v2 shell (decor.css + site.css + main.css, self-hosted fonts, theme toggle)
features/index.html,          older shell (header.header, Google Fonts) - edit in place, don't re-shell
  changelog.html, privacy.html, terms.html
guide/                        GENERATED user guide - do not hand-edit (see below)
src/main.js                   theme toggle, mobile nav, accordion, lightbox init
src/lightbox.js               shared screenshot lightbox for any .phone-frame
src/guide.js                  guide clips (play in view, pause out of view) + sidenav collapse
public/assets/css/            decor.css (tokens/theme) -> site.css (v2 layout) -> main.css (v1 + shared bits); guide.css (guide only)
public/assets/images/shots/   homepage webps; shots/guide/ = guide webps (generated)
public/assets/video/guide/    guide clips + posters (copied)
scripts/                      build-guide, image pipeline, wash generator
vite.config.js                every HTML page must be in rollupOptions.input (guide pages are picked up automatically)
_redirects                    Cloudflare redirects (/help and /support -> /guide/)
```

Visual direction: `docs/website-2.0-redesign-reference.md`. Light/dark theme via `[data-theme]` on `<html>`; use decor.css tokens, no new palette.

## The Guide (/guide/)

Content lives in the app repo, not here: `../songscribe-offline-muse/docs/website-guide/` (`content/*.md`, `media/manifest.json`, `README.md` = the brief). This repo turns it into HTML and commits the output.

**When the app or the guide content changes:**

```bash
npm run build:guide:all        # shots manifest -> webps -> clips -> guide HTML
node scripts/test-build-guide.mjs
npm run build
```

Then commit `guide/`, `public/assets/images/shots/guide/`, `public/assets/video/guide/` and `scripts/screenshots.guide.manifest.json`. Override the docs path with `GUIDE_SRC=/path/to/website-guide`.

- **New guide page**: add `content/NN-slug.md` in the docs repo, then add the slug to `GROUPS` in `scripts/build-guide.mjs` (the build fails if you forget) and a `<url>` in `public/sitemap.xml`.
- **Page shell** (nav, footer, head): `scripts/templates/guide-page.html` and `guide-index.html`. If the site nav or footer changes, update these too and rebuild.
- `<!-- held back: ... -->` comments in content are stripped on purpose; never publish those features.
- Media markers `{{shot: id}}` / `{{clip: id}}` must exist in the manifest; unknown or `do_not_publish` ids fail the build.

## Marketing Infrastructure

- SEO: canonical URLs, Open Graph/Twitter tags, JSON-LD (`operatingSystem: "iOS"` only), `public/sitemap.xml`
- Analytics: GTM `GTM-M7G6MZ8K`, loaded only after cookie consent
- Mailchimp signup with honeypot

## Design Guidelines

- Fonts: Baskervville (serif headings), Inter (body), self-hosted on v2 pages
- Accent: `--amber` for borders/fills; for small text on light backgrounds use a deeper amber (bright amber is ~2:1 on parchment)
- Screenshots sit in `.phone-frame` with the bezel SVG overlay; the pipeline bakes the corner mask into the webp

## Related Resources

- **App Codebase**: `../songscribe-offline-muse/`
- **Marketing Setup**: `MARKETING-SETUP.md`
- **Deployment**: `DEPLOYMENT.md`
