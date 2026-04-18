# CSS Animation Patterns for SongScribe Marketing Page
## Research Reference — shadcn-style Micro-Animations in Vanilla HTML/CSS/JS

**Scope:** Pure HTML + CSS @keyframes + vanilla JS Intersection Observer. No React, no Tailwind, no npm.

---

## The "shadcn Animation DNA" — What Makes It Feel Polished

Before the patterns, understand what unifies shadcn/ui's animation style. The source is the `tailwindcss-animate` plugin (jamiebuilds/tailwindcss-animate), which powers `animate-in` on every shadcn component.

### The Core Insight: Composite-Only Properties

Every shadcn animation touches **only two CSS properties**: `opacity` and `transform`. These are the only two properties the browser can animate on the GPU compositor thread without triggering layout or paint. Everything else (width, height, top, margin) causes reflow and jank.

This is the single biggest distinction between animations that feel premium and animations that feel cheap.

### The Exact Numbers

| Property | Value | Notes |
|----------|-------|-------|
| Duration (entrance) | `300ms` | Components use `150ms` default, but marketing page elements need more weight |
| Duration (hero) | `400ms–600ms` | Larger elements, more visual mass |
| Easing (entrance) | `cubic-bezier(0.16, 1, 0.3, 1)` | "Expo out" — fast start, gentle deceleration |
| Easing (subtle) | `cubic-bezier(0.4, 0, 0.2, 1)` | Material-style ease — balanced |
| Slide distance | `16px–24px` | shadcn uses ~20px vertical. Never more than 32px for text |
| Fade start | `opacity: 0` → `opacity: 1` | Always full fade, not partial |
| Stagger increment | `80ms–100ms` | Between cards/items in a sequence |
| Hero stagger | `120ms–150ms` | Slightly wider gap, more dramatic |

### Why `cubic-bezier(0.16, 1, 0.3, 1)` Specifically

This is the "expo out" curve. It starts very fast (the element snaps into existence immediately) and decelerates gradually to rest. The viewer perceives "instant response + graceful landing." It does not bounce. It does not overshoot. This is the curve behind every Vercel, Linear, and shadcn animation that feels fast but not abrupt.

Compare with `ease-out` (0, 0, 0.58, 1) — that starts slowly and feels sluggish, like the element is wading through water.

### The Keyframe Architecture (from tailwindcss-animate source)

The plugin's `@keyframes enter` works entirely via CSS custom properties:

```css
@keyframes enter {
  from {
    opacity: var(--enter-opacity, 1);
    transform: translate3d(
      var(--enter-translate-x, 0),
      var(--enter-translate-y, 0),
      0
    )
    scale3d(
      var(--enter-scale, 1),
      var(--enter-scale, 1),
      var(--enter-scale, 1)
    );
  }
}
```

The `to` state has no declaration — the element just animates to its natural layout state. This means you set the starting condition via custom properties, not by hard-coding values into the keyframe. This is the pattern to replicate in vanilla CSS.

---

## Pattern 1: Scroll-Triggered Entrance (Fade + Slide Up)

The foundational pattern. Every section, card, and text block that appears as the user scrolls.

### The CSS

```css
/* ============================================================
   SCROLL ENTRANCE ANIMATION SYSTEM
   Uses Intersection Observer to add .is-visible class
   ============================================================ */

/* Base state: invisible, shifted down 20px */
.animate-on-scroll {
  opacity: 0;
  transform: translateY(20px);
  /*
    Do NOT put transition here. Use animation-fill-mode: both
    on the keyframe so the element stays in its final position.
    Transitions re-trigger on every state change; keyframes don't.
  */
}

/* Triggered state: play the animation */
.animate-on-scroll.is-visible {
  animation: fadeSlideUp 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Accessibility: immediately show everything if user prefers reduced motion */
@media (prefers-reduced-motion: reduce) {
  .animate-on-scroll {
    opacity: 1;
    transform: none;
    animation: none;
  }
  .animate-on-scroll.is-visible {
    animation: none;
  }
}
```

### The JavaScript (Intersection Observer)

