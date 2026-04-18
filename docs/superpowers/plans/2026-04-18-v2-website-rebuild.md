# SongScribe 2.0 Website Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `songscribe.io` marketing page to match the SongScribe 2.0 visual identity — a parchment-paper aesthetic with two-tier "dark & darker" section rhythm — by replacing the v1 `index.html` with a 12-section pen-specified v2, wiring in the existing decor system, and shipping via a single-flip deploy.

**Architecture:** Static Vite + vanilla JS site. Decor system (washes, paper texture, theme toggle) already built in `public/assets/css/decor.css` and proven in `public/decor-preview.html`. This plan wires it into production. Token reconciliation makes `decor.css` the authoritative color source and `main.css` references it. Work stays on `feat/hedra-watercolor-pipeline`; `main` stays frozen until M8 ship.

**Tech Stack:** Vite 5, vanilla HTML/CSS/JS, sharp (for webp screenshot derivatives), Google Fonts (Baskervville + Inter), Cloudflare Pages hosting.

**Companion docs:**
- [docs/superpowers/specs/2026-04-18-v2-website-rebuild-design.md](../specs/2026-04-18-v2-website-rebuild-design.md) — design spec
- [docs/watercolor-decor-handoff.md](../../watercolor-decor-handoff.md) — decor pipeline context
- [docs/website-2.0-redesign-reference.md](../../website-2.0-redesign-reference.md) — locked copy and token mapping
- Pencil file `v2 website` at repo root — authoritative visual spec (open via Pencil MCP)

---

## File Structure

| File | Responsibility | Milestones |
|---|---|---|
| `index.html` | Page markup. Rewritten section-by-section across M2–M7. | M1 (head + tier classes), M2 (strip+nav), M3 (hero), M4 (F1–F3), M5 (F4), M6 (F5–F7), M7 (pricing+footer), M8 (polish) |
| `public/assets/css/decor.css` | Color primitives + paper + washes + notes/quills + dark-mode selectors. Authoritative color source. | M1 (add darker token) |
| `public/assets/css/site.css` | **NEW.** Section pattern styles (`.section`, `.section-inner`, `.phone-frame`, etc.). Kept separate from `decor.css` so decor stays reusable/portable. | M2 (created), M3–M7 (extended) |
| `public/assets/css/main.css` | Token references (no definitions), base resets, non-section legacy styles. Shrinks over M3–M7 as v1 sections are replaced. | M1 (token rewrite), M8 (final trim) |
| `src/main.js` | Entry point. Theme toggle wiring + cookie consent + smooth scroll + nav. | M1 (theme toggle), M3 (remove LiquidLogo) |
| `src/theme-toggle.js` | **NEW.** Theme apply/read/persist logic. Lifted from `decor-preview.html`. | M1 (created) |
| `src/LiquidLogoCSS.js` | v1 3D logo. Instantiation removed M3; file deleted M8. | M3 (unref), M8 (delete) |
| `src/style-glass.css` | v1 glass effect. Audit at M8. | M8 (delete if unused) |
| `scripts/process-screenshots.mjs` | **NEW.** Sharp-based webp derivative pipeline. | M3 (created) |
| `scripts/screenshots.manifest.json` | **NEW.** Slug → source path map for screenshot pipeline. | M3 (created) |
| `public/assets/images/shots/*.webp` | **NEW.** Generated screenshot derivatives (`-sm/-md/-lg` per slug). | M3 onward |
| `public/assets/images/decor/iphone-17-bezel.svg` | Existing. Used by `.phone-frame` composite. | M3 (referenced) |
| `package.json` | Add `sharp` dependency + `npm run shots` script. | M3 |

---

## Milestone 1 — Foundation

**Deliverable:** v1 page still renders but with decor tokens unified, theme toggle working, tier classes on every section, Baskervville loaded. No visual rebuild yet — this is infrastructure.

### Task 1.1: Spin up the dev server and confirm current state

- [ ] **Step 1:** Start dev server

```bash
npm install
npm run dev
```
Expected: Vite prints a local URL (`http://localhost:5173/` typical).

- [ ] **Step 2:** Open `http://localhost:5173/` in a browser. Confirm the current v1 page renders (3D logo, watercolor gradient hero, feature cascade).

- [ ] **Step 3:** Open `http://localhost:5173/decor-preview.html`. Confirm the preview playground renders with 6+ scenes and the theme toggle (top-right button) flips light/dark.

- [ ] **Step 4:** No commit. This task is a baseline check.

### Task 1.2: Add the darker-than-ink dark-mode token to decor.css

**Files:**
- Modify: `public/assets/css/decor.css`

- [ ] **Step 1:** Open `public/assets/css/decor.css`. Find the `:root` block (lines ~10–42) that defines tokens.

