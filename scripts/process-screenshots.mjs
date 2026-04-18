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