```javascript
// ============================================================
// SCROLL ENTRANCE — Intersection Observer Setup
// ============================================================

(function () {
  // Bail out entirely if user prefers reduced motion.
  // Do this check once at load, not per-element.
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  if (prefersReducedMotion) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          // Unobserve after triggering — entrance animations only play once.
          // Keeping the observer attached is wasted work.
          observer.unobserve(entry.target);
        }
      });
    },
    {
      // rootMargin: start animating when element is 10% into the viewport.
      // Negative bottom margin prevents triggering too early.
      rootMargin: '0px 0px -10% 0px',
      // threshold: 0 means trigger the moment any pixel is visible.
      // This combined with the rootMargin offset gives the right feel.
      threshold: 0,
    }
  );

  // Observe everything with the class
  document.querySelectorAll('.animate-on-scroll').forEach((el) => {
    observer.observe(el);
  });
})();
```

### Usage in HTML

```html
<div class="animate-on-scroll">
  <!-- any section content -->
</div>
```

### Gotchas

- **`forwards` fill mode is critical.** Without it, elements snap back to `opacity: 0` when the animation ends. Always use `animation: name duration easing forwards`.
- **Do not use `will-change: transform` on every element.** Apply it only immediately before an animation starts (if at all), then remove it. Promoting hundreds of elements to GPU layers hurts performance and increases memory use significantly. For simple entrance animations on a marketing page, `will-change` is unnecessary.
- **The initial `opacity: 0` and `transform: translateY(20px)` on `.animate-on-scroll` must exist in CSS, not only in the keyframe.** If JS hasn't run yet (slow network, no JS), the element would be invisible forever. Consider this: you can instead set `opacity: 0` via JS after the observer is set up, keeping the CSS state visible by default. Pattern shown below:

```javascript
// Safer approach: add the hidden class with JS, not CSS
document.querySelectorAll('.animate-on-scroll').forEach((el) => {
  el.classList.add('scroll-hidden'); // CSS: opacity:0, translateY(20px)
  observer.observe(el);
});
```

```css
.scroll-hidden {
  opacity: 0;
  transform: translateY(20px);
}
```

---

## Pattern 2: Auto-Scrolling Marquee (Screenshot Carousel)

A horizontally infinite-scrolling strip of 8 phone screenshots. CSS-only infinite loop, pause on hover, fade masks on edges.

### HTML Structure

The key is **duplicating the content**. You need at least two copies of the item list so the animation can loop from the end back to the start without a visible gap.

```html
<div class="marquee-wrapper" aria-label="App screenshot gallery" role="region">
  <div class="marquee-track">
    <!-- Original set -->
    <div class="marquee-item"><img src="screenshot-1.png" alt="Song editor view"></div>
    <div class="marquee-item"><img src="screenshot-2.png" alt="Setlist view"></div>
    <div class="marquee-item"><img src="screenshot-3.png" alt="Chord chart view"></div>
    <div class="marquee-item"><img src="screenshot-4.png" alt="Recording view"></div>
    <div class="marquee-item"><img src="screenshot-5.png" alt="Performance mode"></div>
    <div class="marquee-item"><img src="screenshot-6.png" alt="Song library"></div>
    <div class="marquee-item"><img src="screenshot-7.png" alt="Key transposition"></div>
    <div class="marquee-item"><img src="screenshot-8.png" alt="Settings view"></div>
    <!-- Duplicate set — aria-hidden so screen readers don't see it twice -->
    <div class="marquee-item" aria-hidden="true"><img src="screenshot-1.png" alt=""></div>
    <div class="marquee-item" aria-hidden="true"><img src="screenshot-2.png" alt=""></div>
    <div class="marquee-item" aria-hidden="true"><img src="screenshot-3.png" alt=""></div>
    <div class="marquee-item" aria-hidden="true"><img src="screenshot-4.png" alt=""></div>
    <div class="marquee-item" aria-hidden="true"><img src="screenshot-5.png" alt=""></div>
    <div class="marquee-item" aria-hidden="true"><img src="screenshot-6.png" alt=""></div>
    <div class="marquee-item" aria-hidden="true"><img src="screenshot-7.png" alt=""></div>
    <div class="marquee-item" aria-hidden="true"><img src="screenshot-8.png" alt=""></div>
  </div>
</div>
```

### The CSS