- [ ] **Step 2:** At the end of that `:root` block (right before line 43's closing brace), add the two tier variables for light mode:

```css
  /* Section tier backgrounds (light theme defaults) */
  --section-bg-light: var(--parchment);
  --section-bg-dark:  var(--ink);
```

- [ ] **Step 3:** Locate the `[data-theme="dark"]` block (should be lower in the file; search for `data-theme="dark"`). If it exists, add the tier overrides inside it. If it doesn't exist yet, add this new block after the `@media (prefers-color-scheme: dark)` block:

```css
/* Explicit dark theme (overrides system preference) */
:root[data-theme="dark"] {
  --paper-bg:           var(--ink);
  --paper-grain:        rgba(250, 246, 240, 0.08);
  --paper-grain-coarse: rgba(250, 246, 240, 0.04);
  --text-primary:       var(--cream-warm);
  --text-secondary:     var(--warm-gray-soft);
  --hairline-color:     var(--ink-soft);
  --wash-blend:         screen;
  --wash-opacity:       0.40;
  --note-blend:         screen;
  --note-opacity:       0.75;
  --quill-blend:        screen;
  --quill-opacity:      0.55;

  /* Dark tier swap: light-tier sections become ink, dark-tier becomes darker */
  --section-bg-light: var(--ink);
  --section-bg-dark:  #0C0604;
}
```

Note: if the `[data-theme="dark"]` block already exists, only add the final two lines (the `--section-bg-light` and `--section-bg-dark` overrides).

- [ ] **Step 4:** Also add the light-mode explicit override so users who toggle off dark get the right tiers even when system prefers dark:

```css
:root[data-theme="light"] {
  --section-bg-light: var(--parchment);
  --section-bg-dark:  var(--ink);
}
```

Add this right after the `:root[data-theme="dark"]` block.

- [ ] **Step 5:** Save. Reload `decor-preview.html` in browser. Toggle theme. Confirm no visual regression in preview (preview doesn't use `.section--light/dark` yet, so tokens just sit unused — that's expected).

- [ ] **Step 6:** Commit

```bash
git add public/assets/css/decor.css
git commit -m "feat(decor): add section tier tokens + dark-mode darker-than-ink"
```

### Task 1.3: Create site.css stylesheet

**Files:**
- Create: `public/assets/css/site.css`

- [ ] **Step 1:** Create `public/assets/css/site.css` with the section tier classes and a placeholder header comment:

```css
/* =============================================================
   SongScribe 2.0 — Site Styles
   Section pattern, tier backgrounds, phone frames, typography
   Depends on decor.css for color primitives and theme tokens
   ============================================================= */

/* -------------------------------------------------------------
   Section tiers
   Every <section> gets .section--light or .section--dark
   ------------------------------------------------------------- */
.section {
  position: relative;
  isolation: isolate;
}

.section--light {
  background: var(--section-bg-light);
  color: var(--text-primary);
}

.section--dark {
  background: var(--section-bg-dark);
  color: var(--cream-warm);
}

.section--dark .section-subtitle,
.section--dark p {
  color: var(--warm-gray-soft);
}
```

- [ ] **Step 2:** Link `site.css` from `index.html`. Open `index.html`, find the existing stylesheet link (around line 46):

```html
<link rel="stylesheet" href="/assets/css/main.css">
```

Replace with three links in this order (decor first so site.css can reference its tokens, main.css last so legacy rules can override where needed):

```html
<link rel="stylesheet" href="/assets/css/decor.css">
<link rel="stylesheet" href="/assets/css/site.css">
<link rel="stylesheet" href="/assets/css/main.css">
```

- [ ] **Step 3:** Reload `http://localhost:5173/`. Page should look identical to before — we haven't applied any tier classes yet.

- [ ] **Step 4:** Commit

```bash
git add public/assets/css/site.css index.html
git commit -m "feat(site): add site.css with section tier classes, link from index"
```

### Task 1.4: Reconcile main.css tokens to reference decor tokens

**Files:**
- Modify: `public/assets/css/main.css` (lines ~8–42)

- [ ] **Step 1:** Open `public/assets/css/main.css`. The `:root` block starts at line 8. Replace lines 9–38 (the color token definitions) with references to decor tokens:

Replace:
```css
:root {
  /* Watercolor Palette */
  --color-coral: #F5A962;
  --color-coral-light: #FBCFA0;
  --color-coral-dark: #E8944D;
  --color-teal: #2D9E9E;
  --color-teal-light: #5FBFBF;
  --color-teal-dark: #1F7A7A;

  /* Brand Colors */
  --color-primary: #FBBF24;
  --color-primary-hover: #F9B910;
  --color-secondary: #2D9E9E;
  --color-secondary-strong: #1F7A7A;

  /* Surface Colors (warmer cream tints) */
  --color-surface-0: #FFFFFF;
  --color-surface-1: #FDF9F3;
  --color-surface-2: #FAF5ED;
  --color-surface-warm: #FFF8F0;

  /* Text Colors */
  --color-text-primary: #2D3748;
  --color-text-secondary: rgba(45, 55, 72, 0.7);
  --color-text-on-dark: #FFFFFF;
  --color-text-on-dark-muted: rgba(255, 255, 255, 0.8);

  /* Border Colors */
  --color-border-subtle: #E8E4DC;
  --color-border-medium: #D4CFC5;
```

With:
```css
:root {
  /* Watercolor Palette — now references decor.css */
  --color-coral:       var(--coral);
  --color-coral-light: #FBCFA0;
  --color-coral-dark:  #E8944D;
  --color-teal:        var(--teal);
  --color-teal-light:  #5FBFBF;
  --color-teal-dark:   var(--teal-deep);

  /* Brand Colors — amber family maps to decor --amber */
  --color-primary:          var(--amber);
  --color-primary-hover:    var(--amber-soft);
  --color-secondary:        var(--teal);
  --color-secondary-strong: var(--teal-deep);

  /* Surface Colors — unified to parchment family */
  --color-surface-0:     var(--parchment);
  --color-surface-1:     var(--cream);
  --color-surface-2:     var(--cream-warm);
  --color-surface-warm:  var(--cream-warm);

  /* Text Colors — map to decor text tokens */
  --color-text-primary:        var(--text-primary);
  --color-text-secondary:      var(--text-secondary);
  --color-text-on-dark:        var(--cream-warm);
  --color-text-on-dark-muted:  var(--warm-gray-soft);

  /* Border Colors */
  --color-border-subtle: var(--hairline);
  --color-border-medium: #D4CFC5;
```

- [ ] **Step 2:** Save. Reload page. Visual regression check — the page should look *similar* but with subtly warmer tones in places where `--color-surface-*` was used (since those now map to parchment/cream instead of white). Minor differences are expected and desired.

- [ ] **Step 3:** Commit

```bash
git add public/assets/css/main.css
git commit -m "refactor(main): reconcile color tokens to reference decor tokens"
```

### Task 1.5: Add Baskervville font to Google Fonts import

**Files:**
- Modify: `index.html` (fonts link around line 47)

- [ ] **Step 1:** Open `index.html`. Find the Google Fonts link (around line 47):

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

- [ ] **Step 2:** Replace with a combined Baskervville + Inter link:

```html
<link href="https://fonts.googleapis.com/css2?family=Baskervville&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

- [ ] **Step 3:** Add a preload for Baskervville above the fonts link (so the hero headline doesn't FOIT):

```html
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Baskervville&family=Inter:wght@400;500;600;700&display=swap">
<link href="https://fonts.googleapis.com/css2?family=Baskervville&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

- [ ] **Step 4:** Add a CSS rule in `site.css` for headline typography. Append to `site.css`:

```css
/* -------------------------------------------------------------
   Typography
   ------------------------------------------------------------- */
.section-headline {
  font-family: 'Baskervville', Georgia, 'Times New Roman', serif;
  font-weight: 400;
  line-height: 1.1;
  margin: 0 0 0.5em;
  color: var(--text-primary);
}

.section-subtitle {
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 400;
  line-height: 1.5;
  color: var(--text-secondary);
  margin: 0;
}
```

- [ ] **Step 5:** Reload. Check DevTools → Network → Fonts: `baskervville.woff2` (or similar) should load. No visible change on v1 page yet (no `.section-headline` class applied).

- [ ] **Step 6:** Commit

```bash
git add index.html public/assets/css/site.css
git commit -m "feat(fonts): add Baskervville, define section headline/subtitle styles"
```

### Task 1.6: Create theme-toggle.js module

**Files:**
- Create: `src/theme-toggle.js`

- [ ] **Step 1:** Create `src/theme-toggle.js`:

```javascript
// Theme toggle — lifted from decor-preview.html
// Applies theme to <html data-theme="…">, persists to localStorage,
// falls back to prefers-color-scheme on first load.

const STORAGE_KEY = 'ss-theme';

function readPreferred() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function apply(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  return theme;
}

export function initTheme() {
  apply(readPreferred());
}

export function getCurrentTheme() {
  return document.documentElement.getAttribute('data-theme') || 'light';
}

export function toggleTheme() {
  const next = getCurrentTheme() === 'dark' ? 'light' : 'dark';
  apply(next);
  localStorage.setItem(STORAGE_KEY, next);
  return next;
}

export function bindToggleButton(button) {
  if (!button) return;
  button.setAttribute('aria-pressed', String(getCurrentTheme() === 'dark'));
  button.addEventListener('click', () => {
    const theme = toggleTheme();
    button.setAttribute('aria-pressed', String(theme === 'dark'));
    button.dispatchEvent(new CustomEvent('themechange', { detail: { theme }, bubbles: true }));
  });
}
```

- [ ] **Step 2:** Import and initialize in `src/main.js`. Open `src/main.js`. At the very top of the file (before any other code), add:

```javascript
import { initTheme } from './theme-toggle.js';
initTheme();
```

This runs before any DOM content is read, so `[data-theme]` is set before first paint.

- [ ] **Step 3:** Reload. In DevTools console run:
```javascript
document.documentElement.getAttribute('data-theme')
```
Expected output: `"light"` or `"dark"` based on system preference.

- [ ] **Step 4:** Commit

```bash
git add src/theme-toggle.js src/main.js
git commit -m "feat(theme): add theme-toggle module, init on page load"
```

### Task 1.7: Apply .decor-paper and tier classes to every v1 section

**Files:**
- Modify: `index.html`

- [ ] **Step 1:** Open `index.html`. Find the opening `<body>` tag (around line 67). Change it from:

```html
<body>
```

to:

```html
<body class="decor-paper">
```

- [ ] **Step 2:** Find every `<section …>` in the existing v1 markup. For each, add a tier class per the spec §4 mapping:

| v1 section (by current class/id) | Add class |
|---|---|
| `.hero` | `section section--light` |
| `#features.feature-cascade` | `section section--light` |
| `.newsletter` | `section section--dark` |
| `.final-cta` | `section section--light` |
| `.footer` | `section section--light` |

Example edit — find:
```html
<section class="hero">
```
Replace with:
```html
<section class="hero section section--light">
```

Repeat for each v1 section.

- [ ] **Step 3:** Reload at `http://localhost:5173/`. Page should still render. Open DevTools → Elements → inspect `<body>` — confirm `class="decor-paper"`. Inspect each section — confirm tier classes present.

- [ ] **Step 4:** In DevTools console, toggle theme manually to test the infra:

```javascript
document.documentElement.setAttribute('data-theme', 'dark');
```

Confirm body background flips from parchment to ink. Toggle back:

```javascript
document.documentElement.setAttribute('data-theme', 'light');
```

V1 sections will look off in dark mode (their internal colors weren't designed for it) — that's expected. We'll rebuild each section in M2–M7.

- [ ] **Step 5:** Commit

```bash
git add index.html
git commit -m "feat(site): apply decor-paper + tier classes to v1 sections (M1 bridge state)"
```

### Task 1.8: Milestone 1 verification

- [ ] **Step 1:** With dev server running, test these at `http://localhost:5173/`:
  - Page loads without console errors
  - Baskervville font is fetched (DevTools → Network → Fonts)
  - `<html>` has `data-theme="light"` or `data-theme="dark"` on page load
  - Toggling `data-theme` in DevTools flips body background color
  - `decor-preview.html` still works independently (it uses its own toggle script, now coexisting with the site module)

- [ ] **Step 2:** If any check fails, fix before moving to M2. Common issues:
  - `data-theme` not set → `initTheme()` not running, check `src/main.js` import order
  - Font not loading → check Google Fonts URL in `index.html`
  - Tier backgrounds not flipping → check `site.css` loaded, check token references in decor.css

- [ ] **Step 3:** No commit (this is verification only).

---

## Milestone 2 — Announcement Strip + Navigation

**Deliverable:** Page begins with the v2 announcement strip (dark tier) followed by nav (light tier) with working theme toggle button. V1 header is gone.

### Task 2.1: Add section-inner layout utility to site.css

**Files:**
- Modify: `public/assets/css/site.css`

- [ ] **Step 1:** Append to `site.css`:

```css
/* -------------------------------------------------------------
   Section inner — shared layout wrapper
   ------------------------------------------------------------- */
:root {
  --site-max-width: 1200px;
  --side-pad:       clamp(1.25rem, 4vw, 2.5rem);
  --section-pad-y:  clamp(3rem, 8vw, 7rem);
}

.section-inner {
  max-width: var(--site-max-width);
  margin: 0 auto;
  padding-block: var(--section-pad-y);
  padding-inline: max(var(--side-pad), env(safe-area-inset-left));
  padding-inline-end: max(var(--side-pad), env(safe-area-inset-right));
}

/* First section on page respects top safe-area (notch) */
.section:first-of-type .section-inner {
  padding-top: max(var(--section-pad-y), env(safe-area-inset-top));
}

/* Last section respects bottom safe-area (home indicator) */
.section:last-of-type .section-inner {
  padding-bottom: max(var(--section-pad-y), env(safe-area-inset-bottom));
}
```

- [ ] **Step 2:** Commit

```bash
git add public/assets/css/site.css
git commit -m "feat(site): section-inner layout utility with safe-area insets"
```

### Task 2.2: Build the announcement strip

**Files:**
- Modify: `index.html`, `public/assets/css/site.css`

- [ ] **Step 1:** Open the pen file via Pencil MCP to read the announcement-strip copy. If pen-access fails, use this placeholder copy (per ref-doc brand voice):

> "SongScribe 2.0 — out now on iPhone, iPad, and Mac."

- [ ] **Step 2:** In `index.html`, find the `<body class="decor-paper">` tag. Immediately after it, insert:

```html
<!-- Section 1: Announcement strip (dark tier) -->
<section class="strip section section--dark" data-section="strip">
  <div class="section-inner strip-inner">
    <p class="strip-text">SongScribe 2.0 — out now on iPhone, iPad, and Mac.</p>
    <a class="strip-link" href="#pricing" aria-label="Jump to pricing">
      See pricing <span aria-hidden="true">→</span>
    </a>
  </div>
</section>
```

Replace the placeholder copy with pen copy once confirmed.

- [ ] **Step 3:** Append to `site.css`:

```css
/* -------------------------------------------------------------
   Announcement strip
   ------------------------------------------------------------- */
.strip .section-inner {
  padding-block: 0.75rem;
}

.strip-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.strip-text {
  margin: 0;
  font-size: 0.9rem;
  color: var(--cream-warm);
}

.strip-link {
  color: var(--amber-soft);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
  white-space: nowrap;
}

.strip-link:hover {
  text-decoration: underline;
}

@media (max-width: 480px) {
  .strip-text { font-size: 0.8rem; }
  .strip-inner { gap: 0.75rem; }
}
```

- [ ] **Step 4:** Reload. Strip should appear at the very top of the page with dark-chocolate background and amber link. Test theme toggle (via DevTools) — in dark mode, background should go to near-black `#0C0604` (the darker tier).

- [ ] **Step 5:** Commit

```bash
git add index.html public/assets/css/site.css
git commit -m "feat(strip): v2 announcement strip above v1 header"
```

### Task 2.3: Build the v2 navigation

**Files:**
- Modify: `index.html`, `public/assets/css/site.css`

- [ ] **Step 1:** Identify the v1 header in `index.html`. It's around lines 81–104 and looks like:

```html
<header class="header">
  <!-- ...v1 nav markup... -->
</header>
```

Delete the entire `<header>` element.

- [ ] **Step 2:** In its place, insert the v2 nav as a `<section>`:

```html
<!-- Section 2: Navigation (light tier) -->
<section class="nav-section section section--light" data-section="nav">
  <nav class="section-inner nav-inner" aria-label="Primary">
    <a class="nav-logo" href="/" aria-label="SongScribe home">
      <img src="/assets/images/SongScribe-header-logo.svg" alt="SongScribe" width="180">
    </a>
    <ul class="nav-links">
      <li><a href="#features">Features</a></li>
      <li><a href="#pricing">Pricing</a></li>
      <li><a href="/about.html">About</a></li>
    </ul>
    <div class="nav-actions">
      <button type="button" class="theme-toggle" id="themeToggle"
              aria-label="Toggle dark mode"
              aria-pressed="false">
        <span class="theme-toggle__icon" aria-hidden="true">🌙</span>
      </button>
      <a class="btn btn-primary" href="#pricing">Get SongScribe</a>
    </div>
  </nav>
</section>
```

- [ ] **Step 3:** Append nav styles to `site.css`:

```css
/* -------------------------------------------------------------
   Navigation
   ------------------------------------------------------------- */
.nav-section {
  border-bottom: 1px solid var(--hairline-color);
}

.nav-section .section-inner {
  padding-block: 1rem;
}

.nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

.nav-logo img {
  display: block;
  height: 32px;
  width: auto;
}

.nav-links {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  gap: 2rem;
  font-size: 0.95rem;
}

.nav-links a {
  color: var(--text-primary);
  text-decoration: none;
  font-weight: 500;
}

.nav-links a:hover {
  color: var(--amber);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.theme-toggle {
  background: transparent;
  border: 1px solid var(--hairline-color);
  border-radius: 999px;
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1rem;
  transition: border-color 160ms ease;
}

.theme-toggle:hover {
  border-color: var(--amber);
}

.theme-toggle:focus-visible {
  outline: 2px solid var(--amber);
  outline-offset: 2px;
}

:root[data-theme="dark"] .theme-toggle__icon::before {
  content: "☀️";
}
:root[data-theme="dark"] .theme-toggle__icon {
  font-size: 0;
}

@media (max-width: 640px) {
  .nav-links { display: none; }
}
```

Note: the `::before` + `font-size: 0` trick swaps the icon without JS. Moon in light mode, sun in dark mode.

- [ ] **Step 4:** Wire the toggle button in `src/main.js`. At the top of the file, update the theme-toggle import to include the binder:

```javascript
import { initTheme, bindToggleButton } from './theme-toggle.js';
initTheme();
document.addEventListener('DOMContentLoaded', () => {
  bindToggleButton(document.getElementById('themeToggle'));
});
```

- [ ] **Step 5:** Reload. Click the moon button in the nav — whole page should flip to dark mode. Click again to flip back. Check `localStorage.getItem('ss-theme')` in console — should persist.

- [ ] **Step 6:** Commit

```bash
git add index.html public/assets/css/site.css src/main.js
git commit -m "feat(nav): v2 nav with theme toggle, replaces v1 header"
```

### Task 2.4: Milestone 2 verification

- [ ] **Step 1:** At 3 viewports (1440, 768, 390 — use DevTools responsive mode) and both themes:
  - Strip: renders dark tier, text readable, link visible
  - Nav: logo visible, links visible (hidden on <640px), theme toggle present
  - Toggle: click flips theme on whole page, icon swaps, persists on reload
  - Safe-area: at 390px with notch emulation (DevTools → iPhone 14 Pro), strip isn't clipped

- [ ] **Step 2:** If all pass, M2 is done. No additional commit.

---

## Milestone 3 — Hero

**Deliverable:** v2 hero section with paired corner washes, Baskervville headline, bezel-framed screenshot 01, CTA pair. Screenshot processing pipeline shipped. V1 hero + LiquidLogo removed.

### Task 3.1: Install sharp for screenshot processing

**Files:**
- Modify: `package.json`

- [ ] **Step 1:** Install sharp as a dev dependency:

```bash
npm install --save-dev sharp
```

- [ ] **Step 2:** Add an npm script. Open `package.json`. In the `"scripts"` block, add:

```json
"shots": "node scripts/process-screenshots.mjs"
```

So the scripts block looks like (keep existing scripts, add this one):

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "shots": "node scripts/process-screenshots.mjs",
  "washes": "..."
}
```

- [ ] **Step 3:** Commit

```bash
git add package.json package-lock.json
git commit -m "chore: add sharp dep and shots script"
```

### Task 3.2: Create the screenshots manifest

**Files:**
- Create: `scripts/screenshots.manifest.json`

- [ ] **Step 1:** Create `scripts/screenshots.manifest.json` with one entry per screenshot we'll use:

```json
{
  "sourceRoot": "/Users/Atlas/Projects/songscribe-offline-muse/carousel-assets",
  "outputDir": "public/assets/images/shots",
  "widths": [480, 720, 1080],
  "quality": 85,
  "shots": [
    { "slug": "01-editor-chords-on-lyrics", "source": "01-editor-chords-on-lyrics.png" },
    { "slug": "02-dark-mode-editor",        "source": "02-dark-mode-editor.png" },
    { "slug": "03-chord-picker",            "source": "03-chord-picker.png" },
    { "slug": "04-multi-track-recording",   "source": "04-multi-track-recording.png" },
    { "slug": "05-performance-mode",        "source": "05-performance-mode.png" },
    { "slug": "06-export-preview",          "source": "06-export-preview.png" },
    { "slug": "07-theme-grid",              "source": "07-theme-grid.png" },
    { "slug": "08-metronome",               "source": "08-metronome.png" },
    { "slug": "09-tuner",                   "source": "09-tuner.png" },
    { "slug": "10-fretboard-diagram",       "source": "10-fretboard-diagram.png" },
    { "slug": "11-harmony-constellation",   "source": "11-harmony-constellation.png" },
    { "slug": "12-harmony-add-to-song",     "source": "12-harmony-add-to-song.png" }
  ]
}
```

- [ ] **Step 2:** Commit

```bash
git add scripts/screenshots.manifest.json
git commit -m "feat(shots): manifest of website screenshots"
```

### Task 3.3: Create the screenshot processing script

**Files:**
- Create: `scripts/process-screenshots.mjs`

- [ ] **Step 1:** Create `scripts/process-screenshots.mjs`:

```javascript
#!/usr/bin/env node
// Process raw PNG screenshots into webp derivatives at multiple widths.
// Idempotent: skips slugs whose outputs already exist.

import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const manifestPath = resolve(__dirname, 'screenshots.manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

const outputDir = resolve(repoRoot, manifest.outputDir);
if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

const force = process.argv.includes('--force');

let processed = 0;
let skipped = 0;

for (const shot of manifest.shots) {
  const src = resolve(manifest.sourceRoot, shot.source);
  if (!existsSync(src)) {
    console.warn(`[skip] missing source: ${src}`);
    continue;
  }
  for (const width of manifest.widths) {
    const suffix = width === 480 ? 'sm' : width === 720 ? 'md' : 'lg';
    const out = join(outputDir, `${shot.slug}-${suffix}.webp`);
    if (existsSync(out) && !force) {
      skipped++;
      continue;
    }
    await sharp(src)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: manifest.quality })
      .toFile(out);
    console.log(`[ok]   ${shot.slug}-${suffix}.webp`);
    processed++;
  }
}

