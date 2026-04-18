# Bio Link Page (`/go`) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first Linktree-style page at `songscribe.io/go` that funnels social media traffic to the SongScribe App Store listing, Tuner app, and main website — with GTM click tracking.

**Architecture:** Single self-contained HTML file (`go/index.html`) with inline styles and a small inline script for cookie consent + GTM + click tracking. No external CSS or JS dependencies beyond Google Fonts and GTM.

**Tech Stack:** HTML, CSS (inline), vanilla JS (inline), Google Fonts (Inter), GTM (`GTM-M7G6MZ8K`)

**Spec:** `docs/superpowers/specs/2026-03-14-linktree-go-page-design.md`

---

## Chunk 1: Page Creation and Build Config

### Task 1: Create the `/go` directory

**Files:**
- Create: `go/index.html`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p go
```

- [ ] **Step 2: Create `go/index.html` with the full page**

Create the complete HTML file with all content, styles, consent banner, GTM, and click tracking inline. The page structure from top to bottom:

1. HTML head: meta tags, Inter font, noindex, OG tags, inline `<style>`
2. Cookie consent banner (hidden by default)
3. Logo + brand heading + tagline
4. Primary CTA (golden gradient, links to SongScribe App Store)
5. Divider with "Looking for something simpler?"
6. Secondary CTA (teal, links to Tuner App Store)
7. Website link (songscribe.io)
8. Footer (© 2026 SongScribe)
9. Inline `<script>`: cookie consent logic, GTM loader, click tracking

Key implementation details:

**HTML `<head>`:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SongScribe — Download the App</title>
    <meta name="description" content="Get SongScribe, the songwriting toolkit built by musicians for musicians. Write songs with chords, record ideas, and build setlists.">
    <meta name="robots" content="noindex">

    <!-- Open Graph -->
    <meta property="og:title" content="SongScribe — Download the App">
    <meta property="og:description" content="The songwriting toolkit built by musicians, for musicians.">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://songscribe.io/go">

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
</head>
```

**Inline `<style>` — key rules:**
```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    background: linear-gradient(135deg, #FDF9F3, #FAF5ED);
    color: #2D3748;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
}

.container {
    width: 100%;
    max-width: 400px;
    text-align: center;
}

.logo { width: 72px; height: 72px; margin: 0 auto 12px; }
.brand { font-size: 20px; font-weight: 700; }
.tagline { font-size: 13px; opacity: 0.7; margin-top: 4px; }

.cta-primary {
    display: block;
    background: linear-gradient(135deg, #FBBF24, #F5A962);
    border-radius: 14px;
    padding: 18px 20px;
    margin-top: 28px;
    text-decoration: none;
    color: #2D3748;
    box-shadow: 0 4px 16px rgba(251, 191, 36, 0.3);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.cta-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(251, 191, 36, 0.4); }
.cta-primary .label { font-size: 16px; font-weight: 700; }
.cta-primary .subtitle { font-size: 11px; opacity: 0.65; margin-top: 3px; }

.divider {
    margin: 24px 0;
    display: flex;
    align-items: center;
    gap: 12px;
}
.divider::before, .divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(45, 55, 72, 0.1);
}
.divider span {
    font-size: 13px;
    font-style: italic;
    opacity: 0.55;
    white-space: nowrap;
}

.cta-secondary {
    display: block;
    background: rgba(45, 158, 158, 0.08);
    border: 1.5px solid rgba(45, 158, 158, 0.2);
    border-radius: 12px;
    padding: 14px;
    text-decoration: none;
    color: #2D3748;
    transition: background 0.15s ease;
}
.cta-secondary:hover { background: rgba(45, 158, 158, 0.14); }
.cta-secondary .label { font-size: 15px; font-weight: 600; color: #2D9E9E; }
.cta-secondary .subtitle { font-size: 11px; opacity: 0.6; margin-top: 2px; }

.website-link {
    display: block;
    margin-top: 20px;
    font-size: 13px;
    font-weight: 500;
    color: #2D3748;
    opacity: 0.5;
    text-decoration: none;
    transition: opacity 0.15s ease;
}
.website-link:hover { opacity: 0.75; }

footer {
    margin-top: 32px;
    font-size: 11px;
    opacity: 0.35;
}

/* Cookie consent bar */
.consent-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: #FDF9F3;
    border-top: 1px solid rgba(45, 55, 72, 0.1);
    padding: 12px 20px;
    display: none;
    align-items: center;
    justify-content: center;
    gap: 12px;
    font-size: 12px;
    z-index: 100;
}
.consent-bar.show { display: flex; flex-wrap: wrap; }
.consent-bar p { flex: 1; min-width: 200px; text-align: center; opacity: 0.7; }
.consent-bar button {
    border: none;
    border-radius: 6px;
    padding: 6px 14px;
    font-size: 12px;
    font-family: inherit;
    cursor: pointer;
}
.consent-accept { background: #FBBF24; color: #2D3748; font-weight: 600; }
.consent-decline { background: rgba(45, 55, 72, 0.08); color: #2D3748; }
```

