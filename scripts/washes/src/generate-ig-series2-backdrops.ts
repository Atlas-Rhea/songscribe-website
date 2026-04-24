/**
 * Instagram Series 2 backdrop generator (SongScribe Marketing).
 *
 * Produces 3 continuous 2160×1350 watercolor-wash backdrops via Hedra Nano
 * Banana Pro T2I. Each backdrop is designed to be sliced in half → two
 * 1080×1350 slides that read as a continuous composition when swiped.
 *
 * Output: /Users/Atlas/Projects/SongScribe Media/social/backdrops/series2/
 *   variant-{a|b|c}.raw.png       (full 2160×1350, from Hedra)
 *   variant-{a|b|c}-slide-1.png   (left half, x=0–1079)
 *   variant-{a|b|c}-slide-2.png   (right half, x=1080–2159)
 *
 * Run:  npx tsx src/generate-ig-series2-backdrops.ts
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { config as loadDotenv } from 'dotenv';
import sharp from 'sharp';
import { HedraClient } from './hedra-client.ts';
import { resolveModelId } from './model-resolver.ts';

loadDotenv({ path: resolve(import.meta.dirname, '..', '.env.local') });

const OUT_DIR =
  '/Users/Atlas/Projects/SongScribe Media/social/backdrops/series2';

const MODEL_SLUG = 'nano-banana-pro-t2i';
// 3:2 is a reliable Hedra-supported aspect; we'll sharp-cover to 2160×1350 after.
const HEDRA_SIZE = '2160x1440';
const FINAL_WIDTH = 2160;
const FINAL_HEIGHT = 1350;
const SLIDE_WIDTH = 1080;

const NEGATIVE = [
  'text',
  'borders',
  'frame',
  'subject',
  'object',
  'geometry',
  'sharp lines',
  'digital gradient',
  'vignette',
  'photograph',
  '3D render',
  'typography',
  'writing',
  'letters',
].join(', ');

const BASE_PROMPT = [
  'A wide continuous watercolor backdrop painting on warm cream parchment paper',
  '(ivory/sand, exactly hex #F0EBE6). Wide 8:5 aspect — significantly wider than',
  'tall. Paper-fiber texture visible across the entire surface with soft',
  'granulation. Hand-painted, editorial, unhurried, high-resolution scan',
  'aesthetic. Soft torn feathered pigment edges. Natural watercolor backruns,',
  'cauliflower blooms, and pigment pooling. No subject, no text, no frame, no',
  'borders, no geometry, no objects, no photograph, no vignette, no digital',
  'gradient. Center of the composition is calm and predominantly clean',
  'parchment — pigment concentrates at corners/edges only.',
].join(' ');

const VARIANTS: Array<{ id: string; seed: number; prompt: string }> = [
  {
    id: 'variant-a-cool-morning',
    seed: 104713,
    prompt: [
      BASE_PROMPT,
      'COMPOSITION — "Cool Morning":',
      'A single muted desaturated teal watercolor wash anchored DEEPLY in the',
      'TOP-LEFT corner of the image, with saturated pigment running PAST the',
      'top edge and PAST the left edge of the image — the image boundary cuts',
      'through the heart of the saturated pigment along the top and left edges.',
      'NO tapered watercolor edge, NO feathered fade along top or left — those',
      'two edges are entirely inside saturated teal pigment. The wash feathers',
      'only on its inward-facing sides (bottom and right), where it transitions',
      'into clean parchment toward the center. Wash occupies roughly the',
      'upper-left quarter of the canvas.',
      'A second burnt-orange / amber watercolor wash anchored DEEPLY in the',
      'BOTTOM-RIGHT corner of the image. Same rule: saturated pigment runs PAST',
      'the bottom edge and PAST the right edge, NO taper along those edges.',
      'Feathers only on its inward top-and-left sides toward the center. Wash',
      'occupies roughly the lower-right quarter of the canvas.',
      'A small subtle teal echo splash — a secondary drift of pale teal pigment',
      'around the upper-right area (~75% width, ~20% height), roughly 180 px',
      'wide, fading gently into parchment.',
      'The CENTER HORIZONTAL BAND of the composition — the middle 40% — is',
      'untouched clean parchment, showing only paper fiber texture.',
      'Overall mood: bright, optimistic, dawn-light on parchment. Balanced',
      'diagonal tension between cool top-left and warm bottom-right.',
    ].join(' '),
  },
  {
    id: 'variant-b-warm-evening',
    seed: 273819,
    prompt: [
      BASE_PROMPT,
      'COMPOSITION — "Warm Evening":',
      'A single large burnt-orange blending into amber watercolor wash anchored',
      'DEEPLY in the TOP-LEFT corner of the image, with saturated pigment',
      'running PAST the top edge and PAST the left edge of the image — the',
      'image boundary cuts through saturated pigment along the top and left',
      'edges. NO taper, NO feathered fade on top or left edges. The wash',
      'feathers only on its inward bottom and right sides toward the center.',
      'Wash occupies roughly the upper-left third of the canvas.',
      'A second smaller muted desaturated teal watercolor wash anchored in the',
      'BOTTOM-RIGHT corner, saturated pigment running PAST the bottom-and-right',
      'edges, NO taper on those edges, feathers only on its inward top-and-left',
      'sides. Wash occupies roughly the lower-right fifth of the canvas (smaller',
      'than the orange).',
      'A small subtle orange echo — a secondary dilute amber tint around the',
      'lower-left-center area (~30% width, ~70% height), roughly 200 px wide,',
      'barely visible, warm undertone.',
      'The MIDDLE of the composition is clean parchment.',
      'Overall mood: warm, intimate, evening light on parchment. Dominant warm',
      'palette with a quiet cool accent.',
    ].join(' '),
  },
  {
    id: 'variant-c-split-mood',
    seed: 419205,
    prompt: [
      BASE_PROMPT,
      'COMPOSITION — "Split Mood":',
      'A single burnt-orange blending into amber watercolor wash anchored',
      'DEEPLY in the BOTTOM-LEFT corner of the image, with saturated pigment',
      'running PAST the bottom edge and PAST the left edge of the image — the',
      'image boundary cuts through saturated pigment along those two edges. NO',
      'taper, NO feathered fade along bottom or left. The wash feathers only on',
      'its inward top and right sides. Wash occupies roughly the lower-left',
      'third of the canvas.',
      'A single muted desaturated teal watercolor wash anchored DEEPLY in the',
      'TOP-RIGHT corner of the image, saturated pigment running PAST the top',
      'edge and PAST the right edge, NO taper on those edges, feathers only on',
      'its inward bottom and left sides. Wash occupies roughly the upper-right',
      'third of the canvas.',
      'The remaining diagonal band from upper-left through center to lower-right',
      'is clean parchment, showing only paper fiber texture.',
      'Strong diagonal tension — the composition reads asymmetric, with warm',
      'pigment in the bottom-left and cool pigment in the top-right, separated',
      'by a wide diagonal band of clean parchment between them.',
      'Overall mood: contrast, asymmetric. The left half of the image reads',
      'warm (orange-anchored), the right half reads cool (teal-anchored),',
      'meeting at a diagonal parchment seam.',
    ].join(' '),
  },
];

async function main(): Promise<void> {
  const apiKey = process.env.HEDRA_API_KEY;
  if (!apiKey || apiKey === 'replace-me-with-your-real-key') {
    throw new Error('HEDRA_API_KEY missing — set it in scripts/washes/.env.local');
  }

  await mkdir(OUT_DIR, { recursive: true });

  const client = new HedraClient({ apiKey });
  const models = await client.listModels();
  const modelId = resolveModelId(MODEL_SLUG, models);
  console.log(`Using model "${MODEL_SLUG}" → ${modelId}`);
  console.log(`Generating ${VARIANTS.length} backdrops at ${HEDRA_SIZE}, then slicing to ${FINAL_WIDTH}×${FINAL_HEIGHT}…\n`);

  for (const variant of VARIANTS) {
    console.log(`→ ${variant.id} (seed ${variant.seed})`);
    console.log(`   prompt: "${variant.prompt.slice(0, 120)}…"`);

    const img = await client.generateImage({
      prompt: `${variant.prompt} Negative: ${NEGATIVE}.`,
      modelId,
      size: HEDRA_SIZE,
      seed: variant.seed,
    });

    const rawPath = join(OUT_DIR, `${variant.id}.raw.png`);
    await writeFile(rawPath, img.bytes);
    console.log(`   saved raw ${rawPath} (${(img.bytes.length / 1024).toFixed(0)} KB)`);

    // Sharp pipeline: resize-cover to exact 2160×1350, then slice in half.
    const covered = await sharp(img.bytes)
      .resize({ width: FINAL_WIDTH, height: FINAL_HEIGHT, fit: 'cover', position: 'center' })
      .png()
      .toBuffer();

    const fullPath = join(OUT_DIR, `${variant.id}.png`);
    await writeFile(fullPath, covered);
    console.log(`   saved full ${fullPath}`);

    const slide1 = await sharp(covered)
      .extract({ left: 0, top: 0, width: SLIDE_WIDTH, height: FINAL_HEIGHT })
      .png()
      .toBuffer();
    const slide1Path = join(OUT_DIR, `${variant.id}-slide-1.png`);
    await writeFile(slide1Path, slide1);
    console.log(`   saved slide-1 ${slide1Path}`);

    const slide2 = await sharp(covered)
      .extract({ left: SLIDE_WIDTH, top: 0, width: SLIDE_WIDTH, height: FINAL_HEIGHT })
      .png()
      .toBuffer();
    const slide2Path = join(OUT_DIR, `${variant.id}-slide-2.png`);
    await writeFile(slide2Path, slide2);
    console.log(`   saved slide-2 ${slide2Path}\n`);
  }

  console.log(`Done. Backdrops saved to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