```css
/* ============================================================
   MARQUEE / INFINITE SCROLL CAROUSEL
   ============================================================ */

:root {
  /* Tune this one value to control speed.
     Larger number = slower scroll.
     For 8 phone screenshots at ~200px width each = ~1600px total.
     40s gives a comfortable reading pace. */
  --marquee-duration: 40s;
  --marquee-item-width: 200px; /* adjust to your screenshot width */
  --marquee-gap: 24px;
}

.marquee-wrapper {
  /* Clip overflow to hide items outside the visible area */
  overflow: hidden;
  position: relative;

  /* The edge fade mask.
     Uses mask-image (standard) with -webkit- prefix fallback.
     hsl(0 0% 0% / 0) = fully transparent
     hsl(0 0% 0% / 1) = fully opaque
     The gradient stops at 10% and 90% give a ~160px fade zone on each side
     at typical desktop widths. Adjust percentages to taste. */
  -webkit-mask-image: linear-gradient(
    to right,
    hsl(0 0% 0% / 0) 0%,
    hsl(0 0% 0% / 1) 10%,
    hsl(0 0% 0% / 1) 90%,
    hsl(0 0% 0% / 0) 100%
  );
  mask-image: linear-gradient(
    to right,
    hsl(0 0% 0% / 0) 0%,
    hsl(0 0% 0% / 1) 10%,
    hsl(0 0% 0% / 1) 90%,
    hsl(0 0% 0% / 0) 100%
  );
}

.marquee-track {
  display: flex;
  gap: var(--marquee-gap);
  width: max-content; /* lets the flex row stretch to natural width */

  animation: marqueeScroll var(--marquee-duration) linear infinite;
}

/* Pause on hover — applies to the track, triggered by hovering the wrapper */
.marquee-wrapper:hover .marquee-track {
  animation-play-state: paused;
}

/* Also pause on focus-within for keyboard users */
.marquee-wrapper:focus-within .marquee-track {
  animation-play-state: paused;
}

.marquee-item {
  flex-shrink: 0;
  width: var(--marquee-item-width);
  /* Height should be set explicitly to match your screenshots */
  height: 400px;
}

.marquee-item img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 16px;
  /* Optional: subtle shadow for depth */
  box-shadow: 0 8px 32px rgb(0 0 0 / 0.12);
}

/* The keyframe.
   Translates the track exactly one "set" width to the left.
   Because the second set is an identical duplicate, the loop is seamless.

   The translation amount must equal the total width of ONE set of items:
   (item-width + gap) * item-count = (200 + 24) * 8 = 1792px

   In practice, use calc() with CSS custom properties or measure empirically. */
@keyframes marqueeScroll {
  from {
    transform: translateX(0);
  }
  to {
    /* Negative = scroll left. Value = width of one full item set. */
    transform: translateX(calc(-1 * (var(--marquee-item-width) + var(--marquee-gap)) * 8));
  }
}

/* Reduced motion: stop scrolling, show as a static overflow-scroll container */
@media (prefers-reduced-motion: reduce) {
  .marquee-track {
    animation: none;
  }
  .marquee-wrapper {
    overflow-x: auto;
    /* Remove the fade mask so edges are accessible */
    -webkit-mask-image: none;
    mask-image: none;
  }
}
```

### Key Points on the Marquee

**Why `animation-timing-function: linear`:** Any other easing creates a perceptible acceleration/deceleration at the loop boundary, breaking the illusion. Linear is the only correct choice here.

**The duplication math:** The animation translates by exactly the width of ONE full set of items. Because the second set is a pixel-perfect duplicate, when the first set has scrolled entirely off the left edge, the second set occupies exactly where the first set started. The loop resets to `translateX(0)` invisibly.

**Calculating the exact translation:** If your screenshots are not all the same width, measure the actual `.marquee-track` width via JS: `document.querySelector('.marquee-track').scrollWidth / 2`. You can set this as a CSS custom property:

```javascript
const track = document.querySelector('.marquee-track');
const singleSetWidth = track.scrollWidth / 2;
track.style.setProperty('--single-set-width', `${singleSetWidth}px`);
```

Then change the keyframe to use `translateX(calc(-1 * var(--single-set-width)))`.

**Speed feel:** 40 seconds for 8 screenshots at 200px each is relaxed and readable. 25–30 seconds feels slightly urgent. Below 20 seconds feels like a ticker tape, not a showcase.

---

## Pattern 3: Staggered Card Grid Animation

