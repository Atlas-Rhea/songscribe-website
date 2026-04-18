# SongScribe 2.0 Website Rebuild — Design Spec

**Date:** 2026-04-18
**Branch:** `feat/hedra-watercolor-pipeline` (will spin off a fresh feature branch for the rebuild)
**Scope:** Full v2 rebuild of `index.html`, section-by-section, single-flip deploy to `main` when complete. No partial ship.
**Companion docs:**
- `docs/watercolor-decor-handoff.md` — prior context for the decor/wash pipeline
- `docs/website-2.0-redesign-reference.md` — locked copy, tokens, asset locations
- Pencil file `v2 website` (root) — authoritative visual spec

---

## 1. Problem statement

The current marketing site (`index.html`, ~590 lines, tokens in `main.css`) is a v1 "coming soon / early marketing" page built around a 3D layered logo hero and a watercolor gradient. It does not match the SongScribe 2.0 visual identity (warm parchment paper, hand-painted watercolor washes, two-tier "dark & darker" section rhythm) that has been designed in the Pencil file and prototyped in `public/decor-preview.html`.

The decor system (`public/assets/css/decor.css`, wash assets at `public/assets/decor/washes/`, theme toggle logic in `decor-preview.html`) is already built and shipping-ready, but **not wired into the production page**. This spec defines the rebuild that wires it in and replaces the v1 page structure with the pen-specified 12-section v2.

---

## 2. Non-goals

- Not rebuilding the legal pages (`privacy.html`, `terms.html`), the `/go` linktree page, or the tuner subpages. Those retain v1 styling until a separate spec addresses them.
- Not regenerating watercolor assets. The existing wash set is final.
- Not adding video/motion. Grok I2V motion frames are parked per the handoff.
- Not migrating to a framework (React, Next, etc.). Stays Vite + vanilla JS.
- Not changing hosting (stays Cloudflare Pages).
- Not adding new languages / i18n.
- Not restructuring `vite.config.js` multi-page entries.

---

## 3. Decisions locked during brainstorming

| Decision | Choice | Rationale |
|---|---|---|
| Scope | Full rebuild, single flip (not overlay, not hero-first slice) | User wants time; partial ship creates awkward mid-state |
| Dark mode | Ship with v2 | Decor system was built for two-tier dark; shipping light-only wastes alpha-keyed assets |
| Dark-tier dark-mode color | `#0C0604` | User pick (contrastier option) |
| Theme toggle JS | Lift verbatim from `decor-preview.html` | Already proven in preview |
| Copy source priority | Pen text nodes authoritative, then `website-2.0-redesign-reference.md` locked carousel headlines | Per handoff |
| Screenshots | Raw app captures from `songscribe-offline-muse/carousel-assets/`, framed in-browser via `iphone-17-bezel.svg` | No pre-rendered composites; swappable |
| iPad screenshots | Not used in v2 | Marketing page stays phone-only |
| Video/motion | Parked for post-launch | Per handoff |

---

## 4. Section inventory (pen-authoritative)

The page is 12 sections top-to-bottom. Tier column is the CSS `.section--light`/`.section--dark` assignment.

| # | Section | Fill token | Tier | Notes |
|---|---|---|---|---|
| 1 | Announcement strip | `$ink` | dark | Top of page, first to show safe-area inset |
| 2 | Navigation | `$parchment` | light | Theme toggle lives here |
| 3 | Hero | `$parchment` + orange TL wash + teal TR wash | light | Baskervville headline, bezel-framed screenshot 01, CTA pair |
| 4 | Feature 1 — Chord-on-lyric editor | `$parchment` | light | |
| 5 | Feature 2 — Offline / no account | `$cream` | light | First cream-tier break |
| 6 | Feature 3 — Chord tools | `$parchment` | light | May use 03 *and* 10 side-by-side per pen |
| 7 | Feature 4 — Performance mode | `$ink` | **dark** | First light→dark transition; validates dark-tier rendering |
| 8 | Feature 5 — Recording | `$parchment` | light | |
| 9 | Feature 6 — Tuner & harmony | `$cream` | light | |
| 10 | Feature 7 — Export | `$parchment` | light | |
| 11 | Pricing | `$ink` | **dark** | $19.95 CTA |
| 12 | Footer | `$parchment` | light | Safe-area bottom inset |

Light/dark tier swap under `[data-theme="dark"]`:
- `--section-bg-light` (was `$parchment`) → `$ink`
- `--section-bg-dark` (was `$ink`) → `#0C0604`

Section markup is identical across themes — only the two CSS variables flip.

---

## 5. Milestones (M1–M8)

All work on a single feature branch. Each milestone = one coherent commit batch + a Cloudflare preview URL. Nothing merges to `main` until M8.

### M1 — Foundation

