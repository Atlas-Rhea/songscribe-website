# Design Spec: SongScribe Bio Link Page (`/go`)

**Date**: 2026-03-14
**Status**: Approved

## Purpose

A mobile-first "Linktree-style" page at `songscribe.io/go` for use as the website link in social media bios (Instagram, etc.). Its sole purpose is to funnel social traffic toward downloading the SongScribe app, with the Tuner as a secondary option and the full website as a tertiary link.

## Content & Layout

Single centered column, no navigation, no footer links. Top to bottom:

1. **Logo + Brand** — SongScribe layered SVG logo (~72px), bold "SongScribe" heading, tagline: *"Built by musicians, for musicians"*
2. **Primary CTA** — Large golden gradient button with subtle glow shadow
   - Label: **"Get SongScribe Free"**
   - Subtitle: "Songwriting · Chords · Recording · Setlists"
   - Links to: `https://apps.apple.com/app/id6756506993`
3. **Divider** — Thin horizontal line with italic text: *"Looking for something simpler?"*
4. **Secondary CTA** — Teal-tinted button with teal border
   - Label: **"Try SongScribe Tuner"**
   - Subtitle: "Free state-of-the-art instrument tuner"
   - Links to: `https://apps.apple.com/app/songscribe-tuner/id6758641886`
5. **Website Link** — Plain text: "songscribe.io →"
   - Links to: `https://songscribe.io`
6. **Footer** — Minimal: "© 2026 SongScribe"

## Visual Design

- **Aesthetic**: Matches the existing warm cream/watercolor site design
- **Background**: Light cream gradient (`#FDF9F3` → `#FAF5ED`)
- **Primary button**: Golden gradient (`#FBBF24` → `#F5A962`), rounded corners (14px), box-shadow glow (`rgba(251, 191, 36, 0.3)`)
- **Secondary button**: Teal tint background (`rgba(45, 158, 158, 0.08)`), teal border (`rgba(45, 158, 158, 0.2)`)
- **Website link**: Subtle gray text (`#2D3748` at reduced opacity)
- **Typography**: Inter font (400, 600, 700 weights), loaded from Google Fonts
- **Text color**: `#2D3748` (dark gray) with opacity variants for hierarchy

## Responsive Behavior

- **Mobile (default)**: Full-width buttons with 20px side padding, content max-width 400px, centered
- **Desktop**: Same single-column layout, centered in viewport
- No breakpoints needed — the narrow column works at all sizes

## Technical Implementation

### File Structure

- `/go/index.html` — Single self-contained HTML file in the project root
- Vite builds it alongside the rest of the site — add `go: resolve(__dirname, 'go/index.html')` to the `rollupOptions.input` in `vite.config.js`

### Styling

- Inline `<style>` block within the HTML file — no external CSS files
- Reuses the same color values as the main site's design tokens
- Loads Inter from Google Fonts

### JavaScript

- No framework dependencies
- GTM container (`GTM-M7G6MZ8K`) loaded with cookie consent
- Click tracking via `dataLayer.push` on each link:
  - `{ event: 'link_click', link_name: 'songscribe_app', link_url: '...' }`
  - `{ event: 'link_click', link_name: 'songscribe_tuner', link_url: '...' }`
  - `{ event: 'link_click', link_name: 'website', link_url: '...' }`

### Cookie Consent

Since `/go` is a landing page from social media, most visitors will not have previously consented on the main site. A minimal consent notice is needed so GTM can load and track clicks.

- Small fixed bar at the bottom of the page: "We use cookies to understand how you found us. [Accept] [Decline]"
- On accept: set `localStorage.setItem('cookie-consent', 'accepted')` (same key as main site) and load GTM
- On decline: set `localStorage.setItem('cookie-consent', 'declined')` and dismiss the bar — GTM does not load
- If consent was previously given (key already in `localStorage`), skip the bar and load GTM immediately
- Styled to match the page aesthetic — cream background, small text, unobtrusive

### Link Behavior

- All external links (App Store, website) open in a new tab: `target="_blank" rel="noopener"`
- This preserves the `/go` page if the user wants to come back and click another link

### SEO

- Minimal: `<title>`, `<meta description>`, Open Graph tags
- Add `<meta name="robots" content="noindex">` to keep it out of search results — this is a social funnel, not an SEO page
- No JSON-LD or heavy SEO

### Deployment

- Standard Cloudflare Pages pipeline: push to `main` triggers build and deploy
- `/go/` resolves to `/go/index.html` automatically — no `_redirects` entry needed

## Out of Scope

- Android/Play Store links (not yet available)
- Navigation header or footer
- Full cookie consent banner from the main site — instead, use a minimal inline consent notice (see Cookie Consent section)
- Analytics beyond GTM event tracking

## Future Considerations

- Add Play Store links when Android apps launch
- A/B test CTA copy if conversion data warrants it
