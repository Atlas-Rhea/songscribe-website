# SongScribe 2.0 Watercolor Decor — Handoff Doc

**Purpose:** Full context dump for an agent picking up the v2 marketing-site redesign after `feat/hedra-watercolor-pipeline` is merged to `main`. Everything below represents a multi-session body of work: design system, wash-generation pipeline, theme architecture decisions, and UI integration that has **not yet been wired into `index.html`**.

---

## 1. What the project is

SongScribe is an offline-first Progressive Web App for musicians. This repo is the **marketing site** (static, Vite-built, deployed to Cloudflare Pages at [songscribe.io](https://songscribe.io)) — separate from the app codebase.

The marketing site is being redesigned (v1 → v2). v2 is specified in a Pencil design document `"v2 website"` (no extension, JSON under the hood — open via Pencil MCP). v2 changes the look from "watercolor gradient hero" to a multi-section parchment-paper aesthetic with hand-painted watercolor washes, decorative music notes/quills, and a "dark & darker" two-tier section-background system.

**Important:** The user is not a professional developer. Translate design intent into beginner-friendly technical decisions. Explain jargon plainly. Flag risky/expensive choices before taking them.

---

## 2. Current branch state

Branch: `feat/hedra-watercolor-pipeline` (being merged to `main` at handoff time).

**What's done and shipped on this branch:**
- Generated watercolor decor asset set at `public/assets/decor/washes/` (orange + teal blob variants, each with light and dark versions, each dark version also has an `.a.webp` alpha-keyed companion)
- `public/assets/css/decor.css` — stand-alone decor styling (paper texture, wash layouts, notes/quills, theme tokens, dark-mode via `[data-theme="dark"]` + `prefers-color-scheme`)
- `public/decor-preview.html` — isolated preview playground with 6+ scenes demonstrating every decor pattern, with a working theme toggle button
- `scripts/washes/*` — end-to-end generation pipeline (manifest → Hedra API → rembg alpha-key → webp output → lockfile cache)
- Pencil design doc `"v2 website"` at repo root (JSON format, open with Pencil MCP) specifying the full v2 site structure

**What's NOT done:**
- None of this is wired into the live `index.html`. The live site is still v1 (gradient hero, v1 feature list, v1 main.css tokens).
- No theme toggle on the production page.
- No decor.css imports in `index.html`.
- No main.css refactor to align with decor tokens.

---

## 3. The v2 design (from Pencil)

Open `"v2 website"` via Pencil MCP (`mcp__pencil__batch_get` with `filePath: "/Users/Atlas/Projects/songscribe-website/v2 website"`). Top-level frame id is `0rDb3`.

**Section rhythm (top → bottom):**

| Order | Section | Fill | Tier |
|---|---|---|---|
| 1 | Announcement strip | `$ink` | dark |
| 2 | Navigation | `$parchment` | light |
| 3 | Hero | `$parchment` + orange TL wash + teal TR wash | light |
| 4 | Feature 1 — Chord-on-lyric editor | `$parchment` | light |
| 5 | Feature 2 — Offline | `$cream` | light |
| 6 | Feature 3 — Chord tools | `$parchment` | light |
| 7 | Feature 4 — Performance mode | `$ink` | **dark** |
| 8 | Feature 5 — Recording | `$parchment` | light |
| 9 | Feature 6 — Tuner & harmony | `$cream` | light |
| 10 | Feature 7 — Export | `$parchment` | light |
| 11 | Pricing | `$ink` | **dark** |
| 12 | Footer | `$parchment` | light |

**Design tokens (from Pencil `get_variables`):**
- `parchment` `#F0EBE6` · `cream` `#F7F3EC` · `cream-warm` `#FAF6F0`
- `ink` `#2C1810` · `ink-soft` `#4A3420`
- `amber` `#D4A017` · `amber-soft` `#E5B84A` · `coral` `#F5A962`
- `teal` `#2D9E9E` · `teal-deep` `#1F6B6B`
- `warm-gray` `#6B5E50` · `warm-gray-soft` `#8A7D6F` · `hairline` `#E0D8CE`

These map 1:1 to the CSS custom properties already defined in `public/assets/css/decor.css` at `:root` (lines 10–42).

---

## 4. Theme architecture — "dark & darker"

**Critical design decision** (captured from user). The site is NOT a single-theme-flip. It has two tiers of section backgrounds in each mode:

- **Light theme:** light-tier sections = `parchment` / `cream`; dark-tier sections = `ink`
- **Dark theme:** light-tier sections = `ink` (what was parchment becomes chocolate); dark-tier sections = **darker than ink** (a deeper chocolate, not yet picked — likely `#1A0E07` or similar)

The theme toggle only swaps the two tiers' values. Section markup stays identical across themes. Every section gets a `.section--light` or `.section--dark` class, and the tier variables look like:

```css
:root[data-theme="light"] {
  --section-bg-light: var(--parchment);
  --section-bg-dark:  var(--ink);
}
:root[data-theme="dark"] {
  --section-bg-light: var(--ink);
  --section-bg-dark:  #1A0E07; /* placeholder — pick a real darker tone */
}
.section--light { background: var(--section-bg-light); }
.section--dark  { background: var(--section-bg-dark);  }
```

**Why this matters:** A monotone dark-mode would flatten the section rhythm — the alternating paper/accent cadence is the design's core visual beat. Preserve it.

---

## 5. Decor system — how it's built

### 5.1 Paper texture (`decor.css` lines 88–109)

Pure-CSS SVG noise, no external asset. Two stacked `feTurbulence` filters (fine grain + coarse fiber) with `stitchTiles="stitch"` so they tile seamlessly. Dark theme swaps the color matrix to produce cream specks on chocolate instead of brown specks on cream. Apply via `body.decor-paper` or `.decor-paper` class on any container.

### 5.2 Watercolor washes (`decor.css` lines 112–190)

Two wrappers:
- `.wash` — single wash element, absolute-positioned, blended via `mix-blend-mode: multiply` (light) / `screen` (dark).
- `.wash-group` — when TWO washes overlap. Blends them together in an isolated stacking context first, THEN applies one paper-facing opacity. Without the group, overlapping semi-opaque washes compound into a ghost box at the intersection.

Hero layout uses both:
- `.wash--hero-orange-tl` (top-left, 1100×1100, offset `-380`/`-340`)
- `.wash--hero-teal-tr` (top-right, scaled `-1` to flip pigment to that corner)
- `.wash--hero-teal-bl` (bottom-left, used in Scene 1 with the orange plate composition)

### 5.3 Dark-mode decor uses alpha-keyed assets

Key insight documented in `memory/feedback_dark_prompt_discipline.md`:

> Dark-mode washes blend via `mix-blend-mode: screen` against `#2C1810` paper. If the image has ANY partial-alpha on a white-ish background, screen blend ghosts those pixels as pale/milky.

Fix:
1. Generate the dark variant on **perfectly flat solid brown `#2C1810`** (not white paper).
2. Post-process through `rembg` (u2net salient-object model) to keyout the flat brown, producing an `<slug>.a.webp` with clean alpha.
3. CSS references `.a.webp` (not `.webp`) for dark-theme wash selectors.

Example selector pattern (from `decor.css` lines 226–239):
```css
:root[data-theme="dark"] .wash--orange {
  background-image: url('/assets/decor/washes/blob-cloud-orange-mood-a-dark.a.webp');
}
```

### 5.4 Reuse pattern: quadrant-crop existing mood blobs

Another captured learning (`memory/feedback_decor_reuse_vs_regenerate.md`). When a wash needs to anchor pigment in a specific corner (e.g., hero teal at bottom-left for dark mode), do NOT immediately generate a dedicated corner-anchored asset. Try CSS-cropping an existing mood blob first:

```css
.wash--hero-teal-bl {
  background-image: url('/assets/decor/washes/blob-cloud-teal-mood-a-dark.a.webp');
  background-size: 200% 200%;
  background-position: right top; /* shows TR quadrant; pigment ends up at BL of box */
  transform: none;
}
```

Mood blobs have pigment densest near their center; cropping to one quadrant puts that density in one corner of the display box. Try all four `background-position` values (`left top` / `right top` / `left bottom` / `right bottom`) and both mood variants (`mood-a` / `mood-b`) before committing to a new generation. The user explicitly rejected two dedicated regenerations in favor of this approach.

---

## 6. Wash generation pipeline (`scripts/washes/`)

See `memory/project_wash_pipeline.md` for the compact version.

**Shape:**
- `manifest.json` — source of truth. Each entry is one asset: `slug`, `prompt`, `seed`, `width`, `height`, `mode` (`still` | `motion`), optional `alphaKey: true`.
- `washes.lock.json` — per-slug hash of `prompt + seed + width + height + alphaKey`. If hash matches, the asset is already generated and is skipped.
- Source code lives under `scripts/washes/src/`:
  - `generate.ts` — orchestrator
  - `hedra-client.ts` — async-poll wrapper around Hedra API (wraps Nano Banana Pro for stills, Grok I2V for motion frames)
  - `post-process.ts` — rembg alpha-keying via shell-out
  - `compile-prompt.ts` — prompt composition
  - `hash.ts` — fingerprinting
  - `cli.ts`, `cli-args.ts`, `cli-table.ts` — CLI entrypoint and UX
  - `mock-hedra.ts` — offline mock used in tests

**Command:**
```bash
npm run washes -- --yes --stills-only --sections <comma-separated-slugs>
```

- `--yes` — skip confirmation prompt
- `--stills-only` — skip Grok motion-frame generation (motion is ~10× cost of stills)
- `--sections <a,b,c>` — filter manifest to specific entries
- `--force` — bypass lockfile hash check and regenerate

**Cost:** Nano Banana Pro is ~$0.03 per 2048×2048 still. Motion (Grok I2V) is expensive; limit to hero only.

**API keys:** Stored in env (`HEDRA_API_KEY`, etc.). Not committed.

---

## 7. Preview playground

`public/decor-preview.html` is a standalone HTML page that renders 6+ scenes demonstrating the full decor vocabulary. NOT part of the production build — it's a static file in `public/` that Vite copies through. Access at `/decor-preview.html` in dev.

**Scenes:**
1. Hero plate + overlay (baked-in orange TR + teal BL overlay)
2. Orange + teal mood blobs in `.wash-group`
3. Horizontal drift (Scene 6 — uses drift blobs)
4. Scattered notes + quills
5. Mood-a blobs isolated
6. Mood-b + drift combined

**Theme toggle** is a floating button (top-right, fixed position). Lines 285–288 (button) and 455–476 (inline JS). Sets `data-theme` on `<html>`, persists to `localStorage['decor-theme']`, falls back to `prefers-color-scheme`.

This is the **reference implementation** for the theme toggle. When wiring it into the real `index.html`, copy the JS logic verbatim.

---

## 8. The big open task: wire decor into `index.html`

This is where the work stopped. Two scopes were on the table:

### Scope A — overlay (~1–2 days)
Keep v1 `index.html` structure intact. Layer decor on top: add `decor.css`, add `.decor-paper` to body, add `.wash-group` + wash elements to the hero, sprinkle `.decor-note` and `.decor-quill` around, add theme toggle, add `.section--light` / `.section--dark` classes to existing sections to get dark-mode working. Doesn't match v2 pen design but ships fast.

### Scope B — v2 rebuild (weeks)
Replace `index.html` with a page that matches the pen spec: 12 sections, new announcement strip, new 7-feature cascade with per-section layouts from the pen, new pricing section, full decor baked in, `section--light`/`section--dark` tiering, theme toggle. New copywriting per the pen text nodes.

**Both scopes share the same foundation work:**
1. Import `decor.css` from `index.html` (`<link rel="stylesheet" href="/assets/css/decor.css">`)
2. Add `data-theme` attribute handling + `localStorage` persistence (copy from `decor-preview.html`)
3. Add theme toggle button component
4. Reconcile `main.css` tokens (`--color-*`) with `decor.css` tokens (`--parchment`, `--ink`, etc.) — these currently overlap and conflict. Either rewrite `main.css` to use decor tokens, or namespace carefully.
5. Apply `.decor-paper` to body
6. Define `.section--light` / `.section--dark` tier classes

**The user wanted subagents to plan this.** Before dispatching a planner, clarify scope (A vs B) with the user. Don't assume B just because the pen exists — the pen may be aspirational.

---

## 9. State of `index.html` and `main.css` (current, pre-decor)

From prior investigation:

**`index.html`** (590 lines):
- Header (81–104): nav, logo, mobile-menu toggle, CTA
- Hero (108–130): 3D logo, tagline SVG, two CTAs — NO decor
- Features (133–360): `.feature-cascade` with 8 showcase rows
- Newsletter (363–385): Mailchimp form
- Final CTA (388–405): download buttons
- Footer (409–470): grid, social links
- Cookie banner (70–78), Lightbox (472–476)
- `src/main.js` as module entry (line 478): 3D logo init + mobile nav + smooth scroll
- Inline scripts (480+): cookie consent + GTM + lightbox

**`main.css`** (2000+ lines):
- `:root` (8–92): `--color-*` tokens, typography, spacing, shadows, radius, transitions
- **No dark-mode support anywhere.** No `prefers-color-scheme`, no `[data-theme]`.
- Major selectors: `.header` (183), `.hero` (430, with 135° watercolor gradient animation), `.feature-cascade` (870), `.newsletter` (1540), `.final-cta` (1588), `.footer` (1645)
- Token namespace conflicts with decor.css: both define color tokens in `:root`, and they represent different design systems. Needs reconciliation.

**`vite.config.js`** — multi-page build. Entries: `index`, `about`, `changelog`, `features/index`, `terms`, `privacy`, `tunerIndex/Privacy/Terms/Support`, `go/index`. `decor-preview.html` is NOT a build entry — it's copied as a static asset through `public/`.

---

## 10. Other context scraps

- **User workflow:** This is a one-person project. The user is not a professional developer; they rely on the agent as "CTO and lead engineer." Always explain jargon, warn about fragility, propose simpler alternatives.
- **Date:** Today is 2026-04-18 (real time in the active sessions).
- **Deployment:** Push to `main` → Cloudflare Pages production. Push to any other branch → preview URL. The `feat/hedra-watercolor-pipeline` branch has preview deployments available.
- **Existing memories** in `~/.claude/projects/-Users-Atlas-Projects-songscribe-website/memory/`:
  - `feedback_decor_reuse_vs_regenerate.md`
  - `feedback_dark_prompt_discipline.md`
  - `project_theme_architecture.md`
  - `project_wash_pipeline.md`
- **Plan artifacts** (exist but not yet used): `docs/superpowers/plans/2026-03-14-linktree-go-page.md`, `docs/superpowers/specs/2026-03-14-linktree-go-page-design.md` — unrelated earlier plan for a linktree-style `/go` page.
- **Animation research:** `animation-research.md` at repo root — notes on Grok I2V parameters and hero motion experiments. Motion is expensive and was parked; revisit only after the static aesthetic is dialed.
- **iPhone bezel SVG** at `public/assets/images/decor/iphone-17-bezel.svg` — for product screenshot frames in feature sections.

---

## 11. Recommended first steps for the next agent

1. **Read** this doc end-to-end, plus the four memory files.
2. **Pull up the preview:** `npm run dev`, open `/decor-preview.html`, click the theme toggle. Make sure the decor system actually works in your environment before touching `index.html`.
3. **Open the Pencil design:** `mcp__pencil__get_screenshot` on frame `0rDb3` in `"v2 website"` to see the target.
4. **Confirm scope with the user** (A vs B from section 8) before dispatching any planning subagent. The effort delta is large.
5. **If Scope B:** Use `superpowers:brainstorming` or `superpowers:writing-plans` to decompose into milestones — don't try to rewrite 590 lines of index.html in one shot. A reasonable first milestone is "new hero section + theme toggle working in production, rest of page untouched."
6. **If Scope A:** Skip the planner. Go direct: import `decor.css`, add theme toggle, add `.decor-paper` to body, layer `.wash-group` on existing hero, add `.section--light`/`.section--dark` to sections, test in preview.

---

## 12. Things to NOT do

- Don't regenerate watercolor assets without first trying CSS quadrant-crop of existing mood blobs (section 5.4).
- Don't prompt new dark-mode assets without the flat-brown + explicit-negation discipline (memory `feedback_dark_prompt_discipline.md`). Gemini's prior toward "paint on white paper" is very strong.
- Don't assume "dark mode" means monotone dark. It's "dark & darker" — two tiers.
- Don't commit `.claude/`, `.serena/`, or `.superpowers/` — those are local dev-tool caches. They've been added to `.gitignore` as part of this handoff commit.
- Don't reach for Grok motion generation until the static aesthetic is fully dialed. Motion burns budget fast.
- Don't blindly apply a giant `main.css` → decor token migration in one pass. Rename tokens gradually, test dark mode after each batch.