**HTML `<body>` content:**
```html
<body>
    <!-- Cookie Consent -->
    <div class="consent-bar" id="consent-bar">
        <p>We use cookies to understand how you found us.</p>
        <button class="consent-accept" id="consent-accept">Accept</button>
        <button class="consent-decline" id="consent-decline">Decline</button>
    </div>

    <div class="container">
        <!-- Logo + Brand -->
        <img src="/assets/images/logo-combined.svg" alt="SongScribe" class="logo">
        <h1 class="brand">SongScribe</h1>
        <p class="tagline">Built by musicians, for musicians</p>

        <!-- Primary CTA -->
        <a href="https://apps.apple.com/app/id6756506993"
           target="_blank" rel="noopener"
           class="cta-primary"
           data-link="songscribe_app">
            <div class="label">Get SongScribe Free</div>
            <div class="subtitle">Songwriting · Chords · Recording · Setlists</div>
        </a>

        <!-- Divider -->
        <div class="divider"><span>Looking for something simpler?</span></div>

        <!-- Secondary CTA -->
        <a href="https://apps.apple.com/app/songscribe-tuner/id6758641886"
           target="_blank" rel="noopener"
           class="cta-secondary"
           data-link="songscribe_tuner">
            <div class="label">Try SongScribe Tuner</div>
            <div class="subtitle">Free state-of-the-art instrument tuner</div>
        </a>

        <!-- Website Link -->
        <a href="https://songscribe.io"
           target="_blank" rel="noopener"
           class="website-link"
           data-link="website">
            songscribe.io →
        </a>

        <!-- Footer -->
        <footer>© 2026 SongScribe</footer>
    </div>
</body>
```

**Inline `<script>` (before `</body>`):**
```javascript
<script>
(function () {
    var consent = localStorage.getItem('cookie-consent');
    var bar = document.getElementById('consent-bar');

    function loadGTM() {
        window.dataLayer = window.dataLayer || [];
        (function (w, d, s, l, i) {
            w[l] = w[l] || [];
            w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
            var f = d.getElementsByTagName(s)[0],
                j = d.createElement(s),
                dl = l != 'dataLayer' ? '&l=' + l : '';
            j.async = true;
            j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
            f.parentNode.insertBefore(j, f);
        })(window, document, 'script', 'dataLayer', 'GTM-M7G6MZ8K');
    }

    if (consent === 'accepted') {
        loadGTM();
    } else if (!consent && bar) {
        bar.classList.add('show');
        document.getElementById('consent-accept').addEventListener('click', function () {
            localStorage.setItem('cookie-consent', 'accepted');
            bar.classList.remove('show');
            loadGTM();
        });
        document.getElementById('consent-decline').addEventListener('click', function () {
            localStorage.setItem('cookie-consent', 'declined');
            bar.classList.remove('show');
        });
    }

    // Click tracking
    document.querySelectorAll('[data-link]').forEach(function (el) {
        el.addEventListener('click', function () {
            if (window.dataLayer) {
                window.dataLayer.push({
                    event: 'link_click',
                    link_name: el.getAttribute('data-link'),
                    link_url: el.getAttribute('href')
                });
            }
        });
    });
})();
</script>
```

- [ ] **Step 3: Commit**

```bash
git add go/index.html
git commit -m "feat: add /go bio link page for social media"
```

### Task 2: Add `/go` to Vite build config

**Files:**
- Modify: `vite.config.js:12-22` (rollupOptions.input)

- [ ] **Step 1: Add the `go` entry to rollupOptions.input**

In `vite.config.js`, add this line after the `tunerSupport` entry (line 22):

```javascript
go: resolve(__dirname, 'go/index.html'),
```

The input object should now include:
```javascript
input: {
    main: resolve(__dirname, 'index.html'),
    about: resolve(__dirname, 'about.html'),
    changelog: resolve(__dirname, 'changelog.html'),
    features: resolve(__dirname, 'features/index.html'),
    terms: resolve(__dirname, 'terms.html'),
    privacy: resolve(__dirname, 'privacy.html'),
    tunerIndex: resolve(__dirname, 'tuner/index.html'),
    tunerPrivacy: resolve(__dirname, 'tuner/privacy.html'),
    tunerTerms: resolve(__dirname, 'tuner/terms.html'),
    tunerSupport: resolve(__dirname, 'tuner/support.html'),
    go: resolve(__dirname, 'go/index.html'),
},
```

- [ ] **Step 2: Commit**

```bash
git add vite.config.js
git commit -m "build: add /go page to Vite rollup inputs"
```

### Task 3: Build and verify

- [ ] **Step 1: Run the build**

```bash
npm run build
```

Expected: Exit code 0, `dist/go/index.html` exists in output.

- [ ] **Step 2: Verify the output file exists**

```bash
ls -la dist/go/index.html
```

Expected: File exists.

- [ ] **Step 3: Preview and smoke test**

```bash
npm run preview
```

Open `http://localhost:4173/go/` in a browser. Verify:
- Page loads with cream background
- Logo displays
- All three links are visible and clickable
- Cookie consent bar appears at bottom
- Links open in new tabs
- Clicking Accept dismisses the bar

- [ ] **Step 4: Commit the dist build**

```bash
git add dist/
git commit -m "build: rebuild dist with /go page"
```
