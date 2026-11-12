#!/usr/bin/env node
// Process raw PNG screenshots into webp derivatives at multiple widths.
// Optionally bakes Apple-style squircle corners (transparent alpha) so the
// image tucks perfectly inside a bezel cutout without relying on CSS
// border-radius, which only produces elliptical - not squircular - corners.
// Idempotent: skips slugs whose outputs already exist (use --force to rebuild).
//
// CLI flags:
//   --manifest <path>   Manifest JSON to read (default: ./screenshots.manifest.json)
//   --out-dir <path>    Override manifest's outputDir (resolved from repo root)
//   --force             Rebuild even if outputs exist

import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

function getFlag(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : null;
}

const force = process.argv.includes('--force');
const manifestArg = getFlag('--manifest');
const outDirArg = getFlag('--out-dir');

const manifestPath = manifestArg
  ? resolve(process.cwd(), manifestArg)
  : resolve(__dirname, 'screenshots.manifest.json');

if (!existsSync(manifestPath)) {
  console.error(`[error] manifest not found: ${manifestPath}`);
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

const outputDir = outDirArg
  ? resolve(repoRoot, outDirArg)
  : resolve(repoRoot, manifest.outputDir);
if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

const squircle = manifest.squircle?.enabled ? manifest.squircle : null;

// The bezel SVG's corner arc is slightly elliptical in display pixels
// (measured ~65 x 62 at 420px phone width), so we need rx != ry. Both
// radii are expressed as fractions of image WIDTH for consistency.
function buildRoundedRectMask(width, height) {
  const rx = Math.round(width * squircle.cornerRadiusXPct);
  const ry = Math.round(width * squircle.cornerRadiusYPct);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect x="0" y="0" width="${width}" height="${height}" rx="${rx}" ry="${ry}" fill="#fff"/></svg>`
  );
}

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

    const resized = sharp(src).resize({ width, withoutEnlargement: true });

    if (squircle) {
      const { width: w, height: h } = await resized
        .clone()
        .toBuffer({ resolveWithObject: true })
        .then(({ info }) => info);
      const maskSvg = buildRoundedRectMask(w, h);
      await resized
        .composite([{ input: maskSvg, blend: 'dest-in' }])
        .webp({ quality: manifest.quality, alphaQuality: manifest.quality })
        .toFile(out);
    } else {
      await resized.webp({ quality: manifest.quality }).toFile(out);
    }

    console.log(`[ok]   ${shot.slug}-${suffix}.webp`);
    processed++;
  }
}

console.log(`\nDone. Processed ${processed}, skipped ${skipped}.`);
