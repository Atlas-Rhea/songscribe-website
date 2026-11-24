#!/usr/bin/env node
// One-off: crops the printed lead sheet out of the guide's PDF-preview phone
// shot for the homepage Export section. Not wired into any npm script; re-run
// by hand (node scripts/crop-export-sheet.mjs) when exp-03-pdf-musician.png changes.
// Source: $GUIDE_SRC or ../songscribe-offline-muse/docs/website-guide

import { mkdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const guideSrc = process.env.GUIDE_SRC
  ? resolve(process.env.GUIDE_SRC)
  : resolve(__dirname, '../../songscribe-offline-muse/docs/website-guide');

const SOURCE = join(guideSrc, 'media/shots/exp-03-pdf-musician.png');
const OUT_DIR = join(repoRoot, 'public/assets/images/shots');

// Inside the white sheet's edges; ends below Verse 2 because the preview cuts off mid-Bridge.
const CROP = { left: 20, top: 485, width: 1166, height: 855 };
const WIDTHS = { sm: 600, md: 900, lg: CROP.width };

mkdirSync(OUT_DIR, { recursive: true });
for (const [suffix, width] of Object.entries(WIDTHS)) {
  const out = join(OUT_DIR, `export-sheet-${suffix}.webp`);
  const info = await sharp(SOURCE)
    .extract(CROP)
    .resize({ width })
    .webp({ quality: 90 })
    .toFile(out);
  console.log(`[ok] export-sheet-${suffix}.webp ${info.width}x${info.height} ${info.size}B`);
}