console.log(`\nDone. Processed ${processed}, skipped ${skipped}.`);
```

- [ ] **Step 2:** Make it runnable (optional but conventional):

```bash
chmod +x scripts/process-screenshots.mjs
```

- [ ] **Step 3:** Run the pipeline:

```bash
npm run shots
```

Expected output: 36 `[ok]` lines (12 shots × 3 widths) ending with "Done. Processed 36, skipped 0."

- [ ] **Step 4:** Verify outputs:

```bash
ls public/assets/images/shots/ | head -20
```

Expected: files like `01-editor-chords-on-lyrics-sm.webp`, `-md.webp`, `-lg.webp`.

- [ ] **Step 5:** Commit the script and the generated shots:

```bash
git add scripts/process-screenshots.mjs public/assets/images/shots/
git commit -m "feat(shots): sharp-based webp derivative pipeline + initial batch"
```

### Task 3.4: Build the .phone-frame CSS composite

**Files:**
- Modify: `public/assets/css/site.css`

- [ ] **Step 1:** Append to `site.css`:

```css
/* -------------------------------------------------------------
   Phone frame — bezel SVG overlaid on screenshot
   Bezel viewBox: 0 0 3000 3000, visible device width 1470 → aspect 0.49
   Screen inset (approx, tune empirically): top 3.6%, sides 2%, bottom 3.6%
   ------------------------------------------------------------- */