Goal: everything subsequent milestones need to test in both themes.

- Token reconciliation: `main.css` `--color-*` rewritten to reference `decor.css` tokens (`--parchment`, `--ink`, `--amber`) or inlined at use-site and deleted. `decor.css` stays authoritative for color primitives.
- Add to `decor.css`: `:root[data-theme="dark"] { --section-bg-dark: #0C0604; }`
- Theme toggle JS lifted from `decor-preview.html` lines 455–476, rename `localStorage` key from `decor-theme` to `ss-theme`
- `<html data-theme="…">` attribute on root; `prefers-color-scheme` fallback on first load
- `body.decor-paper` applied globally
- `.section--light` and `.section--dark` tier classes added to every existing v1 section so the page still renders coherently in both themes even before M2–M7 rebuild them
- Add Baskervville to Google Fonts link in `index.html`
- Preload Baskervville (hero headline)

**Touches:** `index.html`, `public/assets/css/main.css`, `public/assets/css/decor.css`
**Review:** `architect-reviewer` on the token reconciliation diff
**Done when:** both themes render v1 content without layout breakage; contrast passes AA in both modes.

### M2 — Announcement strip + Nav

- Build section 1 (announcement strip, `$ink`, dark tier) per pen copy
- Build section 2 (nav, `$parchment`, light tier) with logo, scroll-anchor links, and the theme toggle button in its final location
- Delete v1 header markup from `index.html`

**Touches:** `index.html`, new CSS additions to `decor.css` (or a new `site.css` — decision below)
**Done when:** strip renders with safe-area top inset on notched iPhone; nav theme toggle flips site visibly.

### M3 — Hero

Goal: establish the reusable section pattern (see §6).

- Build section 3 hero per pen: paired orange TL + teal TR washes, Baskervville headline "Write songs the way you play", subtitle, CTA pair, bezel-framed screenshot 01
- Delete v1 hero + `LiquidLogoCSS.js` instantiation from `src/main.js` (but not the file yet — keep for reference until M8)
- Establish `.phone-frame` CSS composite (bezel SVG overlay + screenshot) — reused by M4–M7

**Touches:** `index.html`, `src/main.js`, new shot processing pipeline (see §7)
**Done when:** hero renders at 3 viewports in both themes; screenshot srcset serving correct sizes; washes don't bleed under notch in landscape.

### M4 — Feature sections 1–3

Three light-tier sections back-to-back. Batch them because they share layout.

- F1: Chord-on-lyric editor (`$parchment`) — screenshot 01 *or* a variant per pen
- F2: Offline / no account (`$cream`) — screenshot 02
- F3: Chord tools (`$parchment`) — screenshot 03 or 10 or pair

**Touches:** `index.html`, CSS additions
**Done when:** all three render at 3 viewports in both themes; tier rhythm reads clearly (parchment → cream → parchment).

### M5 — Feature 4 (dark-tier)

- F4: Performance mode (`$ink`, dark tier) — screenshot 05
- Validates light→dark→light transition in production context
- Dark-tier text color handling (`--cream-warm` or equivalent for body text on ink)

**Touches:** `index.html`, CSS additions for `.section--dark` text defaults
**Done when:** section renders in both themes with crisp tier transition; no color bleed at section edges.

### M6 — Feature sections 5–7

- F5: Recording (`$parchment`) — screenshot 04
- F6: Tuner & harmony (`$cream`) — screenshots 09 and/or 12 (pen may specify pair)
- F7: Export (`$parchment`) — screenshot 06

**Touches:** `index.html`, CSS additions
**Done when:** all three render at 3 viewports in both themes.

### M7 — Pricing + Footer

- Section 11 pricing (`$ink`, dark tier) with $19.95 CTA and copy per pen ("One price. Everything. Forever.")
- Section 12 footer (`$parchment`) — safe-area bottom inset, social links, legal page links
- Decision on "Built by a musician" closer paragraph (keep/cut) — deferred to this milestone, resolved with pen consultation

**Touches:** `index.html`, CSS additions
**Done when:** pricing section reads clearly as the conversion moment; footer links work; safe-area bottom inset respected.

### M8 — Polish + ship

Production-readiness gate. Must all pass before merging to `main`.

- Lighthouse full page: perf ≥ 90, a11y ≥ 95, SEO ≥ 95, best-practices ≥ 95
- Contrast audit: every text/bg pair passes WCAG AA; headlines aim for AAA
- Social preview refreshed — new OG image reflecting v2 aesthetic
- JSON-LD audit — structured data current with v2 copy, validated via Google Rich Results Test
- `sitemap.xml` — review, update `lastmod`
- Dead-code sweep: delete `LiquidLogoCSS.js`, `style-glass.css`, unused v1 image assets (`Layer1.svg`, `Layer2.svg`, `Layer3.svg`, v1 tagline SVGs that Baskervville replaces, unused phone cluster PNGs)
- Real-device test: iOS Safari + Chrome Android at minimum
- Real-device notched-iPhone test: portrait + landscape, no clipped copy, washes don't bleed under notch
- Email capture smoke test on prod preview
- GTM decision: the `GTM-XXXXXXX` placeholder is still a placeholder. Decide at M8: keep placeholder, install real container, or remove entirely
- Merge to `main` → production deploy

