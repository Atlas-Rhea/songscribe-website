/**
 * One-off iOS-26-aesthetic wallpaper generator for SongScribe Tuner marketing — iPad 3:4.
 *
 * Generates 3 abstract, non-infringing wallpaper variants via Hedra Nano Banana
 * Pro T2I at 3:4 portrait, writes them to a configured output dir. Original
 * compositions — intentionally unlike Apple's stock iPadOS 26 wallpapers.
 *
 * Run:  npx tsx src/generate-wallpaper-ipad.ts
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { config as loadDotenv } from 'dotenv';
import { HedraClient } from './hedra-client.ts';
import { resolveModelId } from './model-resolver.ts';

loadDotenv({ path: resolve(import.meta.dirname, '..', '.env.local') });

const OUT_DIR =
  '/Users/Atlas/Projects/SongScribe Media/app-screenshots/tuner/wallpapers';

const MODEL_SLUG = 'nano-banana-pro-t2i';
const SIZE = '2880x3840'; // 3:4 portrait iPad, 4K long edge
const NEGATIVE = [
  'text',
  'logo',
  'watermark',
  'UI elements',
  'app icons',
  'tuner',
  'needle',
  'recognizable products',
  'Apple iOS wallpaper',
  'iPhone screenshot',
  'any trademarked imagery',
  'photograph of real objects',
  'faces',
  'readable words',
].join(', ');

const STYLE_BASE = [
  'Portrait 3:4 iPad wallpaper composition.',
  'Photographic 3D still-life aesthetic of two or three LARGE overlapping translucent',
  'frosted-glass discs arranged in the frame — like enormous sea-glass lenses stacked',
  'and overlapping at different depths. Each disc has a matte slightly granulated',
  'stone-like surface (soft concrete / frosted glass / fine plaster texture) with',
  'gentle surface imperfections, faint color depth reading through the translucency,',
  'and soft shadow bands where the discs overlap.',
  'Discs are cropped by the frame — only portions of each large circle are visible,',
  'composed for visual rhythm, not centered.',
  'Studio lighting: soft diffuse key from upper-left casting gentle falloff shadows,',
  'subtle ambient occlusion where surfaces meet, crisp-but-soft edge highlights on',
  'each disc rim.',
  'Between and partly overlaying the discs: small floating translucent 3D music notes',
  '(quarter notes, eighth notes with beams, a treble clef) rendered in the same',
  'frosted-glass material — they sit at varied depths, some in front of discs, some',
  'tucked behind, scattered naturally across the composition with a light musical',
  'rhythm. Music notes are clearly recognizable but stylized and glassy, never cartoonish.',
  'High-quality photographic 3D render, cinema color grading, high dynamic range,',
  'shallow depth-of-field feel, natural soft shadows.',
  'Original composition — not referencing any specific commercial mobile OS wallpaper.',
  `Negative: ${NEGATIVE}.`,
].join(' ');

const VARIANTS: Array<{ id: string; seed: number; prompt: string }> = [
  {
    id: 'wallpaper-01-parchment-amber-ipad',
    seed: 581273,
    prompt: [
      STYLE_BASE,
      'COLOR PALETTE — SongScribe warm parchment theme:',
      'background base: warm cream parchment (ivory / pale sand, hex ~#F4E9D4).',
      'Large disc one: deep burnt amber / warm orange with matte stone texture.',
      'Large disc two: soft chocolate sepia brown, slightly darker, overlapping',
      'the amber disc from a different angle.',
      'Optional third accent: a smaller pale gold disc tucked behind.',
      'Music notes: translucent frosted amber-tinted glass — warm glowing ornaments.',
      'Overall feel: warm, editorial, musician-studio dawn light, hand-made and',
      'tactile. Parchment palette throughout — absolutely no blue, no teal, no purple.',
    ].join(' '),
  },
  {
    id: 'wallpaper-02-midnight-amber-ipad',
    seed: 829104,
    prompt: [
      STYLE_BASE,
      'COLOR PALETTE — SongScribe midnight jazz theme:',
      'background base: deep midnight charcoal with subtle warm undertone',
      '(hex ~#18110B), not pure black.',
      'Large disc one: vivid saturated burnt amber glowing against the dark ground.',
      'Large disc two: deep oxblood / cognac brown, slightly transparent, overlapping',
      'the amber disc.',
      'Optional third accent: a smaller soft cream disc acting as a highlight.',
      'Music notes: translucent warm-amber frosted glass — they read like lit',
      'stained-glass ornaments against the dark ground.',
      'Overall feel: late-night candlelit studio, intimate, warm glow. No cool',
      'colors — no blue, no teal, no green.',
    ].join(' '),
  },
  {
    id: 'wallpaper-03-parchment-teal-ipad',
    seed: 415042,
    prompt: [
      STYLE_BASE,
      'COLOR PALETTE — SongScribe parchment with teal accent:',
      'background base: warm cream parchment (ivory, hex ~#F4E9D4).',
      'Large disc one: muted desaturated sea-glass teal with matte stone texture.',
      'Large disc two: burnt amber, slightly warmer, overlapping the teal disc.',
      'Optional third accent: a smaller soft cream or pale gold disc tucked behind.',
      'Music notes: translucent frosted amber glass notes, warm against the teal,',
      'reading as glass ornaments.',
      'Overall feel: duotone editorial musician aesthetic — warm amber meeting',
      'calm teal on warm cream. Balanced, calm, refined.',
    ].join(' '),
  },
];

async function main(): Promise<void> {
  const apiKey = process.env.HEDRA_API_KEY;
  if (!apiKey || apiKey === 'replace-me-with-your-real-key') {
    throw new Error('HEDRA_API_KEY missing — set it in scripts/washes/.env.local');
  }

  await mkdir(OUT_DIR, { recursive: true });

  const client = new HedraClient({ apiKey, maxPolls: 600 });
  const models = await client.listModels();
  const modelId = resolveModelId(MODEL_SLUG, models);
  console.log(`Using model "${MODEL_SLUG}" → ${modelId}`);
  console.log(`Generating ${VARIANTS.length} wallpaper variants at ${SIZE}…\n`);

  for (const variant of VARIANTS) {
    console.log(`→ ${variant.id} (seed ${variant.seed})`);
    const img = await client.generateImage({
      prompt: variant.prompt,
      modelId,
      size: SIZE,
      seed: variant.seed,
    });
    const outPath = join(OUT_DIR, `${variant.id}.png`);
    await writeFile(outPath, img.bytes);
    console.log(`   saved ${outPath} (${(img.bytes.length / 1024).toFixed(0)} KB)\n`);
  }

  console.log(`Done. Wallpapers saved to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
