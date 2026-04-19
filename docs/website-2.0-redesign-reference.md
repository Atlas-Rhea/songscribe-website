# Website 2.0 Redesign — Reference Doc

**Date:** 2026-04-17
**Purpose:** Single source of truth for updating songscribe.io to match the SongScribe 2.0 visual identity and copy.

---

## 1. Visual Direction

The website should match the App Store carousel aesthetic: warm, clean, musician-friendly.

### Background
- Solid warm cream: `#F0EBE6` (sampled from the app's default SongScribe theme)
- No gradients in the main content area. The current coral-to-teal animated gradient in the hero should be replaced with the parchment base.

### Watercolor Washes
- Orange wash pinned to the **top-left** corner
- Teal wash pinned to the **bottom-right** corner
- Applied via CSS pseudo-elements on the body or a wrapper div
- Sizing: `background-size: clamp(200px, 30vw, 500px) auto`
- On screens < 768px, consider hiding one pair of washes to avoid crowding

### Decorative Elements
- Feather SVGs and music note SVGs scattered near the washes
- Positioned with `position: absolute` on a full-page decorative layer
- Must have `pointer-events: none` so they don't block clicks
- Rotate/flip individual notes for variety
- On mobile (< 480px), hide most decorative elements — keep 1-2 near corners

### Typography
| Role | Font | Weight | Color |
|------|------|--------|-------|
| Headlines | Baskervville (Google Fonts) | 400 (regular — it's a display face) | `#2C1810` (dark brown) |
| Subtitles / body | Inter (already loaded) | 400, 600 | `#6B5E50` (warm gray) |
| Accent / emphasis | — | — | `#D4A017` (amber) |

Add to the Google Fonts import:
```html
<link href="https://fonts.googleapis.com/css2?family=Baskervville&display=swap" rel="stylesheet">
```

### Color Token Updates
| Current Token | Current Value | New Value | Notes |
|---------------|---------------|-----------|-------|
| `--surface-0` | `#FFFFFF` | `#F0EBE6` | Parchment base |
| `--surface-1` | `#FDF9F3` | `#F0EBE6` | Unified background |
| `--color-primary` | `#FBBF24` | `#D4A017` | Warmer amber |
| `--color-coral` | `#F5A962` | Keep or soften | Used in wash, not UI |
| `--color-teal` | `#2D9E9E` | Keep | Still used as secondary accent |

### Layout
- One phone per feature section (matching carousel: single device, centered or alternating)
- Headline above, subtitle below the phone
- Max content width: 1200px with generous padding (min 40px from edges)
- Phone screenshots inside the iPhone 17 Pro bezel SVG (already in decor folder)

---

## 2. Approved Copy

### Source File
`session/app-store-copy-2.0.md`

The website copy should draw from the same well as the App Store listing. Use the description body as the basis for feature section text.

### Section Headers (locked to carousel)
These 10 headlines are the canonical section names. Use them as-is on the website:

1. Write songs the way you play
2. No WiFi. No account. No problem.
3. Every chord. Every voicing.
4. Find a chord without a name.
5. Built for the stage.
6. A studio in your pocket.
7. Precision tuning. Zero fuss.
8. See how your song fits together.
9. Export to PDF, ChordPro, and more.
10. One price. Everything. Forever.

Not all 10 need their own website section. Candidates for grouping:
- Slides 3 + 4 (chord picker + reverse search) could be one section
- Slides 7 + 8 (tuner + harmony) could be a "Tools" section

### Brand Voice
`content/prompt-library.md`

Key rules: musician-to-musician tone, no hype, no exclamation marks, no emoji, no hollow superlatives (seamless, powerful, elegant, intuitive, effortless). Ableton / Teenage Engineering terseness.

### Open Decisions
- **Promotional Text:** v1 ("Rebuilt in native Swift...") vs v2 ("Rebuilt from scratch for iOS...") — user hasn't chosen
- **Closer:** Keep or cut "Built by a musician" paragraph

---

## 3. Screenshot Assets

### Raw Screenshots (for website phone mockups)
These are the original app captures before carousel compositing. Use these inside the bezel SVG on the website.

**iPhone screenshots:**
`/Users/Atlas/Projects/songscribe-offline-muse/carousel-assets/`

| File | Feature |
|------|---------|
| `01-editor-chords-on-lyrics.png` | Chord-on-lyric editor |
| `02-dark-mode-editor.png` | Dark mode / offline |
| `03-chord-picker.png` | Chord picker sheet |
| `04-multi-track-recording.png` | Multi-track recording |
| `05-performance-mode.png` | Performance mode |
| `06-export-preview.png` | Export / PDF preview |
| `07-theme-grid.png` | Theme grid (16 themes) |
| `08-metronome.png` | Metronome |
| `09-tuner.png` | Tuner |
| `10-fretboard-diagram.png` | Reverse chord search |
| `12-harmony-add-to-song.png` | Harmony constellation |

**iPad screenshots:**
`/Users/Atlas/Projects/songscribe-offline-muse/carousel-assets/ipad/`

| File | Feature |
|------|---------|
| `01-editor-chords-on-lyrics.png` | Editor |
| `02-dark-mode-editor.png` | Dark mode |
| `03-chord-picker.png` | Chord picker |
| `04-fretboard-diagram.png` | Reverse chord search |
| `05-performance-mode.png` | Performance mode |
| `06-multi-track-recording.png` | Recording |
| `07-tuner.png` | Tuner |
| `08-harmony-constellation.png` | Harmony |
| `09-export-preview.png` | Export |
| `10-theme-grid.png` | Themes |

### Finished Carousel Slices (for reference, not for the website)
- iPhone 6.5": `SongScribe Media/app-screenshots/iphone-6.5/slice1-6.5.png` through `slice10-6.5.png`
- iPad 13": `SongScribe Media/app-screenshots/ipad-13/slice1-ipad.png` through `slice10-ipad.png`

### Supporting Assets
- `songscribe-offline-muse/carousel-assets/iphone-17-pro-frame.png` — raster bezel (high-res)
- `songscribe-website/public/assets/images/decor/iphone-17-bezel.svg` — vector bezel (for web)
- `songscribe-offline-muse/carousel-assets/songscribe-logo.svg`
- `songscribe-offline-muse/carousel-assets/songscribe-logo-square.png`

---

## 4. Decorative Assets Inventory

**Location:** `songscribe-website/public/assets/images/decor/`
**URL path on site:** `/assets/images/decor/`

| File | Type | Size | Usage |
|------|------|------|-------|
| `wash-orange.png` | PNG | 3.0 MB | Warm watercolor, top-left corner background |
| `wash-teal.png` | PNG | 2.6 MB | Cool watercolor, bottom-right corner background |
| `quill-01.svg` | SVG | 449 KB | Feather accent, near orange wash |
| `quill-02.svg` | SVG | 500 KB | Feather accent, near teal wash |
| `note-01.svg` | SVG | 3.4 KB | Music note decoration |
| `note-02.svg` | SVG | 5.7 KB | Music note decoration |
| `note-03.svg` | SVG | 1.9 KB | Music note decoration |
| `note-04.svg` | SVG | 5.0 KB | Music note decoration |
| `note-05.svg` | SVG | 3.3 KB | Music note decoration |
| `note-06.svg` | SVG | 5.4 KB | Music note decoration |
| `iphone-17-bezel.svg` | SVG | 11 KB | Device frame for screenshots |

### CSS Implementation Pattern

```css
/* Watercolor washes as pseudo-elements */
.page-wrapper::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: clamp(200px, 30vw, 500px);
  height: clamp(200px, 30vh, 500px);
  background: url('/assets/images/decor/wash-orange.png') top left / contain no-repeat;
  pointer-events: none;
  z-index: 0;
  opacity: 0.8;
}

.page-wrapper::after {
  content: '';
  position: fixed;
  bottom: 0;
  right: 0;
  width: clamp(200px, 30vw, 500px);
  height: clamp(200px, 30vh, 500px);
  background: url('/assets/images/decor/wash-teal.png') bottom right / contain no-repeat;
  pointer-events: none;
  z-index: 0;
  opacity: 0.8;
}

/* Notes and quills as absolutely positioned elements */
.decor-note {
  position: absolute;
  pointer-events: none;
  width: clamp(20px, 3vw, 40px);
  opacity: 0.7;
}

/* Hide most decorative elements on small screens */
@media (max-width: 768px) {
  .page-wrapper::before { opacity: 0.4; }
  .decor-note:nth-child(n+3) { display: none; }
}

@media (max-width: 480px) {
  .page-wrapper::before,
  .page-wrapper::after { display: none; }
}
```

### Performance Notes
- `wash-orange.png` (3.0 MB) and `wash-teal.png` (2.6 MB) are large. Before shipping, compress them or convert to WebP (target < 200 KB each).
- Quill SVGs are also large (449–500 KB) — likely contain embedded raster data. Check if they can be simplified or re-exported as pure vector.
- Music note SVGs are fine (2–6 KB each).

---

## 5. Current Site Architecture

### Tech Stack
- **Build:** Vite 5 (vanilla JS, no framework)
- **Hosting:** Cloudflare Pages (push to `main` = production)
- **3D Logo:** Three.js / CSS layers (may want to simplify for 2.0)
- **Email:** Mailchimp form
- **Analytics:** GTM placeholder (`GTM-XXXXXXX` — not yet configured)

### Key Files to Modify
| File | What Changes |
|------|-------------|
| `public/assets/css/main.css` | Color tokens, typography, layout, decorative layer |
| `index.html` | Hero section, feature sections, copy, Google Fonts link |
| `src/main.js` | May simplify 3D logo or remove |
| `src/style-glass.css` | Review — glass effects may not fit parchment aesthetic |

### Current Feature Section Layout
8 rows alternating text + phone mockup clusters (1–3 phones per row). The 2.0 redesign should simplify to **one phone per section** matching the carousel, with the screenshot inside the bezel SVG.

### Responsive Image Pattern
Existing assets use `-sm`, `-md`, `-lg`, `-xl` suffixes for responsive `srcset`. New screenshots should follow this pattern if multiple sizes are needed.

### Development Branch
Work on `songscribe-dev` branch, not `main`. Deploy previews via Cloudflare Pages preview URLs.

---

## 6. Carousel Headline & Subtitle Mapping

Each slide has a locked headline and two subtitle candidates (A/B). Final subtitle selection is pending.

| # | Headline | Subtitle A | Subtitle B | Screenshot |
|---|----------|-----------|-----------|------------|
| 1 | Write songs the way you play | Tap a word. Drop a chord. Keep writing. | Chords live right inside your lyrics, where they belong. | `01-editor-chords-on-lyrics.png` |
| 2 | No WiFi. No account. No problem. | Works everywhere. Even off the grid. | Open the app. Start writing. That's it. | `02-dark-mode-editor.png` |
| 3 | Every chord. Every voicing. | Guitar, piano, ukulele, banjo, and mandolin. | From open shapes to jazz voicings, it's all here. | `03-chord-picker.png` |
| 4 | Find a chord without a name. | Tap the strings. We'll name it for you. | That shape you stumbled on? Now it has a name. | `10-fretboard-diagram.png` |
| 5 | Built for the stage. | Auto-scroll setlists. Hands stay on the guitar. | Fullscreen. Hands-free. Eyes on the audience. | `05-performance-mode.png` |
| 6 | A studio in your pocket. | Layer recordings and bounce to a single mix. | Stack parts and downmix when you're ready to share. | `04-multi-track-recording.png` |
| 7 | Precision tuning. Zero fuss. | *(locked)* Zero jitter. Smooth tracking. Noise suppression built in. | — | `09-tuner.png` |
| 8 | See how your song fits together. | Tap any chord in the key to hear how it sounds. | Your chord progression mapped out as a constellation. | `12-harmony-add-to-song.png` |
| 9 | Export to PDF, ChordPro, and more. | Hand your bandmates a chart they can actually read. | Print-ready lead sheets. No formatting headaches. | `06-export-preview.png` |
| 10 | One price. Everything. Forever. | No subscriptions. No upsells. Just the whole app. | $19.95. No subscription. No upsells. | `07-theme-grid.png` |

---

## 7. Feature Reference

For detailed feature specs and capability lists, see:
`content/songscribe-2.0-feature-reference.md`

Key facts for copy:
- 5 instruments: guitar, bass, ukulele, mandolin, banjo
- 25+ tuning presets
- Up to 4 overdub layers per song
- 16 visual themes (light and dark)
- 5 fonts, 3 text sizes, 5 click sounds
- Time signatures up to 12/16
- Export: PDF (3 styles), ChordPro, ASCII, plain text
- Free tier: 10 songs, 5 recordings/song, forever
- Lifetime upgrade: $19.95 (no subscription)
- 7-day free trial available