Eight feature cards animate in with a cascade delay as the grid enters the viewport. The stagger is applied via CSS custom properties set on each element's `style` attribute.

### HTML Structure

```html
<div class="features-grid" id="features-grid">
  <div class="feature-card" style="--stagger: 0">...</div>
  <div class="feature-card" style="--stagger: 1">...</div>
  <div class="feature-card" style="--stagger: 2">...</div>
  <div class="feature-card" style="--stagger: 3">...</div>
  <div class="feature-card" style="--stagger: 4">...</div>
  <div class="feature-card" style="--stagger: 5">...</div>
  <div class="feature-card" style="--stagger: 6">...</div>
  <div class="feature-card" style="--stagger: 7">...</div>
</div>
```

### The CSS

```css
/* ============================================================
   STAGGERED CARD GRID
   ============================================================ */

/* Base hidden state — JS adds .scroll-hidden class */
.feature-card.scroll-hidden {
  opacity: 0;
  transform: translateY(24px);
}

/* When the parent grid becomes visible, trigger all children */
.features-grid.is-visible .feature-card {
  animation: cardEntrance 500ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
  /*
    The stagger delay: each card uses its own --stagger index.
    80ms * 0 = 0ms (first card, no delay)
    80ms * 1 = 80ms (second card)
    80ms * 7 = 560ms (eighth card, last)
    Total sequence completes in ~1060ms (560 + 500ms duration)
  */
  animation-delay: calc(var(--stagger) * 80ms);
}

@keyframes cardEntrance {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Reduced motion: skip the animation entirely */
@media (prefers-reduced-motion: reduce) {
  .feature-card.scroll-hidden {
    opacity: 1;
    transform: none;
  }
  .features-grid.is-visible .feature-card {
    animation: none;
  }
}
```

### The JavaScript

Observe the **parent container**, not individual cards. When the grid enters the viewport, add `.is-visible` to the parent, and CSS handles the rest via the cascade.

```javascript
// ============================================================
// STAGGERED GRID — Intersection Observer
// ============================================================

(function () {
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  if (prefersReducedMotion) return;

  // Add the hidden state via JS so no-JS users see content
  document.querySelectorAll('.feature-card').forEach((card) => {
    card.classList.add('scroll-hidden');
  });

  const gridObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          gridObserver.unobserve(entry.target);
        }
      });
    },
    {
      // Trigger when 15% of the grid is visible.
      // This ensures the user has scrolled meaningfully into the section.
      threshold: 0.15,
    }
  );

  const grid = document.getElementById('features-grid');
  if (grid) gridObserver.observe(grid);
})();
```

### Stagger Tuning

| Use Case | Increment | Total for 8 items |
|----------|-----------|-------------------|
| Tight, snappy | 50ms | 350ms |
| Comfortable (recommended) | 80ms | 560ms |
| Dramatic, editorial | 120ms | 840ms |

Do not exceed 120ms per increment. Beyond that, the last cards feel like an afterthought rather than part of the same choreographed sequence. The viewer should experience the grid as "one animated event," not "8 separate events."

### Alternative: Assign Stagger Indexes via JS

If you don't want to put `style="--stagger: N"` on each HTML element manually:

```javascript
document.querySelectorAll('.feature-card').forEach((card, index) => {
  card.style.setProperty('--stagger', index);
  card.classList.add('scroll-hidden');
});
```

---

## Pattern 4: Hero Entrance — Staggered Text Reveal

The hero loads immediately on page load (no scroll trigger needed). Elements appear in sequence: eyebrow → h1/tagline → subtitle → CTA. Each is delayed slightly.

### HTML Structure

```html
<section class="hero">
  <div class="hero-content">
    <!-- Each element gets a specific delay class -->
    <p class="hero-eyebrow anim-hero" style="--hero-delay: 0ms">
      For songwriters and gigging musicians
    </p>
    <h1 class="hero-headline anim-hero" style="--hero-delay: 120ms">
      Write songs the way you play
    </h1>
    <p class="hero-subtitle anim-hero" style="--hero-delay: 240ms">
      Chord charts, setlists, and a recorder that work when your
      phone has no signal. No account. No subscription tricks.
    </p>
    <div class="hero-cta anim-hero" style="--hero-delay: 360ms">
      <a href="#download" class="btn btn-primary">Download Free</a>
      <a href="#features" class="btn btn-secondary">Learn More</a>
    </div>
  </div>
</section>
```

