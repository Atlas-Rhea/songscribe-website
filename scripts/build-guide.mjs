#!/usr/bin/env node
// Builds guide/index.html and guide/<slug>/index.html from the docs repo.
// Source: $GUIDE_SRC or ../songscribe-offline-muse/docs/website-guide
// Shells: scripts/templates/guide-page.html, scripts/templates/guide-index.html
// Run `npm run build:guide:all` after the docs change; commit the output.

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { marked } from 'marked';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const guideSrc = process.env.GUIDE_SRC
  ? resolve(process.env.GUIDE_SRC)
  : resolve(__dirname, '../../songscribe-offline-muse/docs/website-guide');

// Mirrors docs/website-guide/README.md "Pages and URLs". New page? Add its slug here.
export const GROUPS = [
  { name: 'Start here', slugs: ['quick-start'] },
  { name: 'Songs', slugs: ['songs-and-folders', 'import-songs'] },
  { name: 'Writing', slugs: ['lyrics-and-sections', 'add-chords', 'chord-shapes', 'key-capo-tuning'] },
  { name: 'Recording', slugs: ['record-a-take', 'listen-back', 'trim-and-crop', 'layers'] },
  { name: 'Tools', slugs: ['metronome', 'harmony', 'tuner'] },
  { name: 'Playing live', slugs: ['setlists-and-performance'] },
  { name: 'Sharing and setup', slugs: ['export', 'themes-and-settings', 'free-trial-lifetime', 'sync-and-faq'] },
];
const groupOf = (slug) => GROUPS.find((g) => g.slugs.includes(slug))?.name ?? 'Guide';

