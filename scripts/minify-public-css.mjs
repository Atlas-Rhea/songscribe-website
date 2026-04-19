// Post-build step: minify the CSS files Vite copied through from public/
// (Vite only bundles/minifies CSS imported from source; public/ files are
// copied verbatim). Then inline the two render-critical stylesheets
// (decor.css + site.css) directly into each HTML file in dist/ so the
// browser can paint without a round-trip for stylesheet fetches.
//
// main.css (legacy v1 rules for nav/cookie-consent/btn/etc.) stays as a
// deferred external stylesheet — it's loaded via media="print" onload swap
// in the HTML itself, so it doesn't gate the critical render path.
import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';
import cssnano from 'cssnano';

const distDir = path.resolve('dist');
const cssDir = path.join(distDir, 'assets/css');
if (!fs.existsSync(cssDir)) {
  console.error('[minify-public-css] missing', cssDir);
  process.exit(1);
}

const minified = {};
const cssFiles = fs.readdirSync(cssDir).filter((f) => f.endsWith('.css'));
for (const name of cssFiles) {
  const file = path.join(cssDir, name);
  const before = fs.readFileSync(file, 'utf8');
  const result = await postcss([cssnano({ preset: 'default' })]).process(before, { from: file });
  fs.writeFileSync(file, result.css);
  minified[name] = result.css;
  const pct = Math.round((1 - result.css.length / before.length) * 100);
  console.log(`[minify-public-css] ${name}: ${before.length}b -> ${result.css.length}b (-${pct}%)`);
}

// Inline the two critical stylesheets into every HTML file that references them.
// Pattern: a <link rel="stylesheet" href="/assets/css/{decor,site}.css"> becomes
// an inline <style data-inlined-from="..."> block with the minified content.
const CRITICAL = ['decor.css', 'site.css'];
const linkRe = /<link[^>]+rel="stylesheet"[^>]+href="\/assets\/css\/([^"]+)"[^>]*>/g;

function walkHtml(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(full);
    else if (entry.name.endsWith('.html')) processHtml(full);
  }
}

function processHtml(file) {
  const before = fs.readFileSync(file, 'utf8');
  let touched = false;
  const after = before.replace(linkRe, (match, name) => {
    if (CRITICAL.includes(name) && minified[name]) {
      touched = true;
      return `<style data-inlined-from="${name}">${minified[name]}</style>`;
    }
    return match;
  });
  if (touched) {
    fs.writeFileSync(file, after);
    const rel = path.relative(distDir, file);
    console.log(`[minify-public-css] inlined critical CSS into ${rel}`);
  }
}

walkHtml(distDir);