### The CSS

```css
/* ============================================================
   HERO ENTRANCE — Page Load Animation (no JS, no observer)
   Triggered by page load, not scroll.
   ============================================================ */

.anim-hero {
  animation: heroEntrance 600ms cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: var(--hero-delay, 0ms);
}

@keyframes heroEntrance {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Reduced motion: instant appearance, no movement */
@media (prefers-reduced-motion: reduce) {
  .anim-hero {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
```

### Why `animation-fill-mode: both` Here (not `forwards`)

`both` applies the `from` state before the animation starts (backward fill) AND holds the `to` state after it ends (forward fill). This means elements with a delay (e.g., `--hero-delay: 360ms`) stay invisible during their delay period, then animate in. Without `both`, they would flash visible at 0ms and then disappear until the delay ends.

### Timing Breakdown

| Element | Delay | Appears at |
|---------|-------|-----------|
| Eyebrow | 0ms | Immediately on page load |
| H1 / Tagline | 120ms | 0.12s after load |
| Subtitle | 240ms | 0.24s after load |
| CTA buttons | 360ms | 0.36s after load |

The sequence completes at roughly 960ms (360ms delay + 600ms duration). The entire hero is "settled" in under one second, which feels immediate and snappy rather than drawn out.

**Do not go above 150ms increments for hero text.** Longer gaps make users feel like the page is loading slowly even if it isn't.

### Hero Phone Image

The phone mockup / hero visual should animate in on a slightly different axis to feel distinct from the text:

```css
.hero-phone {
  animation: heroImageEntrance 800ms cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: 100ms;
}

@keyframes heroImageEntrance {
  from {
    opacity: 0;
    transform: translateY(32px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
```

The slight `scale(0.96)` → `scale(1)` gives the phone image a sense of weight and materiality that text elements do not need.

---

## Pattern 5: Scroll-Driven Animations (Modern CSS — No JS)

This is the native CSS replacement for the Intersection Observer pattern, available in all modern browsers as of 2024 (Chrome 115+, Firefox 110+, Safari 18). For a marketing page that targets recent iOS/macOS (your audience is iPhone users), this is viable.

```css
/* ============================================================
   SCROLL-DRIVEN ANIMATION (CSS-only, no JavaScript)
   Supported: Chrome 115+, Firefox 110+, Safari 18+
   ============================================================ */

@supports (animation-timeline: view()) {
  .animate-on-scroll {
    /* Override JS-based hidden state */
    opacity: 0;
    transform: translateY(20px);

    animation: fadeSlideUp linear both;
    animation-timeline: view();
    /*
      animation-range: entry defines when during the element's
      scroll entry the animation runs.
      entry 0% = element starts entering viewport
      entry 30% = element is 30% into the viewport
      This compresses the animation into the "entering" phase only.
    */
    animation-range: entry 0% entry 30%;
  }
}

/* Important: only use this as a progressive enhancement.
   Keep the JS Intersection Observer as the base implementation.
   Browsers without support will use the JS path. */
```

**Recommendation:** Implement the Intersection Observer version as the baseline. The scroll-driven CSS version can be layered on top via `@supports` as a progressive enhancement. For your use case (simple entrance animations), the IO pattern is more reliable and more controllable.

---

## Summary: Copy-Paste Timing Reference

This is the single reference table to use when implementing animations on the page.

### Timing Values

```css
:root {
  /* Durations */
  --anim-fast:     200ms;   /* micro-interactions, hover states */
  --anim-base:     300ms;   /* small UI elements, labels */
  --anim-entrance: 400ms;   /* scroll-triggered section elements */
  --anim-hero:     600ms;   /* hero text and images */
  --anim-heavy:    800ms;   /* hero phone image, large visuals */

  /* Easings */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);  /* PRIMARY — fast snap, smooth land */
  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);   /* balanced, good for hover states */
  --ease-linear:   linear;                           /* marquee ONLY */

  /* Distances */
  --slide-sm:  12px;  /* labels, captions */
  --slide-md:  20px;  /* standard cards, sections */
  --slide-lg:  32px;  /* hero image, large elements */

  /* Stagger */
  --stagger-tight:  50ms;
  --stagger-normal: 80ms;
  --stagger-wide:  120ms;
}
```

