# Hedra Watercolor Pipeline — Design Spec

**Date:** 2026-04-17
**Status:** Approved for planning
**Site:** songscribe.io (v2 redesign)

## Problem

The SongScribe 2.0 marketing site uses watercolor washes as atmospheric background accents across ten sections (hero, seven feature sections, pricing, footer). Today two washes exist — orange and teal, generated manually via Hedra and hand-post-processed to transparent PNGs. Every other section still uses placeholder colored ellipses in the Pencil draft.

We want a repeatable build-time pipeline that generates an "ideal" wash per section, plus one scroll-locked motion moment in the hero. The washes must feel cohesive (one painter's hand) while varying in color and mood to match each section's content.

## Goals

1. **Section-appropriate stills.** Each of the ten sections gets a watercolor wash whose color, density, and edge quality match that section's content and palette.
2. **One scroll-locked motion moment.** The hero wash blooms open as the viewer scrolls through the hero section — frames scrubbed against scroll position, running on the compositor thread.
3. **Floating decor.** Music notes and quills across all sections drift into place as each section enters view, using native CSS scroll-driven animations (no JS library).
4. **Single source of truth.** A `manifest.json` describes every section's wash. Regeneration is reproducible and diffable.
5. **Reproducible and cheap.** Full regeneration under $1 in API costs. Lockfile prevents redundant regeneration.
6. **Graceful degradation.** Every motion effect has a static fallback honoring `prefers-reduced-motion` and browsers without `animation-timeline` support.

## Non-Goals

- Runtime image generation. All Hedra calls are local, at author time. Visitors never trigger API requests.
- Per-visitor personalization or randomized variants.
- Animating sections other than the hero. Below-the-fold motion budget goes entirely to the CSS-driven notes and quills.
- Building a GUI. The CLI plus Claude Code session authoring is the tool.
- True transparent-background generation inside Hedra itself (the API does not support it; we generate on white and composite).

## Decisions Locked In Brainstorming

| # | Question | Choice |
|---|----------|--------|
| 1 | Generation timing | Build-time baked (local CLI, committed assets) |
| 2 | Motion scope | Flavor A — Restrained: hero scroll-scrub + CSS view-timeline decor only |
| 3 | Motion duration | 6-second source video → 90 frames extracted |
| 4 | Background strategy | Ship white-bg + `mix-blend-mode: multiply`; also keep true-alpha copies as escape hatch |
| 5 | Parameterization | JSON manifest, one entry per section |
| 6 | Prompt authoring | Template + slots in manifest; Claude Code session refines interactively (no runtime Anthropic SDK) |

## Architecture

```
┌─────────────────────────────────────────┐
│  scripts/washes/   (Node + TypeScript)  │
│  ├─ manifest.json      section entries  │
│  ├─ washes.lock.json   reproducibility  │
│  ├─ generate.ts        orchestrator CLI │
│  ├─ compile-prompt.ts  template → str   │
│  ├─ hedra-client.ts    image + video    │
│  ├─ post-process.ts    rembg + cwebp    │
│  └─ extract-frames.ts  ffmpeg           │
└───────────┬─────────────────────────────┘
            │ commits output to:
            ▼
┌─────────────────────────────────────────┐
│  public/assets/decor/                   │
│  ├─ washes/                             │
│  │   ├─ hero.webp         white-bg      │
│  │   ├─ hero.a.webp       true alpha    │
│  │   └─ ... (×10)                       │
│  └─ motion/hero/                        │
│      ├─ 001.webp ... 090.webp           │
│      └─ poster.webp   reduced-motion    │
└───────────┬─────────────────────────────┘
            │ loaded by:
            ▼
┌─────────────────────────────────────────┐
│  site runtime (vanilla JS + CSS)        │
│  ├─ <img> stills with multiply blend    │
│  ├─ <canvas> hero scroll-scrubbed       │
│  │    driven by CSS animation-timeline  │
│  └─ CSS view-timeline on notes/quills   │
└─────────────────────────────────────────┘
```

### Boundaries

- **Generation is offline.** The script hits Hedra only when invoked. Nothing in the shipped site hits an API.
- **Runtime is static.** `public/assets/decor/` is the entire motion surface. No CDN egress beyond asset delivery.
- **Manifest is the source of truth.** Lockfile plus manifest together make every byte of output reproducible.
- **Failure is safe.** If a regeneration run fails mid-way, committed assets from the last good run keep shipping.

## Manifest Schema

Location: `scripts/washes/manifest.json`

```jsonc
{
  "version": 1,
  "global": {
    "model": "flux-dev",
    "size": "2048x2048",
    "template": "A single {palette} watercolor wash on pure white paper, {density}, {edge} edges, slight granulation, hand-painted, no subject, centered, isolated, high-resolution scan.",
    "negative": "text, borders, frame, subject, object, geometry, sharp lines, digital gradient, vignette",
    "concurrency": 1
  },
  "sections": [
    {
      "id": "hero",
      "mood": "warm invitation, dawn light, unhurried",
      "palette": "soft burnt orange blending into amber",
      "density": "large diffuse bloom with a quieter center",
      "edge": "torn, feathered",
      "seed": 47213,
      "motion": {
        "enabled": true,
        "frames": 90,
        "duration": 6.0,
        "direction": "bloom",
        "videoModel": "veo-3.1-fast",
        "videoPrompt": "the watercolor wash slowly blooming outward from its center, paint expanding organically into the surrounding paper, subtle wet edge spread"
      }
    },
    {
      "id": "f1-chord-editor",
      "mood": "focused, grounded, ink on staff paper",
      "palette": "deep teal with graphite undertone",
      "density": "compact, deliberate",
      "edge": "wet, softly defined",
      "seed": 88104
    }
    // ... eight more entries
  ]
}
```

### Field semantics

- `global.template` is a plain string with `{slot}` placeholders. `compile-prompt.ts` fills them from each section entry.
- `global.negative` is appended to every prompt as a negative prompt string (supported by Flux).
- `mood`, `palette`, `density`, `edge` are the four slots. Missing slots fall back to sensible defaults (`"soft neutral", "medium bloom", "feathered"`).
- `seed` is optional. When present, makes the Hedra output reproducible across runs. When absent, the script generates one and writes it back to the lockfile.
- `prompt` (optional, not shown) is a bespoke override that bypasses the template entirely for a single section.
- `motion` is optional. Only `hero` sets `enabled: true` in v1.

### Manifest authoring workflow

New sections and tweaks are drafted collaboratively in Claude Code. Typical session:

1. User: "I want the pricing section to feel generous and golden."
2. Claude reads the manifest, proposes an entry (`palette: "warm honey with faint rose"`, etc.).
3. User approves or iterates.
4. Claude writes the entry into `manifest.json`.
5. User runs `npm run washes -- --only pricing`.

## Still-Generation Pipeline

For every section entry, in order:

1. **Compile prompt** — `compile-prompt.ts` substitutes slots into the template, appends the negative prompt, returns a single string. Pure function. Unit-tested.
2. **Check lockfile** — if `washes.lock.json` already has an entry with a hash matching `{prompt + seed + model + size}`, skip unless `--force` is set.
3. **Call Hedra image endpoint** — `hedra-client.generateImage({ prompt, model, size, seed })` returns a 2048×2048 PNG on white. Retry once on 5xx, fail loud otherwise.
4. **Save raw audit copy** — `public/assets/decor/washes/<id>.raw.png`. Committed. This is the canonical source for both the shipped white-bg version and the alpha version.
5. **Compress white-bg version** — `cwebp -q 82 <id>.raw.png -o <id>.webp`. This is what ships as `<img>` with `mix-blend-mode: multiply`.
6. **Extract alpha version** — run `rembg` (u2net model) on the raw PNG, producing `<id>.a.png`. Compress to `<id>.a.webp`. Committed. This is the escape hatch for dark themes or composites where multiply-blend fails.
7. **Update lockfile** — write `{ id, prompt, seed, model, hash, ts }` into `washes.lock.json`.
8. **Rate limit** — `global.concurrency: 1` serializes Hedra calls to stay under free-tier quota.

### Failure handling per section

| Failure | Behavior |
|---------|----------|
| Hedra 4xx | Log prompt, stop the run. User fix, rerun. |
| Hedra 5xx | Retry once after 3s. Second failure stops the run. |
| rembg crash | Keep `.webp` white-bg version, skip alpha for this section, warn. Section is still shippable (multiply blend works without alpha). |
| cwebp missing | Fail loud with install instructions. |
| Disk full | Fail loud; no partial commit. |

## Motion Pipeline (hero only)

Triggered only when `motion.enabled === true` and the section's `.raw.png` exists (or was just generated).

1. **Call Hedra image-to-video endpoint** — `hedra-client.animateImage({ imagePath, prompt: motion.videoPrompt, duration: motion.duration, model: motion.videoModel })`. Returns MP4 or WebM, typically 720p at 24fps.
2. **Extract frames** — `ffmpeg -i input.mp4 -vf "fps=15,scale=1200:-1" motion/hero/%03d.png`. At 6s × 15fps = 90 frames, each ~1200px wide.
3. **Compress each frame** — `cwebp -q 78 %03d.png -o %03d.webp`. Expected total: ~550–700KB for 90 frames.
4. **Poster frame** — copy `090.webp` (final state of the bloom) to `motion/hero/poster.webp`. This is the reduced-motion and unsupported-browser fallback.
5. **Clean up** — delete intermediate PNG frames, keep only WebP sequence + poster.

### Why frame extraction rather than shipping the WebM

- Scroll-scrub needs random-access frame addressing; `<video>.currentTime` scrubbing is notoriously janky across browsers, especially on mobile Safari.
- Individual WebP frames are cacheable independently and can be lazy-loaded.
- `<canvas>` drawing frames indexed by a CSS custom property is buttery on the compositor.

## Post-Processing Details

### WebP compression

- White-bg washes: `cwebp -q 82 -alpha_q 90 -m 6` (balances size with granulation quality)
- Alpha washes: same
- Motion frames: `cwebp -q 78 -m 6` (slightly more aggressive; small per-frame size matters more than per-frame fidelity when 90 are averaged by motion)

### Background removal (rembg)

- Model: `u2net` (best general matting for soft-edged subjects)
- Invoked via CLI: `rembg i -m u2net <in> <out>`
- Installed via `pip install rembg[cpu]` — pinned in `scripts/washes/requirements.txt`
- First run downloads the ~176MB model to `~/.u2net/`. Committed in CI docs, noted in README.

## Runtime Integration

### Stills (nine sections)

```html
<img class="wash wash-tl" src="/assets/decor/washes/hero.webp"
     alt="" aria-hidden="true" loading="lazy">
```

```css
.wash {
  position: absolute;
  pointer-events: none;
  user-select: none;
  mix-blend-mode: multiply;
}
```

No JS. Works on every browser. The cream background (`#F0EBE6`) darkens wherever the watercolor pigment sits; the white bg vanishes because `white × anything = anything` under multiply blend.

### Hero scroll-scrubbed canvas

```html
<section class="hero">
  <canvas class="hero-bloom" width="1200" height="1200" aria-hidden="true"></canvas>
  <img class="hero-bloom-fallback" src="/assets/decor/motion/hero/poster.webp"
       alt="" aria-hidden="true">
  <!-- hero content -->
</section>
```

```css
.hero { animation-timeline: view(block); animation-name: heroProgress; }
@keyframes heroProgress { from { --p: 0 } to { --p: 1 } }

.hero-bloom { display: block }
.hero-bloom-fallback { display: none }

@supports not (animation-timeline: view()) {
  .hero-bloom { display: none }
  .hero-bloom-fallback { display: block }
}
@media (prefers-reduced-motion: reduce) {
  .hero-bloom { display: none }
  .hero-bloom-fallback { display: block }
}
```

```js
// src/hero-bloom.js — ~60 lines
const FRAME_COUNT = 90;
const frames = [];

async function preloadFrames() {
  const promises = Array.from({ length: FRAME_COUNT }, (_, i) => {
    const img = new Image();
    img.src = `/assets/decor/motion/hero/${String(i + 1).padStart(3, '0')}.webp`;
    frames[i] = img;
    return img.decode();
  });
  await Promise.all(promises);
}

function startScrubber(canvas) {
  const ctx = canvas.getContext('2d');
  const hero = canvas.closest('.hero');

  const tick = () => {
    const p = parseFloat(getComputedStyle(hero).getPropertyValue('--p')) || 0;
    const idx = Math.min(FRAME_COUNT - 1, Math.floor(p * FRAME_COUNT));
    const f = frames[idx];
    if (f?.complete) ctx.drawImage(f, 0, 0, canvas.width, canvas.height);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
```

Preload kicks off on DOMContentLoaded. Scrubber starts once first 10 frames have decoded so initial paint is fast.

### Notes and quills (all sections)

SVGs already in `/assets/images/decor/` (`note-01.svg` through `note-06.svg`, `quill-01.svg`, `quill-02.svg`).

```css
.note {
  position: absolute;
  animation-timeline: view();
  animation-range: cover 0% cover 100%;
  animation-fill-mode: both;
}
.note[data-drift="1"] { animation-name: drift1 }
.note[data-drift="2"] { animation-name: drift2 }
.note[data-drift="3"] { animation-name: drift3 }
.note[data-drift="4"] { animation-name: drift4 }

@keyframes drift1 {
  from { transform: translate(-20px, 40px) rotate(-8deg); opacity: 0 }
  50%  { opacity: .55 }
  to   { transform: translate(30px, -60px) rotate(6deg); opacity: 0 }
}
/* drift2-4: variants of position + rotation */

@media (prefers-reduced-motion: reduce) {
  .note { animation: none; opacity: .35 }
}
```

Three to four variants randomized per note across the page.

## CLI Surface

```
npm run washes                       # full regen with dry-run preview
npm run washes -- --estimate         # print prompts + cost estimate, exit
npm run washes -- --only hero        # regenerate one section
npm run washes -- --sections f1,f2   # regenerate a list
npm run washes -- --stills-only      # skip motion pipeline
npm run washes -- --motion-only      # run only the hero motion pipeline
npm run washes -- --force            # ignore lockfile hashes
npm run washes -- --no-alpha         # skip rembg step (faster iteration)
```

Every run prints a table of what will happen before any API call:

```
Section          Action        Prompt (80 chars)
─────────────────────────────────────────────────────────────────
hero             REGEN (still) A single soft burnt orange watercolor wash on pure white paper…
hero             REGEN (motion) 6.0s bloom, 90 frames
f1-chord-editor  SKIP (cached) A single deep teal with graphite watercolor wash on pure white…
f2-recording     REGEN (still) A single muted coral watercolor wash on pure white paper…
─────────────────────────────────────────────────────────────────
Est. cost: $0.46 · continue? [y/N]
```

## Configuration & Secrets

`.env.local` (git-ignored):

```
HEDRA_API_KEY=hed_sk_…
```

`scripts/washes/generate.ts` reads this on start; fails loud with a setup link if missing. No other secrets.

`scripts/washes/.gitignore`:
```
node_modules/
__pycache__/
*.tmp
```

## Cost Estimates

| Item | Cost | Frequency |
|------|------|-----------|
| Hedra image (Flux-Dev, 2048²) | ~$0.03 | 10× per full regen |
| Hedra image-to-video (Veo 3.1 Fast, 6s) | ~$0.50 | 1× per full regen |
| **Full regen** | **~$0.80** | as needed, typically once at launch + occasional tweaks |
| Single-section still regen | ~$0.03 | iteration |
| Hero motion regen | ~$0.50 | rare; only when the wash design itself changes |

## Safeguards

- **Lockfile skip** — matching hashes skip the API call entirely.
- **Dry-run by default** — prints table, asks for confirmation.
- **`--estimate` flag** — prints cost and prompts, makes zero API calls.
- **Rate limit** — `concurrency: 1` serializes.
- **Per-section isolation** — one section failing does not corrupt others.
- **Committed audit trail** — `.raw.png` files preserve the canonical Hedra output for reference.

## File Layout

```
/
├─ scripts/
│  └─ washes/
│     ├─ manifest.json
│     ├─ washes.lock.json
│     ├─ generate.ts
│     ├─ compile-prompt.ts
│     ├─ hedra-client.ts
│     ├─ post-process.ts
│     ├─ extract-frames.ts
│     ├─ requirements.txt              # rembg pin
│     ├─ package.json                  # node deps
│     └─ tsconfig.json
├─ public/
│  └─ assets/
│     └─ decor/
│        ├─ washes/
│        │  ├─ hero.raw.png            # canonical, committed
│        │  ├─ hero.webp               # white-bg, ships
│        │  ├─ hero.a.webp             # alpha, escape hatch
│        │  └─ … (×10 sections)
│        └─ motion/
│           └─ hero/
│              ├─ 001.webp … 090.webp
│              └─ poster.webp
└─ src/
   └─ hero-bloom.js                    # ~60-line scroll scrubber (matches existing src/main.js style)
```

## Testing Strategy

- **`compile-prompt.ts`** — unit tests covering slot substitution, missing slots, override path, negative prompt append.
- **`hedra-client.ts`** — contract tests with recorded fixtures; mocks for CI.
- **Lockfile logic** — unit tests for hash computation and skip behavior.
- **End-to-end** — one `--estimate` run in CI against a fake Hedra endpoint to verify manifest parses and cost totals render.

## Failure Modes & Fallbacks

| Fault | Ship state | Remediation |
|-------|-----------|-------------|
| `manifest.json` invalid JSON | Build breaks at lint step | Fix JSON. |
| Hedra API down | Last committed assets keep shipping | Retry later. |
| rembg model download fails | Ship without alpha escape hatch | Reinstall; `--force` a regen. |
| `animation-timeline` unsupported | Canvas hides, poster shows | N/A (intentional). |
| `prefers-reduced-motion: reduce` | Canvas hides, poster shows, notes freeze | N/A (intentional). |
| JS disabled | Canvas blank, poster shows, notes freeze | N/A (intentional — stills still render). |
| Safari <18 or other browsers without `animation-timeline` | Falls through to poster path via `@supports not` | N/A (intentional). |

## Out of Scope (Future)

- Runtime A/B of multiple wash variants per section.
- Motion for below-the-fold sections.
- Dark-mode automatic swap (alpha versions exist; actual dark theme is a separate project).
- WebGL shader rendering of the watercolor (considered, rejected for v1 complexity budget).
- Multi-frame motion for notes and quills driven by Hedra (pure-CSS variants cover this need).
- Localized washes per visitor geography or time of day.

## Open Questions

None blocking. Resolved during brainstorming.

## References

- [Generate Image Endpoint — Hedra API](https://www.hedra.com/docs/legacy-api-reference/generate-image-endpoint)
- [hedra-labs/hedra-node SDK](https://github.com/hedra-labs/hedra-node)
- [CSS Scroll-driven Animations — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations)
- [A guide to Scroll-driven Animations — WebKit](https://webkit.org/blog/17101/a-guide-to-scroll-driven-animations-with-just-css/)
- [Scrub through a canvas image sequence — GSAP helper](https://gsap.com/docs/v3/HelperFunctions/helpers/imageSequenceScrub/)
- [rembg](https://github.com/danielgatis/rembg)
- [cwebp documentation — Google Developers](https://developers.google.com/speed/webp/docs/cwebp)