**Review:** `accessibility-tester` for a11y sweep, `performance-engineer` for Lighthouse deep-dive.

---

## 6. Section pattern (reusable template for M3–M7)

### HTML skeleton

```html
<section class="section section--light" data-section="feature-1">
  <div class="section-washes" aria-hidden="true">
    <!-- optional washes, only on sections that have them per pen -->
  </div>
  <div class="section-decor" aria-hidden="true">
    <!-- optional scattered notes/quills -->
  </div>
  <div class="section-inner">
    <div class="section-copy">
      <h2 class="section-headline">Headline (Baskervville)</h2>
      <p class="section-subtitle">Subtitle (Inter 400)</p>
      <!-- optional CTA -->
    </div>
    <figure class="section-phone">
      <!-- bezel + screenshot composite (see §7) -->
    </figure>
  </div>
</section>
```

### Layout rules

- **Max content width:** 1200px inside `.section-inner`, min 40px side padding
- **Copy/phone alternation:** odd-numbered features have text on left / phone on right; even-numbered reverse. Single-phone sections only.
- **Vertical rhythm:** each section uses `padding-block: min(10vh, 120px)` (tunable) for consistent tier-alternation cadence
- **Dark-tier sections** (`.section--dark`): text color flips to `var(--cream-warm)`, headline stays Baskervville
- **Washes:** only the hero gets paired corner washes. Feature sections are clean parchment/cream/ink. Stray decorative notes/quills reserved for hero + 1–2 hand-picked moments.
- **Transitions between tiers:** hard color-edge, no gradients (preserves tier rhythm)

### Responsive breakpoints

| Viewport | Layout |
|---|---|
| ≥ 1024px | Side-by-side copy/phone |
| 768–1024px | Same, tighter padding, smaller phone |
| < 768px | Stack vertically; copy on top, phone below; hide extra decor |
| < 480px | Suppress all decor except one accent note; phone fills width |

### iOS Safari safe-area handling

`index.html` already has `viewport-fit=cover`. CSS adds:

```css
.section-inner {
  padding-left:  max(var(--side-pad), env(safe-area-inset-left));
  padding-right: max(var(--side-pad), env(safe-area-inset-right));
}

/* First section on page (announcement strip) */
.section:first-of-type .section-inner {
  padding-top: max(var(--strip-pad), env(safe-area-inset-top));
}

/* Last section (footer) */
.section:last-of-type .section-inner {
  padding-bottom: max(var(--footer-pad), env(safe-area-inset-bottom));
}

/* Hero washes — prevent bleed under notch in landscape */
.wash--hero-orange-tl { left: env(safe-area-inset-left); }
.wash--hero-teal-tr   { right: env(safe-area-inset-right); }
```

### Accessibility

- `<section>` per unit with proper `<h2>` heading hierarchy
- Decor layers all `aria-hidden="true"` and `pointer-events: none`
- Screenshots get meaningful `alt` text
- Theme toggle is `<button>` with `aria-label` and `aria-pressed`, announces state change via `aria-live` polite region
- Contrast: Baskervville on parchment = `#2C1810` on `#F0EBE6` → passes AAA. Dark-mode inverts, still passes.
- Focus indicators on all interactive elements

---

## 7. Asset pipeline

### iPhone bezel composite (CSS, not pre-rendered)

```html
<figure class="phone-frame">
  <img class="phone-frame__bezel" src="/assets/images/decor/iphone-17-bezel.svg" alt="">
  <img class="phone-frame__screen"
       src="/assets/images/shots/01-editor-chords-on-lyrics-md.webp"
       srcset="…-sm.webp 480w, …-md.webp 720w, …-lg.webp 1080w"
       sizes="(max-width: 768px) 70vw, 420px"
       alt="Editor showing chords placed above lyrics">
</figure>
```

Bezel SVG is absolute-positioned over the screen image; both share a parent with `aspect-ratio: 1470 / 3000` (from the SVG viewBox). Screen image is inset by the bezel's inner-edge geometry (approx 3.6% top, 2% sides — tuned empirically in preview). No JS.

### Screenshot processing

Raw shots at `/Users/Atlas/Projects/songscribe-offline-muse/carousel-assets/*.png` are ~1290×2796 PNG, ~300–600KB. Processing:

- **Format:** WebP (keep PNG originals untouched)
- **Sizes:** `-sm` 480w, `-md` 720w, `-lg` 1080w — follows existing `-sm/-md/-lg` convention
- **Quality:** webp 85 (good balance for UI screenshots with flat colors)
- **Pipeline:** new one-shot script `scripts/process-screenshots.mjs` using `sharp`. Manifest maps screenshot slug → source path. Writes three webp files per slug to `public/assets/images/shots/`. Idempotent — skips existing files via hash check. Pattern mirrors `scripts/washes/`.
- **Delivery:** `srcset` + `sizes` per `<img>`. `loading="eager"` only on the hero shot; all others `loading="lazy"`.

### Screenshot → section mapping

| Section | Screenshot | Fallback / alt |
|---|---|---|
| Hero | 01 editor chords on lyrics | — |
| F1 Chord-on-lyric editor | 01 (shared with hero) OR 08 metronome for variety | Pen decides |
| F2 Offline | 02 dark-mode editor | — |
| F3 Chord tools | 03 chord picker AND/OR 10 fretboard diagram | Pen may pair |
| F4 Performance mode | 05 performance mode | — |
| F5 Recording | 04 multi-track recording | — |
| F6 Tuner & harmony | 09 tuner AND/OR 12 harmony add-to-song | Pen may pair |
| F7 Export | 06 export preview | — |
| Pricing | none (typographic) OR 07 theme grid as subtle backdrop | Pen decides |

Hero + F1 sharing shot 01 is a real risk — M3 checks pen intent; if F1 should differ (e.g. 08 swapped in), follow pen.

### Decor assets (already shipped)

- Washes: `public/assets/decor/washes/*.webp` (already optimized + alpha-keyed)
- Quills + notes: `public/assets/images/decor/*.svg` (already fine)

No new decor asset generation work in v2.

---

## 8. File changes summary

| File | Change |
|---|---|
| `index.html` | Rewrite sections 3–12 (hero through footer). Keep `<head>` mostly (update fonts, OG image, GTM decision). |
| `public/assets/css/main.css` | Token reconciliation (M1). Many v1 selectors removed as sections are rebuilt (M3–M7). |
| `public/assets/css/decor.css` | Add `:root[data-theme="dark"] { --section-bg-dark: #0C0604; }` (M1). Possibly absorb section-pattern CSS, or split into new `site.css` — decision at M2. |
| `src/main.js` | Remove `LiquidLogoCSS` instantiation (M3). Keep cookie consent + smooth scroll + nav toggle. |
| `src/LiquidLogoCSS.js` | Deleted at M8 dead-code sweep (not M3, kept for safety reference). |
| `src/style-glass.css` | Audited at M8; deleted if unused. |
| `public/assets/images/shots/*` | New directory, populated by `scripts/process-screenshots.mjs` (M3 onward). |
| `scripts/process-screenshots.mjs` | New script (M3). Sharp-based webp derivative generator. |
| Legacy v1 images (`Layer1/2/3.svg`, v1 tagline SVGs, phone cluster PNGs) | Deleted at M8. |

---

## 9. Open decisions (deferred, not blockers)

| Decision | Resolve at | Notes |
|---|---|---|
| Subtitle A/B selection per section | Per-milestone (when that section is built) | Ref doc has both options; pen may have already chosen |
| "Built by a musician" closer paragraph | M7 (footer) | Open in ref doc |
| GTM container — keep placeholder, install real, or remove | M8 | Currently `GTM-XXXXXXX` |
| CSS split: absorb section patterns into `decor.css` vs new `site.css` | M2 | Naming decision; no functional difference |

---

## 10. Out of scope for this spec

These would be separate specs:

- Legal page (`privacy.html`, `terms.html`) v2 restyling
- `/go` linktree page v2 restyling
- Tuner subpages v2 restyling
- Video/motion hero background (parked)
- A/B testing framework
- Analytics event schema for conversion funnel

---

## 11. Agent delegation strategy

| Milestone | Suggested agents |
|---|---|
| M1 Foundation | `architect-reviewer` on token reconciliation diff |
| M3 Hero | `frontend-design` skill (main agent, not subagent — establishes patterns) |
| M4–M7 Feature sections | `frontend-design` skill per section-pair; parallel-safe since sections are independent |
| M8 Polish | `accessibility-tester`, `performance-engineer` |

No `Plan` or `Explore` subagents — this spec + the upcoming implementation plan covers the research they'd do.

---

## 12. Rollback plan

Single-flip deploy means `main` is untouched until M8. If M8 reveals a showstopper, iterate on the feature branch. No partial-rollback complexity because there's no partial ship. Preview URLs on every milestone commit give per-milestone verification without production risk.