### Keyframe Library (drop into `main.css`)

```css
/* -- Entrance -- */
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(var(--slide-md, 20px)); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.96); }
  to   { opacity: 1; transform: scale(1); }
}

@keyframes heroEntrance {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes heroImageEntrance {
  from { opacity: 0; transform: translateY(32px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* -- Marquee -- */
@keyframes marqueeScroll {
  from { transform: translateX(0); }
  to   { transform: translateX(var(--marquee-scroll-distance)); }
}

/* -- Reduced Motion Override -- */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Implementation Notes for SongScribe

### Element-by-element guide for the existing page structure

Based on the current HTML structure in `index.html`:

| Page Element | Pattern to Use | Class to Add | Notes |
|---|---|---|---|
| `.hero-eyebrow` / tagline SVG | Hero entrance | `anim-hero --hero-delay:0ms` | No scroll trigger needed |
| `.hero-subtitle` | Hero entrance | `anim-hero --hero-delay:240ms` | |
| `.hero-cta` | Hero entrance | `anim-hero --hero-delay:360ms` | |
| `.hero-phone` | Hero image | `anim-hero-image` | Use `heroImageEntrance` with scale |
| `.feature-cascade` section title | Scroll entrance | `animate-on-scroll` | Single element, no stagger |
| `.showcase-row` items | Scroll entrance | `animate-on-scroll` | One per row |
| Screenshots strip | Marquee | new section + marquee classes | |
| Feature grid cards | Staggered grid | `feature-card --stagger:N` | If adding a card grid |

### Performance Checklist

- All animations use only `opacity` and `transform` — no layout-triggering properties
- `will-change` is NOT applied globally — only if a specific element shows jank during testing
- Intersection Observer uses `unobserve()` after trigger — no ongoing observation after animation plays
- `prefers-reduced-motion` handled at both CSS and JS levels
- Marquee `aria-hidden="true"` on duplicate items — no screen reader double-reading
- Hero animations run on page load — no flicker from late JS execution

### What to Avoid

- Do not animate `height`, `width`, `top`, `left`, `margin`, or `padding` — these trigger layout
- Do not use `ease-in` for entrances — it starts slow and feels like the element is being dragged into place
- Do not stack more than two transforms in an animation unless you have a specific reason (`translateY` + `scale` is fine; adding `rotate` too is usually distracting)
- Do not use more than 3 different animation durations on a single page — it feels inconsistent
- Do not make entrance animations repeat — `animation-iteration-count: infinite` on entrances is visually exhausting

---

## Sources

- [GitHub — jamiebuilds/tailwindcss-animate](https://github.com/jamiebuilds/tailwindcss-animate) — primary source for shadcn animate-in keyframe architecture
- [GitHub — Wombosvideo/tw-animate-css](https://github.com/Wombosvideo/tw-animate-css) — Tailwind v4 replacement; same keyframe design
- [The Infinite Marquee — ryanmulligan.dev](https://ryanmulligan.dev/blog/css-marquee/)
- [Infinite-Scrolling Logos in Pure CSS — Smashing Magazine 2024](https://www.smashingmagazine.com/2024/04/infinite-scrolling-logos-html-css/)
- [Infinite Marquee Animation — Frontend Masters Blog](https://frontendmasters.com/blog/infinite-marquee-animation-using-modern-css/)
- [Animations with the Intersection Observer API — Alex Winter 2024](https://alxwntr.com/animations-with-the-intersection-observer-api-2024/)
- [CSS Scroll-Triggered Animations — CSS-Tricks](https://css-tricks.com/unleash-the-power-of-scroll-driven-animations/)
- [A Practical Introduction to Scroll-Driven Animations — Codrops 2024](https://tympanus.net/codrops/2024/01/17/a-practical-introduction-to-scroll-driven-animations-with-css-scroll-and-view/)
- [CSS GPU Animation: Doing It Right — Smashing Magazine](https://www.smashingmagazine.com/2016/12/gpu-animation-doing-it-right/)
- [How to Create High-Performance CSS Animations — web.dev](https://web.dev/articles/animations-guide)
- [prefers-reduced-motion — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion)
- [shadcn Easing Functions Visualizer](https://www.shadcn.io/easings)
- [Vercel Web Interface Guidelines](https://vercel.com/design/guidelines)