const BEZEL = '<img class="phone-frame__bezel" src="/assets/images/decor/iphone-17-pro-bezel.svg" width="720" height="1565" alt="">';
const ICONS = {
  tip: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.3 1 2.1h5c0-.8.4-1.6 1-2.1A6 6 0 0 0 12 3z"/></svg>',
  'heads-up': '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5v.01"/></svg>',
  lifetime: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>',
  star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>',
  play: '<svg class="icon-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
  pause: '<svg class="icon-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>',
};

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Tiny YAML subset: scalars, quoted strings, [a, b] arrays, trailing # comments.
export function parseFrontmatter(src) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) throw new Error('no frontmatter');
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const km = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
    if (!km) continue;
    const raw = km[2].replace(/\s+#.*$/, '').trim();
    if (raw.startsWith('[') && raw.endsWith(']')) {
      data[km[1]] = raw.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    } else if (/^-?\d+$/.test(raw)) {
      data[km[1]] = Number(raw);
    } else {
      data[km[1]] = raw.replace(/^(["'])(.*)\1$/, '$2');
    }
  }
  return { data, body: m[2] };
}

// Removes every HTML comment, which is how "held back" notes are written.
export const stripHtmlComments = (src) => src.replace(/<!--[\s\S]*?-->/g, '');

const CALLOUTS = { Tip: 'tip', 'Heads-up': 'heads-up', 'Heads up': 'heads-up', Lifetime: 'lifetime' };

export function transformCallouts(src) {
  return src.replace(
    /^> \*\*(Tip|Heads-up|Heads up|Lifetime):\*\*\s*(.+(?:\n>\s?.+)*)/gm,
    (_m, label, content) => {
      const kind = CALLOUTS[label];
      const text = content.split('\n').map((l) => l.replace(/^>\s?/, '')).join(' ').trim();
      const name = kind === 'heads-up' ? 'Heads-up' : label;
      return (
        `<div class="guide-callout guide-callout--${kind}" role="note">` +
        `<p class="guide-callout__head">${ICONS[kind]}${name}</p>` +
        `<p>${marked.parseInline(text)}</p></div>`
      );
    }
  );
}

function shotFigure(asset, twin, lazy) {
  const img = (a, cls) => {
    const base = `/assets/images/shots/guide/${a.id}`;
    return (
      `<img class="phone-frame__screen ${cls}" src="${base}-md.webp" ` +
      `srcset="${base}-sm.webp 480w, ${base}-md.webp 720w, ${base}-lg.webp 1080w" ` +
      `sizes="(max-width: 430px) 63vw, 268px" width="720" height="1565" ` +
      `alt="${escapeHtml(a.alt || asset.alt || '')}"${lazy ? ' loading="lazy"' : ''} decoding="async">`
    );
  };
  return (
    `<figure class="guide-shot">` +
    `<button type="button" class="phone-frame" aria-label="Enlarge screenshot: ${escapeHtml(asset.alt || '')}">` +
    img(asset, 'guide-shot__light') + (twin ? img(twin, 'guide-shot__dark') : '') + BEZEL +
    `</button><figcaption>${escapeHtml(asset.caption || '')}</figcaption></figure>`
  );
}

function clipFigure(asset) {
  const base = `/assets/video/guide/${asset.id}`;
  return (
    `<figure class="guide-clip"><div class="phone-frame">` +
    `<video class="phone-frame__screen" muted loop playsinline preload="none" poster="${base}.jpg" ` +
    `aria-label="${escapeHtml(asset.alt || asset.caption || '')}"><source src="${base}.mp4" type="video/mp4"></video>` +
    BEZEL +
    `<button class="guide-clip__toggle" type="button" aria-label="Play clip">${ICONS.play}${ICONS.pause}</button>` +
    `</div><figcaption>${escapeHtml(asset.caption || '')}</figcaption></figure>`
  );
}

export function substituteMarkers(src, slug, media) {
  let figures = 0;
  return src.replace(/\{\{\s*(shot|clip)\s*:\s*([A-Za-z0-9_-]+)\s*\}\}/g, (_m, kind, id) => {
    const asset = media.get(id);
    if (!asset) throw new Error(`[${slug}] unknown media id: ${id}`);
    if (asset.do_not_publish === true) throw new Error(`[${slug}] ${id} is do_not_publish`);
    if (asset.kind !== kind) throw new Error(`[${slug}] {{${kind}: ${id}}} points at a ${asset.kind}`);
    const lazy = figures++ > 0;
    return kind === 'shot' ? shotFigure(asset, media.get(asset.dark_twin), lazy) : clipFigure(asset);
  });
}

// Two or more back-to-back shots become one side-by-side row.
const SHOT = '<figure class="guide-shot">(?:(?!</figure>)[\\s\\S])*</figure>';
export function groupShotRows(html) {
  return html.replace(new RegExp(`${SHOT}(?:\\s*${SHOT})+`, 'g'), (run) => `<div class="guide-shot-row">${run}</div>`);
}

// CSS numbers steps with a counter; keep split lists counting from their start.
export const olStartToCounter = (html) =>
  html.replace(/<ol start="(\d+)">/g, (_m, n) => `<ol style="counter-reset: substep ${Number(n) - 1}">`);

function injectH2Ids(html) {
  const toc = [];
  const out = html.replace(/<h2>([\s\S]*?)<\/h2>/g, (_m, inner) => {
    const text = inner.replace(/<[^>]+>/g, '').trim();
    const id = text.toLowerCase().replace(/&[a-z#0-9]+;/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    toc.push({ id, text });
    return `<h2 id="${id}">${inner}</h2>`;
  });
  return { html: out, toc };
}

function lifetimeBadge(tier) {
  if (tier === 'lifetime') return `<span class="guide-lifetime-badge">${ICONS.star}Lifetime</span>`;
  if (tier === 'mixed') return `<span class="guide-lifetime-badge guide-lifetime-badge--mixed">${ICONS.star}Some steps need Lifetime</span>`;
  return '';
}

function renderSidenav(current, bySlug) {
  return GROUPS.map((g) => {
    const items = g.slugs
      .filter((s) => bySlug.has(s))
      .map((s) => `<li><a href="/guide/${s}/"${s === current ? ' aria-current="page"' : ''}>${escapeHtml(bySlug.get(s).data.title)}</a></li>`)
      .join('');
    return `<div class="guide-sidenav-group"><p class="guide-sidenav-group__label">${escapeHtml(g.name)}</p><ul class="guide-sidenav-group__list">${items}</ul></div>`;
  }).join('');
}

function renderPrevNext(prev, next) {
  const cell = (p, dir) =>
    p
      ? `<div class="guide-prevnext__cell${dir === 'next' ? ' guide-prevnext__cell--next' : ''}">` +
        `<span class="guide-prevnext__label">${dir === 'next' ? 'Next' : 'Previous'}</span>` +
        `<a href="/guide/${p.data.slug}/" rel="${dir}">${escapeHtml(p.data.title)}</a></div>`
      : '<div></div>';
  return `<nav class="guide-prevnext" aria-label="Previous and next pages">${cell(prev, 'prev')}${cell(next, 'next')}</nav>`;
}

// One HowToStep per "## Task" that has a numbered list.
function howToJsonLd(page) {
  const steps = [];
  for (const part of page.body.split(/\n(?=## )/)) {
    const m = part.match(/^## (.+?)\n([\s\S]*)/);
    if (!m || /^Related/i.test(m[1])) continue;
    const items = [...m[2].matchAll(/^\d+\.\s+(.+)$/gm)].map((x) => x[1].replace(/\*\*(.+?)\*\*/g, '$1').trim());
    if (items.length) steps.push({ '@type': 'HowToStep', name: m[1].trim(), text: items.join(' ') });
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: page.data.title,
    description: page.data.summary,
    totalTime: 'PT5M',
    tool: [{ '@type': 'HowToTool', name: 'SongScribe for iPhone and iPad' }],
    step: steps,
  };
}

function fill(tpl, vars) {
  return tpl.replace(/\{\{([A-Z_]+)\}\}/g, (_m, key) => {
    if (!(key in vars)) throw new Error(`template placeholder not provided: {{${key}}}`);
    return vars[key];
  });
}

export function renderPage(page, prev, next, bySlug, media, tpl) {
  const { slug, title, summary, tier } = page.data;
  let md = transformCallouts(stripHtmlComments(page.body));
  md = substituteMarkers(md, slug, media);

  const [intro, ...sections] = md.split(/\n(?=## )/);
  const relIdx = sections.findIndex((s) => /^## Related\b/.test(s));
  const related = relIdx >= 0 ? sections.splice(relIdx, 1)[0].replace(/^## Related\s*/, '') : '';
  const [lede, ...introRest] = intro.trim().split(/\n\s*\n/);

  const { html: body, toc } = injectH2Ids(
    olStartToCounter(groupShotRows(marked.parse(introRest.join('\n\n') + '\n\n' + sections.join('\n'))))
  );
  const tocHtml = toc.length
    ? `<nav aria-label="On this page"><details class="guide-toc" open><summary>On this page</summary><ul class="guide-toc__list">` +
      toc.map((h) => `<li><a href="#${h.id}">${escapeHtml(h.text)}</a></li>`).join('') +
      `</ul></details></nav>`
    : '';

  const html = fill(tpl, {
    TITLE: escapeHtml(title),
    DESCRIPTION: escapeHtml(summary || ''),
    SLUG: slug,
    GROUP: escapeHtml(groupOf(slug)),
    SIDENAV: renderSidenav(slug, bySlug),
    LIFETIME_BADGE: lifetimeBadge(tier),
    LEDE: marked.parseInline(lede),
    TOC: tocHtml,
    BODY: body,
    PREVNEXT: renderPrevNext(prev, next),
    RELATED: related
      ? `<section class="guide-related" aria-labelledby="related-h"><h2 id="related-h">Related</h2>${marked.parse(related)}</section>`
      : '',
  });
  const extra = slug === 'quick-start' ? `<script type="application/ld+json">${JSON.stringify(howToJsonLd(page))}</script>` : '';
  return html.replace('<!-- JSON-LD-EXTRA -->', extra);
}

export function renderIndex(bySlug, tpl) {
  const qs = bySlug.get('quick-start');
  const feature = qs
    ? `<a class="guide-index-feature" href="/guide/quick-start/"><span class="guide-index-feature__eyebrow">Start here</span>` +
      `<h2 class="guide-index-feature__title">${escapeHtml(qs.data.title)}</h2><p>${escapeHtml(qs.data.summary || '')}</p></a>`
    : '';
  const cards = GROUPS.filter((g) => g.name !== 'Start here')
    .map((g) => {
      const items = g.slugs
        .filter((s) => bySlug.has(s))
        .map((s) => {
          const d = bySlug.get(s).data;
          return `<li><a href="/guide/${s}/">${escapeHtml(d.title)}</a>${lifetimeBadge(d.tier)}<p>${escapeHtml(d.summary || '')}</p></li>`;
        })
        .join('');
      return `<section class="guide-index-card"><h2 class="guide-index-card__title">${escapeHtml(g.name)}</h2><ul class="guide-index-card__list">${items}</ul></section>`;
    })
    .join('');
  return fill(tpl, { FEATURE: feature, GRID: cards });
}

function main() {
  const pageTpl = readFileSync(resolve(__dirname, 'templates/guide-page.html'), 'utf8');
  const indexTpl = readFileSync(resolve(__dirname, 'templates/guide-index.html'), 'utf8');
  const media = new Map(
    JSON.parse(readFileSync(resolve(guideSrc, 'media/manifest.json'), 'utf8')).assets.map((a) => [a.id, a])
  );

  const contentDir = resolve(guideSrc, 'content');
  const pages = readdirSync(contentDir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const page = parseFrontmatter(readFileSync(resolve(contentDir, f), 'utf8'));
      if (!page.data.slug || typeof page.data.order !== 'number') throw new Error(`${f}: needs slug and order`);
      return page;
    })
    .sort((a, b) => a.data.order - b.data.order);
  const bySlug = new Map(pages.map((p) => [p.data.slug, p]));

  for (const p of pages) {
    if (!GROUPS.some((g) => g.slugs.includes(p.data.slug))) {
      throw new Error(`slug "${p.data.slug}" is not in GROUPS in scripts/build-guide.mjs`);
    }
  }

  const outDir = resolve(repoRoot, 'guide');
  pages.forEach((p, i) => {
    const dir = join(outDir, p.data.slug);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), renderPage(p, pages[i - 1], pages[i + 1], bySlug, media, pageTpl));
  });
  writeFileSync(join(outDir, 'index.html'), renderIndex(bySlug, indexTpl));
  console.log(`Wrote guide/index.html and ${pages.length} pages.`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