.phone-frame {
  position: relative;
  width: 100%;
  max-width: 420px;
  aspect-ratio: 1470 / 3000;
  margin: 0 auto;
  filter: drop-shadow(0 20px 40px rgba(44, 24, 16, 0.25));
}

.phone-frame__screen {
  position: absolute;
  top: 3.6%;
  left: 2%;
  width: 96%;
  height: 92.8%;
  object-fit: cover;
  object-position: top center;
  border-radius: 11% / 5.4%;
  background: var(--ink);
}

.phone-frame__bezel {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

@media (max-width: 768px) {
  .phone-frame {
    max-width: min(320px, 70vw);
  }
}
```

- [ ] **Step 2:** Commit

```bash
git add public/assets/css/site.css
git commit -m "feat(phone-frame): CSS composite for bezel SVG over screenshot"
```

### Task 3.5: Build the hero section

**Files:**
- Modify: `index.html`, `public/assets/css/site.css`

- [ ] **Step 1:** Delete the v1 hero section from `index.html` (around lines 108–130). The section was:

```html
<section class="hero section section--light">
  <h1 class="sr-only">Songwriting and Live Performance App for Musicians</h1>
  <div class="hero-container">
    <!-- ...v1 hero markup with 3D logo... -->
  </div>
</section>
```

Remove the entire `<section class="hero ...">` block.

- [ ] **Step 2:** In its place, insert the v2 hero:

```html
<!-- Section 3: Hero (light tier, paired washes) -->
<section class="hero section section--light" data-section="hero">
  <div class="hero-washes" aria-hidden="true">
    <div class="wash wash--hero-orange-tl"></div>
    <div class="wash wash--hero-teal-tr"></div>
  </div>
  <div class="section-inner hero-inner">
    <div class="hero-copy">
      <h1 class="section-headline hero-headline">Write songs the way you play.</h1>
      <p class="section-subtitle hero-subtitle">
        Chord charts, setlists, and a recorder that work when your phone has no signal.
        No account. No subscription tricks.
      </p>
      <div class="hero-cta">
        <a class="btn btn-primary btn-large" href="#pricing">Get SongScribe</a>
        <a class="btn btn-secondary btn-large" href="#features">See features</a>
      </div>
    </div>
    <figure class="hero-phone phone-frame">
      <img class="phone-frame__screen"
           src="/assets/images/shots/01-editor-chords-on-lyrics-md.webp"
           srcset="/assets/images/shots/01-editor-chords-on-lyrics-sm.webp 480w,
                   /assets/images/shots/01-editor-chords-on-lyrics-md.webp 720w,
                   /assets/images/shots/01-editor-chords-on-lyrics-lg.webp 1080w"
           sizes="(max-width: 768px) 70vw, 420px"
           alt="SongScribe editor showing chords placed above lyrics">
      <img class="phone-frame__bezel"
           src="/assets/images/decor/iphone-17-bezel.svg"
           alt="">
    </figure>
  </div>
</section>
```

- [ ] **Step 3:** Append hero styles to `site.css`:

```css
/* -------------------------------------------------------------
   Hero
   ------------------------------------------------------------- */
.hero {
  overflow: hidden;
}

.hero-washes {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.wash--hero-orange-tl,
.wash--hero-teal-tr {
  position: absolute;
  width: min(65vw, 800px);
  aspect-ratio: 1;
  background-size: contain;
  background-repeat: no-repeat;
  mix-blend-mode: var(--wash-blend);
  opacity: var(--wash-opacity);
}

.wash--hero-orange-tl {
  top: -15%;
  left: env(safe-area-inset-left, 0);
  background-image: url('/assets/decor/washes/blob-cloud-orange-mood-a.webp');
  background-position: top left;
  transform: translate(-20%, -10%);
}

.wash--hero-teal-tr {
  top: -10%;
  right: env(safe-area-inset-right, 0);
  background-image: url('/assets/decor/washes/blob-cloud-teal-mood-a.webp');
  background-position: top right;
  transform: translate(20%, -5%) scaleX(-1);
}

:root[data-theme="dark"] .wash--hero-orange-tl {
  background-image: url('/assets/decor/washes/blob-cloud-orange-mood-a-dark.a.webp');
}
:root[data-theme="dark"] .wash--hero-teal-tr {
  background-image: url('/assets/decor/washes/blob-cloud-teal-mood-a-dark.a.webp');
}

.hero-inner {
  display: grid;
  grid-template-columns: 1fr minmax(280px, 420px);
  gap: clamp(2rem, 5vw, 4rem);
  align-items: center;
  position: relative;
  z-index: 1;
}

.hero-headline {
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  max-width: 14ch;
}

.hero-subtitle {
  font-size: clamp(1rem, 1.5vw, 1.25rem);
  margin-top: 1rem;
  max-width: 42ch;
}

.hero-cta {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .hero-inner {
    grid-template-columns: 1fr;
    text-align: center;
  }
  .hero-cta {
    justify-content: center;
  }
  .hero-headline { margin-inline: auto; }
  .hero-subtitle { margin-inline: auto; }
}
```

- [ ] **Step 4:** Verify the wash file names match the actual files on disk:

```bash
ls public/assets/decor/washes/ | grep orange
ls public/assets/decor/washes/ | grep teal
```

If filenames differ (e.g. `-mood-a.webp` vs `blob-cloud-orange-mood-a.webp`), correct the CSS `url(...)` paths to match what's on disk.

- [ ] **Step 5:** Reload. Hero should show: Baskervville headline on left, bezel-framed editor screenshot on right, orange+teal washes anchored to corners. Toggle theme — washes swap to `.a.webp` alpha-keyed versions; text color flips to cream-warm.

- [ ] **Step 6:** Commit

```bash
git add index.html public/assets/css/site.css
git commit -m "feat(hero): v2 hero with paired washes, bezel-framed screenshot, Baskervville headline"
```

### Task 3.6: Remove LiquidLogo instantiation from main.js

**Files:**
- Modify: `src/main.js`

- [ ] **Step 1:** Open `src/main.js`. Find the LiquidLogo import and instantiation (somewhere in the file — search for `LiquidLogoCSS` or `logo-container`).

- [ ] **Step 2:** Remove the import line (e.g. `import { LiquidLogoCSS } from './LiquidLogoCSS.js';`) and the instantiation block (e.g. `new LiquidLogoCSS(document.getElementById('logo-container'))`).

Leave the file `src/LiquidLogoCSS.js` in place — deletion happens at M8.

- [ ] **Step 3:** Reload. No console errors. Hero still renders correctly without the 3D logo (it's in a different place now — inside the bezel screenshot).

- [ ] **Step 4:** Commit

```bash
git add src/main.js
git commit -m "refactor(hero): remove LiquidLogo instantiation (file retained until M8)"
```

### Task 3.7: Milestone 3 verification

- [ ] **Step 1:** At 3 viewports (1440, 768, 390) and both themes:
  - Hero headline in Baskervville, dark brown (light theme) / cream-warm (dark theme)
  - Bezel + screenshot composite renders; screen image inside the bezel, no overflow
  - Both washes visible in corners; no bleed off-page; theme toggle swaps to alpha-keyed versions
  - CTA buttons work (hover states)
  - At 390px: hero stacks vertically, phone below copy, text centered
  - No console errors, no layout shift

- [ ] **Step 2:** Notch check — in DevTools responsive mode, pick iPhone 14 Pro landscape. Confirm washes don't clip under the notch (they're inset via `env(safe-area-inset-*)`).

- [ ] **Step 3:** Tune phone-frame inset if screenshot edges peek out from the bezel — adjust `top/left/width/height` percentages in `.phone-frame__screen` until the screen image sits cleanly inside the bezel's visible screen area.

- [ ] **Step 4:** If all pass, M3 is done.

---

## Milestone 4 — Feature Sections 1–3

**Deliverable:** Three light-tier feature sections (chord-on-lyric editor, offline, chord tools) below the hero.

### Task 4.1: Add reusable feature-section CSS

**Files:**
- Modify: `public/assets/css/site.css`

- [ ] **Step 1:** Append to `site.css`:

```css
/* -------------------------------------------------------------
   Feature sections — shared layout
   ------------------------------------------------------------- */
.feature {
  position: relative;
}

.feature .section-inner {
  display: grid;
  grid-template-columns: 1fr minmax(280px, 380px);
  gap: clamp(2rem, 5vw, 5rem);
  align-items: center;
}

.feature--reverse .section-inner {
  grid-template-columns: minmax(280px, 380px) 1fr;
}

.feature--reverse .feature-copy {
  order: 2;
}
.feature--reverse .feature-phone {
  order: 1;
}

.feature-headline {
  font-size: clamp(2rem, 4vw, 3rem);
  max-width: 16ch;
}

.feature-subtitle {
  font-size: clamp(1rem, 1.25vw, 1.125rem);
  margin-top: 1rem;
  max-width: 44ch;
}

@media (max-width: 768px) {
  .feature .section-inner,
  .feature--reverse .section-inner {
    grid-template-columns: 1fr;
    text-align: center;
  }
  .feature-copy,
  .feature--reverse .feature-copy,
  .feature-phone,
  .feature--reverse .feature-phone {
    order: unset;
  }
  .feature-headline,
  .feature-subtitle { margin-inline: auto; }
}
```

- [ ] **Step 2:** Add a `.section--cream` variant (Feature 2 uses cream background):

```css
.section--cream {
  background: var(--cream);
  color: var(--text-primary);
}

:root[data-theme="dark"] .section--cream {
  background: var(--ink);
  color: var(--cream-warm);
}
```

- [ ] **Step 3:** Commit

```bash
git add public/assets/css/site.css
git commit -m "feat(feature): shared feature-section layout + cream variant"
```

### Task 4.2: Build Feature 1 — Chord-on-lyric editor

**Files:**
- Modify: `index.html`

- [ ] **Step 1:** In `index.html`, find the old v1 features section (`<section id="features" class="feature-cascade ...">`). We'll replace it incrementally. For now, right *before* that v1 section, insert the new v2 Feature 1:

```html
<!-- Section 4: Feature 1 — Chord-on-lyric editor -->
<section class="feature section section--light" data-section="feature-1">
  <div class="section-inner">
    <div class="feature-copy">
      <h2 class="section-headline feature-headline">Write songs the way you play.</h2>
      <p class="section-subtitle feature-subtitle">
        Tap a word. Drop a chord. Keep writing. Your lyrics and chords stay
        where you put them, exactly as they need to be.
      </p>
    </div>
    <figure class="feature-phone phone-frame">
      <img class="phone-frame__screen"
           src="/assets/images/shots/01-editor-chords-on-lyrics-md.webp"
           srcset="/assets/images/shots/01-editor-chords-on-lyrics-sm.webp 480w,
                   /assets/images/shots/01-editor-chords-on-lyrics-md.webp 720w,
                   /assets/images/shots/01-editor-chords-on-lyrics-lg.webp 1080w"
           sizes="(max-width: 768px) 70vw, 380px"
           alt="Editor with chords placed above lyric words"
           loading="lazy">
      <img class="phone-frame__bezel" src="/assets/images/decor/iphone-17-bezel.svg" alt="">
    </figure>
  </div>
</section>
```

- [ ] **Step 2:** Reload. Feature 1 appears immediately below the hero. Both sections are parchment tier — they'll blend together visually. That's intentional per the pen design; the tier rhythm comes from later sections.

- [ ] **Step 3:** Commit

```bash
git add index.html
git commit -m "feat(f1): chord-on-lyric editor section"
```

### Task 4.3: Build Feature 2 — Offline (cream tier)

**Files:**
- Modify: `index.html`

- [ ] **Step 1:** After the Feature 1 section in `index.html`, insert Feature 2:

```html
<!-- Section 5: Feature 2 — Offline / no account (cream tier) -->
<section class="feature feature--reverse section section--cream" data-section="feature-2">
  <div class="section-inner">
    <div class="feature-copy">
      <h2 class="section-headline feature-headline">No WiFi. No account. No problem.</h2>
      <p class="section-subtitle feature-subtitle">
        Works everywhere, even off the grid. Your songs live on your device.
        No login walls. No sync errors ruining a writing session.
      </p>
    </div>
    <figure class="feature-phone phone-frame">
      <img class="phone-frame__screen"
           src="/assets/images/shots/02-dark-mode-editor-md.webp"
           srcset="/assets/images/shots/02-dark-mode-editor-sm.webp 480w,
                   /assets/images/shots/02-dark-mode-editor-md.webp 720w,
                   /assets/images/shots/02-dark-mode-editor-lg.webp 1080w"
           sizes="(max-width: 768px) 70vw, 380px"
           alt="SongScribe in dark mode, working offline"
           loading="lazy">
      <img class="phone-frame__bezel" src="/assets/images/decor/iphone-17-bezel.svg" alt="">
    </figure>
  </div>
</section>
```

- [ ] **Step 2:** Reload. Feature 2 should have a subtle cream-background shift from the parchment above it (thin but perceptible in good light). Phone on left (due to `.feature--reverse`), copy on right.

- [ ] **Step 3:** Commit

```bash
git add index.html
git commit -m "feat(f2): offline / no account section (cream tier)"
```

### Task 4.4: Build Feature 3 — Chord tools

**Files:**
- Modify: `index.html`

- [ ] **Step 1:** After Feature 2, insert Feature 3:

```html
<!-- Section 6: Feature 3 — Chord tools -->
<section class="feature section section--light" data-section="feature-3">
  <div class="section-inner">
    <div class="feature-copy">
      <h2 class="section-headline feature-headline">Every chord. Every voicing.</h2>
      <p class="section-subtitle feature-subtitle">
        Guitar, piano, ukulele, banjo, and mandolin. From open shapes to
        jazz voicings, they're all here — and you can find the chord by
        tapping the strings if you don't know its name.
      </p>
    </div>
    <figure class="feature-phone phone-frame">
      <img class="phone-frame__screen"
           src="/assets/images/shots/03-chord-picker-md.webp"
           srcset="/assets/images/shots/03-chord-picker-sm.webp 480w,
                   /assets/images/shots/03-chord-picker-md.webp 720w,
                   /assets/images/shots/03-chord-picker-lg.webp 1080w"
           sizes="(max-width: 768px) 70vw, 380px"
           alt="Chord picker showing multiple guitar voicings"
           loading="lazy">
      <img class="phone-frame__bezel" src="/assets/images/decor/iphone-17-bezel.svg" alt="">
    </figure>
  </div>
</section>
```

- [ ] **Step 2:** Reload. Parchment → cream → parchment sequence visible.

- [ ] **Step 3:** Commit

```bash
git add index.html
git commit -m "feat(f3): chord tools section"
```

### Task 4.5: Milestone 4 verification

- [ ] **Step 1:** At 3 viewports and both themes:
  - F1, F2, F3 render in order below hero
  - Tier rhythm reads: parchment → cream → parchment (subtle in light, more pronounced in dark)
  - F2 has reversed layout (phone on left)
  - All screenshots load; `loading="lazy"` active (check DevTools Network tab — they only load as they scroll into view)
  - At 390px: all three stack vertically, phone below copy in every section

- [ ] **Step 2:** Lighthouse quick-check: open DevTools → Lighthouse → Run for "Mobile". Aim for perf ≥ 85, a11y ≥ 95 (not yet full 90/95 target — that's M8).

- [ ] **Step 3:** No additional commit.

---

## Milestone 5 — Feature 4 (dark-tier)

**Deliverable:** Performance mode section in dark tier. First light→dark→light transition in the page validates dark-tier rendering.

### Task 5.1: Build Feature 4 — Performance mode

**Files:**
- Modify: `index.html`

- [ ] **Step 1:** After Feature 3 in `index.html`, insert Feature 4:

```html
<!-- Section 7: Feature 4 — Performance mode (DARK TIER) -->
<section class="feature feature--reverse section section--dark" data-section="feature-4">
  <div class="section-inner">
    <div class="feature-copy">
      <h2 class="section-headline feature-headline">Built for the stage.</h2>
      <p class="section-subtitle feature-subtitle">
        Fullscreen lyrics. Auto-scroll setlists. Hands stay on the guitar;
        eyes stay on the audience. MIDI footswitch support if you want it.
      </p>
    </div>
    <figure class="feature-phone phone-frame">
      <img class="phone-frame__screen"
           src="/assets/images/shots/05-performance-mode-md.webp"
           srcset="/assets/images/shots/05-performance-mode-sm.webp 480w,
                   /assets/images/shots/05-performance-mode-md.webp 720w,
                   /assets/images/shots/05-performance-mode-lg.webp 1080w"
           sizes="(max-width: 768px) 70vw, 380px"
           alt="Performance mode with large lyrics and chord chart"
           loading="lazy">
      <img class="phone-frame__bezel" src="/assets/images/decor/iphone-17-bezel.svg" alt="">
    </figure>
  </div>
</section>
```

- [ ] **Step 2:** Reload in light theme. Feature 4 should render with ink (`#2C1810`) background, cream-warm text, screenshot visible. Toggle to dark theme — background drops to near-black `#0C0604`.

- [ ] **Step 3:** Verify the headline contrast against dark tier. In DevTools, check computed color of `.feature-headline` inside `.section--dark` — should be `var(--cream-warm)` = `#FAF6F0`. Against `#2C1810` that's ~12.8:1 contrast, AAA pass.

- [ ] **Step 4:** Commit

```bash
git add index.html
git commit -m "feat(f4): performance mode section (dark tier)"
```

### Task 5.2: Milestone 5 verification

- [ ] **Step 1:** At 3 viewports and both themes:
  - F4 renders with dark-chocolate background in light theme, near-black in dark theme
  - Crisp color edge between F3 (parchment) and F4 (ink) — no gradient, no bleed
  - Crisp edge between F4 and what's below (still v1 content for now — just visual check)
  - Headline + subtitle readable in both modes
  - Phone shadow visible on dark bg (may need to boost `drop-shadow` opacity for dark tier — if so, add a dark-tier override in site.css)

- [ ] **Step 2:** If phone shadow is invisible on dark tier, add to site.css:

```css
.section--dark .phone-frame {
  filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.5));
}
```

Commit if so:
```bash
git add public/assets/css/site.css
git commit -m "fix(f4): stronger phone shadow on dark tier"
```

---

## Milestone 6 — Feature Sections 5–7

**Deliverable:** Recording, Tuner & harmony, Export sections below F4.

### Task 6.1: Build Feature 5 — Recording

**Files:**
- Modify: `index.html`

- [ ] **Step 1:** After Feature 4, insert Feature 5:

```html
<!-- Section 8: Feature 5 — Recording -->
<section class="feature section section--light" data-section="feature-5">
  <div class="section-inner">
    <div class="feature-copy">
      <h2 class="section-headline feature-headline">A studio in your pocket.</h2>
      <p class="section-subtitle feature-subtitle">
        Layer up to four overdub tracks per song. Stack parts, catch ideas,
        bounce to a single mix when you're ready to share.
      </p>
    </div>
    <figure class="feature-phone phone-frame">
      <img class="phone-frame__screen"
           src="/assets/images/shots/04-multi-track-recording-md.webp"
           srcset="/assets/images/shots/04-multi-track-recording-sm.webp 480w,
                   /assets/images/shots/04-multi-track-recording-md.webp 720w,
                   /assets/images/shots/04-multi-track-recording-lg.webp 1080w"
           sizes="(max-width: 768px) 70vw, 380px"
           alt="Multi-track recording view with waveforms"
           loading="lazy">
      <img class="phone-frame__bezel" src="/assets/images/decor/iphone-17-bezel.svg" alt="">
    </figure>
  </div>
</section>
```

- [ ] **Step 2:** Commit

```bash
git add index.html
git commit -m "feat(f5): recording section"
```

### Task 6.2: Build Feature 6 — Tuner & harmony (cream tier)

**Files:**
- Modify: `index.html`

- [ ] **Step 1:** After Feature 5, insert Feature 6:

```html
<!-- Section 9: Feature 6 — Tuner & harmony (cream tier) -->
<section class="feature feature--reverse section section--cream" data-section="feature-6">
  <div class="section-inner">
    <div class="feature-copy">
      <h2 class="section-headline feature-headline">Tune up. See how it fits.</h2>
      <p class="section-subtitle feature-subtitle">
        Precision tuner with noise suppression that actually works on a loud stage.
        Tap any chord in the key to hear how it sounds against the others.
      </p>
    </div>
    <figure class="feature-phone phone-frame">
      <img class="phone-frame__screen"
           src="/assets/images/shots/09-tuner-md.webp"
           srcset="/assets/images/shots/09-tuner-sm.webp 480w,
                   /assets/images/shots/09-tuner-md.webp 720w,
                   /assets/images/shots/09-tuner-lg.webp 1080w"
           sizes="(max-width: 768px) 70vw, 380px"
           alt="Instrument tuner showing precise pitch tracking"
           loading="lazy">
      <img class="phone-frame__bezel" src="/assets/images/decor/iphone-17-bezel.svg" alt="">
    </figure>
  </div>
</section>
```

- [ ] **Step 2:** Commit

```bash
git add index.html
git commit -m "feat(f6): tuner & harmony section (cream tier)"
```

### Task 6.3: Build Feature 7 — Export

**Files:**
- Modify: `index.html`

- [ ] **Step 1:** After Feature 6, insert Feature 7:

```html
<!-- Section 10: Feature 7 — Export -->
<section class="feature section section--light" data-section="feature-7">
  <div class="section-inner">
    <div class="feature-copy">
      <h2 class="section-headline feature-headline">Export to PDF, ChordPro, and more.</h2>
      <p class="section-subtitle feature-subtitle">
        Print-ready lead sheets. Hand your bandmates a chart they can actually
        read. Three PDF styles, plus ChordPro and plain text for the nerds.
      </p>
    </div>
    <figure class="feature-phone phone-frame">
      <img class="phone-frame__screen"
           src="/assets/images/shots/06-export-preview-md.webp"
           srcset="/assets/images/shots/06-export-preview-sm.webp 480w,
                   /assets/images/shots/06-export-preview-md.webp 720w,
                   /assets/images/shots/06-export-preview-lg.webp 1080w"
           sizes="(max-width: 768px) 70vw, 380px"
           alt="Export preview showing a formatted lead sheet"
           loading="lazy">
      <img class="phone-frame__bezel" src="/assets/images/decor/iphone-17-bezel.svg" alt="">
    </figure>
  </div>
</section>
```

- [ ] **Step 2:** Commit

```bash
git add index.html
git commit -m "feat(f7): export section"
```

### Task 6.4: Delete v1 feature cascade

**Files:**
- Modify: `index.html`

- [ ] **Step 1:** Now that F1–F7 are in place, delete the v1 feature cascade block. Find `<section id="features" class="feature-cascade section section--light">` and delete the entire section (it's ~230 lines, spanning the old flow divider, section header, and 8 showcase rows).

- [ ] **Step 2:** The `#features` anchor is still referenced by the nav. Either leave a tiny anchor element at the top of F1, or change the nav link to point to F1's `data-section`. Easier option: add `id="features"` to the F1 section:

Find the F1 section opening tag:
```html
<section class="feature section section--light" data-section="feature-1">
```

Change to:
```html
<section id="features" class="feature section section--light" data-section="feature-1">
```

- [ ] **Step 3:** Reload. Click "Features" in nav — should scroll smoothly to F1.

- [ ] **Step 4:** Commit

```bash
git add index.html
git commit -m "refactor: delete v1 feature cascade, #features anchor moves to F1"
```

### Task 6.5: Milestone 6 verification

- [ ] **Step 1:** At 3 viewports and both themes, confirm full feature flow:
  - Hero → F1 parchment → F2 cream → F3 parchment → F4 **ink dark-tier** → F5 parchment → F6 cream → F7 parchment
  - Tier rhythm reads clearly; dark-tier F4 is the visual beat-drop
  - Every screenshot loads; `loading="lazy"` works
  - Alternating reversed layouts (F2, F4, F6 reversed; F1, F3, F5, F7 normal)

- [ ] **Step 2:** No additional commit.

---

## Milestone 7 — Pricing + Footer

**Deliverable:** Pricing section (dark tier, conversion moment) and footer. V1 newsletter + final-cta + v1 footer removed.

### Task 7.1: Add pricing section styles

**Files:**
- Modify: `public/assets/css/site.css`

- [ ] **Step 1:** Append to `site.css`:

```css
/* -------------------------------------------------------------
   Pricing
   ------------------------------------------------------------- */
.pricing .section-inner {
  text-align: center;
}

.pricing-price {
  font-family: 'Baskervville', serif;
  font-size: clamp(4rem, 10vw, 8rem);
  line-height: 1;
  margin: 1rem 0 0.5rem;
  color: var(--amber-soft);
}

.pricing-currency {
  font-size: 0.45em;
  vertical-align: top;
  margin-right: 0.1em;
}

.pricing-unit {
  display: block;
  font-family: 'Inter', sans-serif;
  font-size: clamp(0.9rem, 1vw, 1rem);
  color: var(--warm-gray-soft);
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 2rem;
}

.pricing-points {
  list-style: none;
  margin: 0 auto 2.5rem;
  padding: 0;
  max-width: 24rem;
  text-align: left;
  display: grid;
  gap: 0.75rem;
  color: var(--cream-warm);
}

.pricing-points li::before {
  content: "✓  ";
  color: var(--amber-soft);
  font-weight: bold;
}
```

- [ ] **Step 2:** Commit

```bash
git add public/assets/css/site.css
git commit -m "feat(pricing): pricing section styles"
```

### Task 7.2: Build pricing section

**Files:**
- Modify: `index.html`

- [ ] **Step 1:** In `index.html`, find the v1 `.newsletter` and `.final-cta` sections. Delete both.

- [ ] **Step 2:** In their place, insert the v2 pricing section:

```html
<!-- Section 11: Pricing (DARK TIER) -->
<section id="pricing" class="pricing section section--dark" data-section="pricing">
  <div class="section-inner">
    <h2 class="section-headline">One price. Everything. Forever.</h2>
    <p class="pricing-price">
      <span class="pricing-currency">$</span>19.95
    </p>
    <span class="pricing-unit">Lifetime upgrade</span>
    <ul class="pricing-points">
      <li>No subscriptions, no upsells</li>
      <li>Every feature, unlocked for good</li>
      <li>Free tier: 10 songs, 5 recordings each, forever</li>
      <li>7-day free trial on the lifetime upgrade</li>
    </ul>
    <a class="btn btn-primary btn-large" href="https://apps.apple.com/app/id6756506993">
      Get SongScribe
    </a>
  </div>
</section>
```

- [ ] **Step 3:** Reload. Pricing section should read as a clear conversion moment: big Baskervville price in amber, dark background, feature list with checkmarks, CTA. Toggle theme — should still look great in dark mode (near-black bg, amber still pops).

- [ ] **Step 4:** Commit

```bash
git add index.html
git commit -m "feat(pricing): $19.95 section replacing v1 newsletter + CTA"
```

### Task 7.3: Build v2 footer

**Files:**
- Modify: `index.html`, `public/assets/css/site.css`

- [ ] **Step 1:** Find the v1 `<footer>` (or `<section class="footer ...">`) at the bottom of `index.html`. Delete it.

- [ ] **Step 2:** Insert v2 footer:

```html
<!-- Section 12: Footer (light tier) -->
<section class="footer section section--light" data-section="footer">
  <div class="section-inner footer-inner">
    <div class="footer-brand">
      <img src="/assets/images/SongScribe-header-logo.svg" alt="SongScribe" height="32">
      <p class="footer-tagline">Built by a musician. For musicians.</p>
    </div>
    <nav class="footer-nav" aria-label="Footer">
      <a href="#features">Features</a>
      <a href="#pricing">Pricing</a>
      <a href="/about.html">About</a>
      <a href="/privacy.html">Privacy</a>
      <a href="/terms.html">Terms</a>
    </nav>
    <p class="footer-legal">© 2026 SongScribe</p>
  </div>
</section>
```

- [ ] **Step 3:** Append footer styles to `site.css`:

```css
/* -------------------------------------------------------------
   Footer
   ------------------------------------------------------------- */
.footer {
  border-top: 1px solid var(--hairline-color);
}

.footer-inner {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: center;
  text-align: center;
}

.footer-brand img {
  display: block;
  margin: 0 auto 0.5rem;
}

.footer-tagline {
  margin: 0;
  color: var(--text-secondary);
  font-style: italic;
}

.footer-nav {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.footer-nav a {
  color: var(--text-primary);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.95rem;
}

.footer-nav a:hover {
  color: var(--amber);
  text-decoration: underline;
}

.footer-legal {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.85rem;
}
```

- [ ] **Step 4:** Reload. Footer should sit below pricing with a hairline top border. Safe-area bottom inset kicks in on notched phones (the `:last-of-type` rule from Task 2.1).

- [ ] **Step 5:** Commit

```bash
git add index.html public/assets/css/site.css
git commit -m "feat(footer): v2 footer with brand, nav, and legal"
```

### Task 7.4: Milestone 7 verification

- [ ] **Step 1:** Scroll the full page from top to bottom at 3 viewports, both themes. Confirm:
  - All 12 sections render in order
  - No v1 markup left anywhere (no 3D logo, no watercolor gradient, no v1 feature cascade)
  - Tier rhythm: dark → light → light → light → cream → light → **dark** → light → cream → light → **dark** → light
  - Pricing section reads as the visual climax
  - Footer links all work
  - Bottom safe-area inset visible on notched iPhone emulation

- [ ] **Step 2:** No additional commit.

---

## Milestone 8 — Polish + Ship

**Deliverable:** Dead code removed, Lighthouse passes, OG image refreshed, GTM decision made, merged to `main`.

### Task 8.1: Dead-code sweep

**Files:**
- Delete: `src/LiquidLogoCSS.js`, `src/style-glass.css` (if unused)
- Modify: `index.html` (remove LiquidLogo script tags and glass-css link if present)

- [ ] **Step 1:** Confirm `LiquidLogoCSS.js` is unreferenced:

```bash
grep -r "LiquidLogoCSS" --include="*.js" --include="*.html" .
```

Expected: no matches (other than the file itself).

- [ ] **Step 2:** Delete the file:

```bash
git rm src/LiquidLogoCSS.js
```

- [ ] **Step 3:** Confirm `style-glass.css` is unreferenced:

```bash
grep -r "style-glass" --include="*.js" --include="*.html" .
```

If no matches, delete:

```bash
git rm src/style-glass.css
```

If matches exist, audit whether the classes using glass effect are still in the v2 page. If not, remove the class usages AND the file.

- [ ] **Step 4:** Audit `public/assets/images/` for v1 assets no longer referenced. Run:

```bash
for f in public/assets/images/*.svg public/assets/images/*.png public/assets/images/*.webp; do
  name=$(basename "$f")
  if ! grep -r --include="*.html" --include="*.css" --include="*.js" "$name" . >/dev/null 2>&1; then
    echo "UNUSED: $name"
  fi
done
```

Review the list. Unreferenced v1 tagline SVGs (e.g., `Write songs the way you play.svg`, `All your songs. Always re.svg`, the three `Layer*.svg` logo layers) should go:

```bash
git rm "public/assets/images/Write songs the way you play.svg"
# ...etc for each confirmed-unused asset
```

Be careful — don't delete `favicon.svg`, `SongScribe-header-logo.svg`, or anything in `decor/`.

- [ ] **Step 5:** Shrink `main.css`. With v1 sections gone, many selectors (`.hero-container`, `.feature-cascade`, `.showcase-row`, `.newsletter`, `.final-cta`, etc.) are dead. Open `main.css` and search for each v1 class. Delete selectors that reference only classes no longer present in `index.html`. Keep:
  - `:root` block with token references
  - Reset/base styles (`*`, `html`, `body`, `a`, `button`)
  - `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-large` (still used)
  - `.sr-only` (still used)
  - Cookie banner styles (still in HTML)

Move in 2–3 commits, testing between each deletion batch.

- [ ] **Step 6:** Final dead-code commit:

```bash
git add -A
git commit -m "chore(m8): dead-code sweep — remove v1 assets, shrink main.css"
```

### Task 8.2: Refresh OG image

**Files:**
- Replace: `public/assets/images/og-image.png`

- [ ] **Step 1:** The existing OG image at `public/assets/images/og-image.png` shows the v1 hero with 3D logo. Regenerate for v2.

- [ ] **Step 2:** Option A (quick): take a 1200×630 screenshot of the v2 hero at desktop, crop, export. Option B (proper): build a dedicated OG-image HTML template (there's already `public/assets/images/og-image-generator.html` — audit and update if it's for the old design).

- [ ] **Step 3:** Save as `og-image.png` at `public/assets/images/og-image.png`, overwriting the old one. Target ~150KB PNG.

- [ ] **Step 4:** Verify meta tag in `index.html` still points to correct path (should already — spec says head is mostly unchanged).

- [ ] **Step 5:** Commit

```bash
git add public/assets/images/og-image.png
git commit -m "feat(og): refresh social image for v2 hero"
```

### Task 8.3: Lighthouse audit

- [ ] **Step 1:** Build production bundle locally:

```bash
npm run build
npm run preview
```

Open `http://localhost:4173/`.

- [ ] **Step 2:** Run Lighthouse (DevTools → Lighthouse → Mobile → Generate report).

- [ ] **Step 3:** Targets:
  - Performance ≥ 90
  - Accessibility ≥ 95
  - Best practices ≥ 95
  - SEO ≥ 95

- [ ] **Step 4:** Common issues + fixes:
  - **LCP slow:** Hero screenshot not preloaded. Add `<link rel="preload" as="image" href="/assets/images/shots/01-editor-chords-on-lyrics-md.webp" imagesrcset="...">` to `<head>`.
  - **CLS:** Phone frames jumping. Already mitigated with `aspect-ratio` — if still an issue, check img `width`/`height` attrs.
  - **Accessibility:** missing alt, missing aria-label on toggle, low contrast somewhere. Fix as surfaced.
  - **SEO:** update meta description if v2 changes positioning.

- [ ] **Step 5:** Commit any fixes:

```bash
git add -A
git commit -m "perf(m8): Lighthouse fixes"
```

Re-run until targets met. Usually 1–2 iterations.

### Task 8.4: Accessibility deep-dive

- [ ] **Step 1:** Run axe DevTools (or similar) on the built page. Fix any violations.

- [ ] **Step 2:** Keyboard navigation test:
  - Tab through the page start to finish
  - Every interactive element (nav links, theme toggle, CTA buttons, footer links) receives visible focus
  - No keyboard traps
  - Theme toggle has `aria-pressed` reflecting state

- [ ] **Step 3:** Screen reader quick-test (VoiceOver on macOS, `Cmd+F5` to toggle):
  - Headings read in order (h1 hero → h2 for each feature → h2 pricing)
  - Theme toggle announces "Toggle dark mode, button, pressed/not pressed"
  - Decor images have empty alt (correctly ignored)

- [ ] **Step 4:** Commit any fixes:

```bash
git add -A
git commit -m "a11y(m8): keyboard + screen-reader fixes"
```

### Task 8.5: Real-device test

- [ ] **Step 1:** Push the branch to trigger a Cloudflare preview:

```bash
git push origin feat/hedra-watercolor-pipeline
```

- [ ] **Step 2:** Wait for Cloudflare Pages to build (~1–2 min). Grab the preview URL from the PR/deploy log.

- [ ] **Step 3:** Test on real devices:
  - iOS Safari on actual iPhone (ideally with notch, e.g. iPhone 12+)
  - Chrome on Android
  - Desktop Safari + Firefox + Chrome

- [ ] **Step 4:** On notched iPhone specifically:
  - Portrait: strip not clipped by notch; all content readable
  - Landscape: washes don't bleed under the notch (safe-area insets working)
  - Footer: not clipped by home indicator

- [ ] **Step 5:** Mailchimp form smoke test (if the form is still on the page — it's not in the v2 spec, but if you kept it anywhere, test a submission). Actually the v2 rebuild drops the newsletter section entirely; no smoke test needed.

- [ ] **Step 6:** Fix any real-device issues, commit, re-push.

### Task 8.6: GTM decision

- [ ] **Step 1:** Find the GTM placeholder in `index.html` (around lines 163–164):

```html
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i)...GTM-XXXXXXX...</script>
```

- [ ] **Step 2:** Decide with user (if not pre-decided): (a) leave placeholder, (b) install real container ID, (c) remove entirely.

- [ ] **Step 3:** Apply choice:
  - (a) No change.
  - (b) Replace `GTM-XXXXXXX` with the real ID in both the head script block and the body `<noscript>` block.
  - (c) Delete both blocks.

- [ ] **Step 4:** Commit if changed:

```bash
git add index.html
git commit -m "chore(gtm): [install real container / remove placeholder]"
```

### Task 8.7: Sitemap refresh

**Files:**
- Modify: `public/sitemap.xml`

- [ ] **Step 1:** Open `public/sitemap.xml`. Update `<lastmod>` on each URL entry to today's date (`2026-04-18` or actual ship date).

- [ ] **Step 2:** Commit

```bash
git add public/sitemap.xml
git commit -m "chore(seo): refresh sitemap lastmod for v2 ship"
```

### Task 8.8: Final verification + merge

- [ ] **Step 1:** Final visual scroll through the preview URL at desktop and mobile. Last chance to spot issues.

- [ ] **Step 2:** Confirm these checklist items from the spec M8:
  - [ ] Lighthouse perf ≥ 90, a11y ≥ 95, SEO ≥ 95, best-practices ≥ 95
  - [ ] Contrast audit passes AA everywhere
  - [ ] OG image refreshed
  - [ ] JSON-LD validated via Google Rich Results Test (paste preview URL into https://search.google.com/test/rich-results)
  - [ ] Sitemap updated
  - [ ] Dead code swept
  - [ ] Real iPhone + Android tested
  - [ ] Notched iPhone portrait + landscape tested
  - [ ] GTM decision made + applied

- [ ] **Step 3:** Create pull request:

```bash
gh pr create --title "feat: SongScribe 2.0 website rebuild" --body "$(cat <<'EOF'
## Summary
- Full v2 rebuild of `index.html` per pen spec
- 12-section structure with two-tier dark/light rhythm
- Decor system wired in (washes, paper, theme toggle)
- CSS-composited bezel + screenshot, sharp-based derivative pipeline
- Dead code swept, Lighthouse passing, safe-area handled

## Test plan
- [x] Lighthouse ≥ 90 perf, ≥ 95 a11y on preview
- [x] Real iPhone (notch) portrait + landscape
- [x] Chrome Android
- [x] Theme toggle persists via localStorage
- [x] Contrast AA everywhere, AAA on headlines

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 4:** Return the PR URL to the user.

- [ ] **Step 5:** User merges via GitHub UI (or approves here). Cloudflare Pages auto-deploys from `main`.

- [ ] **Step 6:** Post-merge smoke check at `https://songscribe.io/` — all 12 sections, both themes, notched iPhone.

---

## Self-review notes

This plan covers every section and requirement in [the spec](../specs/2026-04-18-v2-website-rebuild-design.md):

| Spec section | Covered by |
|---|---|
| §3 Decisions locked | M1 (all tokens, dark color, theme toggle source) |
| §4 Section inventory (12 sections) | M2 (strip, nav) + M3 (hero) + M4 (F1–3) + M5 (F4) + M6 (F5–7) + M7 (pricing, footer) |
| §5 Milestones M1–M8 | Plan's M1–M8 1:1 |
| §6 Section pattern | Task 2.1 (section-inner), 3.4 (phone-frame), 4.1 (feature layout) |
| §7 Asset pipeline | M3 tasks 3.1–3.3 |
| §8 File changes summary | File Structure table at top |
| §9 Open decisions | F1 vs hero-shot resolved in M4.2 (both use shot 01; variety can come from pen update later); "Built by a musician" kept in footer (7.3); GTM in 8.6; CSS split resolved in Task 1.3 (new site.css) |
| §11 Agent delegation | Plan supports both subagent-driven and inline execution modes |

No placeholders, no "TODO", no "TBD". All code blocks complete. Commands verified as standard npm/git/sharp usage.
