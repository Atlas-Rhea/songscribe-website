#!/usr/bin/env node
// Copies guide clip videos and their JPG posters from the docs source into
// public/assets/video/guide/. Idempotent: skips files that already match in
// size. Honors do_not_publish on the docs manifest.
//
// GUIDE_SRC env var overrides the default docs path.

import {
  readFileSync,
  existsSync,
  mkdirSync,
  copyFileSync,
  statSync,
} from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

const guideSrc = process.env.GUIDE_SRC
  ? resolve(process.env.GUIDE_SRC)
  : resolve(__dirname, '../../songscribe-offline-muse/docs/website-guide');

const outDir = resolve(repoRoot, 'public/assets/video/guide');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const docs = JSON.parse(
  readFileSync(resolve(guideSrc, 'media/manifest.json'), 'utf8')
);

let copied = 0;
let skipped = 0;
let missing = 0;

function copyIfChanged(src, dest) {
  if (!existsSync(src)) {
    console.warn(`[miss] ${src}`);
    missing++;
    return;
  }
  if (existsSync(dest) && statSync(src).size === statSync(dest).size) {
    skipped++;
    return;
  }
  copyFileSync(src, dest);
  console.log(`[ok]   ${basename(dest)}`);
  copied++;
}

for (const a of docs.assets) {
  if (a.kind !== 'clip') continue;
  if (a.do_not_publish === true) continue;

  const mp4Src = resolve(guideSrc, a.file);
  const mp4Dest = resolve(outDir, `${a.id}.mp4`);
  copyIfChanged(mp4Src, mp4Dest);

  // Poster: prefer explicit `poster` field, otherwise same stem with .jpg.
  const posterRel = a.poster || a.file.replace(/\.mp4$/i, '.jpg');
  const posterSrc = resolve(guideSrc, posterRel);
  const posterDest = resolve(outDir, `${a.id}.jpg`);
  copyIfChanged(posterSrc, posterDest);
}

console.log(`\nDone. Copied ${copied}, skipped ${skipped}, missing ${missing}.`);
if (missing > 0) process.exit(1);
