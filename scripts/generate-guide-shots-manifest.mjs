#!/usr/bin/env node
// Derives scripts/screenshots.guide.manifest.json from the docs manifest
// at docs/website-guide/media/manifest.json. Includes every shot that is
// not marked do_not_publish; skips clips. Preserves the homepage's squircle
// settings so the guide shots get the same bezel-matched corner mask.
//
// Run manually when docs/website-guide/media/manifest.json changes, or as
// part of `npm run build:guide:shots` (which runs it first).
//
// GUIDE_SRC env var overrides the default docs path.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const guideSrc = process.env.GUIDE_SRC
  ? resolve(process.env.GUIDE_SRC)
  : resolve(__dirname, '../../songscribe-offline-muse/docs/website-guide');

const srcManifest = resolve(guideSrc, 'media/manifest.json');
if (!existsSync(srcManifest)) {
  console.error(`[error] docs manifest not found: ${srcManifest}`);
  process.exit(1);
}

const docs = JSON.parse(readFileSync(srcManifest, 'utf8'));

const homepage = JSON.parse(
  readFileSync(resolve(__dirname, 'screenshots.manifest.json'), 'utf8')
);

const darkTwins = new Set(docs.assets.map((a) => a.dark_twin).filter(Boolean));
const shots = docs.assets
  .filter((a) => a.kind === 'shot' && a.do_not_publish !== true)
  .filter((a) => a.unused !== true || darkTwins.has(a.id))
  .map((a) => ({ slug: a.id, source: a.file }));

const out = {
  sourceRoot: guideSrc,
  outputDir: 'public/assets/images/shots/guide',
  widths: [480, 720, 1080],
  quality: 85,
  squircle: homepage.squircle,
  shots,
};

const outPath = resolve(__dirname, 'screenshots.guide.manifest.json');
writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');
console.log(`[ok] wrote ${outPath} (${shots.length} shots)`);
