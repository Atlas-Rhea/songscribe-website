import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { config as loadDotenv } from 'dotenv';
import { compilePrompt } from './compile-prompt.ts';
import { fingerprint } from './hash.ts';
import { loadLockfile, saveLockfile, shouldSkip, upsertEntry } from './lockfile.ts';
import { renderTable, type PlannedAction } from './cli-table.ts';
import { HedraClient, type HedraModel } from './hedra-client.ts';
import { resolveModelId } from './model-resolver.ts';
import { cwebp, rembg, assertBinary } from './post-process.ts';
import { extractFrames, cleanupTmp } from './extract-frames.ts';
import type { CliOptions } from './cli-args.ts';
import type { Manifest, ManifestSection, LockEntry, Lockfile } from './types.ts';

loadDotenv({ path: resolve(import.meta.dirname, '..', '.env.local') });

const ROOT = resolve(import.meta.dirname, '..', '..', '..');
const MANIFEST = resolve(ROOT, 'scripts/washes/manifest.json');
const LOCK = resolve(ROOT, 'scripts/washes/washes.lock.json');
const WASH_DIR = resolve(ROOT, 'public/assets/decor/washes');
const MOTION_DIR = resolve(ROOT, 'public/assets/decor/motion');
const TMP = resolve(ROOT, 'scripts/washes/tmp');

const STILL_COST_USD = 0.03;
const MOTION_COST_USD = 0.50;
const MOTION_FRAME_WIDTH = 1200;
const VIDEO_RESOLUTION: '540p' = '540p';

export async function generate(opts: CliOptions): Promise<void> {
  const manifest = JSON.parse(await readFile(MANIFEST, 'utf8')) as Manifest;
  const lock = await loadLockfile(LOCK);

  const sections = filterSections(manifest.sections, opts.only);
  const plan = buildPlan(sections, manifest, lock, opts);

  const estCost = plan.reduce(
    (sum, a) => sum + (a.status === 'REGEN' ? (a.kind === 'still' ? STILL_COST_USD : MOTION_COST_USD) : 0),
    0,
  );
  console.log(renderTable(plan, estCost));

  if (opts.estimate) return;
  if (plan.every((a) => a.status === 'SKIP')) return;

  if (!opts.yes) {
    const rl = createInterface({ input: stdin, output: stdout });
    const answer = await rl.question('\nContinue? [y/N] ');
    rl.close();
    if (answer.trim().toLowerCase() !== 'y') {
      console.log('Aborted.');
      return;
    }
  }

  const apiKey = process.env.HEDRA_API_KEY;
  if (!apiKey) {
    throw new Error('HEDRA_API_KEY missing. Copy .env.local.example to .env.local and fill it in.');
  }
  await assertBinary('cwebp');
  if (plan.some((a) => a.kind === 'motion' && a.status === 'REGEN')) {
    await assertBinary('ffmpeg');
  }

  const client = new HedraClient({ apiKey });
  const models = await client.listModels();
  const imageModelId = resolveModelId(manifest.global.model, models);

  let nextLock = lock;

  for (const section of sections) {
    const prompt = compilePrompt(section, manifest.global);
    const seed = section.seed ?? Math.floor(Math.random() * 1_000_000);
    const hash = fingerprint({
      prompt,
      seed,
      model: manifest.global.model,
      size: manifest.global.size,
    });

    let entry: LockEntry | null = nextLock.entries[section.id] ?? null;

    if (!opts.motionOnly && !shouldSkip(nextLock, section.id, hash, opts.force)) {
      entry = await regenStill({
        client, manifest, section, prompt, seed, hash, opts, imageModelId,
      });
      nextLock = upsertEntry(nextLock, entry);
      await saveLockfile(LOCK, nextLock);
    }

    if (!opts.stillsOnly && section.motion?.enabled && entry) {
      const motionEntry = await regenMotion({
        client, section, stillRawPath: entry.rawPath, models, size: manifest.global.size,
      });
      const merged: LockEntry = { ...entry, motion: motionEntry };
      nextLock = upsertEntry(nextLock, merged);
      await saveLockfile(LOCK, nextLock);
    }
  }

  console.log('\nDone.');
}

function filterSections(all: ManifestSection[], only: string[] | null): ManifestSection[] {
  if (!only) return all;
  return all.filter((s) => only.includes(s.id));
}

function buildPlan(
  sections: ManifestSection[],
  manifest: Manifest,
  lock: Lockfile,
  opts: CliOptions,
): PlannedAction[] {
  const plan: PlannedAction[] = [];
  for (const section of sections) {
    const prompt = compilePrompt(section, manifest.global);
    const seed = section.seed ?? 0;
    const hash = fingerprint({
      prompt,
      seed,
      model: manifest.global.model,
      size: manifest.global.size,
    });
    const stillSkipped = shouldSkip(lock, section.id, hash, opts.force);
    if (!opts.motionOnly) {
      plan.push({
        id: section.id,
        kind: 'still',
        status: stillSkipped ? 'SKIP' : 'REGEN',
        prompt,
      });
    }
    if (section.motion?.enabled && !opts.stillsOnly) {
      plan.push({
        id: section.id,
        kind: 'motion',
        status: stillSkipped && !opts.force ? 'SKIP' : 'REGEN',
        prompt: `${section.motion.duration}s ${section.motion.direction}, ${section.motion.frames} frames`,
      });
    }
  }
  return plan;
}

async function regenStill(args: {
  client: HedraClient;
  manifest: Manifest;
  section: ManifestSection;
  prompt: string;
  seed: number;
  hash: string;
  opts: CliOptions;
  imageModelId: string;
}): Promise<LockEntry> {
  const { client, manifest, section, prompt, seed, hash, opts, imageModelId } = args;
  console.log(`\n→ ${section.id}: generating still…`);

  const img = await client.generateImage({
    prompt,
    modelId: imageModelId,
    size: manifest.global.size,
    seed,
  });

  await mkdir(WASH_DIR, { recursive: true });
  const rawPath = join(WASH_DIR, `${section.id}.raw.png`);
  const webpPath = join(WASH_DIR, `${section.id}.webp`);
  const alphaPath = join(WASH_DIR, `${section.id}.a.webp`);
  const alphaTmpPath = join(TMP, `${section.id}.a.png`);

  await writeFile(rawPath, img.bytes);
  await cwebp(rawPath, webpPath, { quality: 82, alphaQuality: 90, method: 6 });

  let alphaWebpPath: string | null = null;
  if (!opts.noAlpha) {
    try {
      await mkdir(TMP, { recursive: true });
      await rembg(rawPath, alphaTmpPath);
      await cwebp(alphaTmpPath, alphaPath, { quality: 82, alphaQuality: 90, method: 6 });
      alphaWebpPath = toRelative(alphaPath);
    } catch (err) {
      console.warn(`  (alpha skipped for ${section.id}: ${(err as Error).message})`);
    }
  }

  return {
    id: section.id,
    prompt,
    seed,
    model: manifest.global.model,
    size: manifest.global.size,
    hash,
    rawPath: toRelative(rawPath),
    webpPath: toRelative(webpPath),
    alphaWebpPath,
    motion: null,
    updatedAt: new Date().toISOString(),
  };
}

async function regenMotion(args: {
  client: HedraClient;
  section: ManifestSection;
  stillRawPath: string;
  models: HedraModel[];
  size: string;
}): Promise<LockEntry['motion']> {
  const { client, section, stillRawPath, models, size } = args;
  const motion = section.motion!;
  console.log(`\n→ ${section.id}: generating ${motion.duration}s motion…`);

  const videoModelId = resolveModelId(motion.videoModel, models);
  const imageBytes = new Uint8Array(await readFile(resolve(ROOT, stillRawPath)));
  const vid = await client.animateImage({
    imageBytes,
    imageName: `${section.id}-still.png`,
    prompt: motion.videoPrompt,
    modelId: videoModelId,
    size,
    resolution: VIDEO_RESOLUTION,
    durationSeconds: motion.duration,
    seed: section.seed ?? 0,
  });

  const outDir = join(MOTION_DIR, section.id);
  const tmpDir = join(TMP, `frames-${section.id}`);
  const pngFrames = await extractFrames({
    videoBytes: vid.bytes,
    outputDir: outDir,
    fps: motion.frames / motion.duration,
    width: MOTION_FRAME_WIDTH,
    tmpDir,
  });

  for (let i = 0; i < pngFrames.length; i++) {
    const out = join(outDir, `${String(i + 1).padStart(3, '0')}.webp`);
    await cwebp(pngFrames[i]!, out, { quality: 78, method: 6 });
  }
  if (pngFrames.length > 0) {
    await cwebp(pngFrames[pngFrames.length - 1]!, join(outDir, 'poster.webp'), {
      quality: 85,
      method: 6,
    });
  }
  await cleanupTmp(tmpDir);

  const motionHash = fingerprint({
    prompt: motion.videoPrompt,
    seed: motion.frames,
    model: motion.videoModel,
    size: `${motion.duration}s`,
  });
  return { frames: pngFrames.length, duration: motion.duration, hash: motionHash };
}

function toRelative(abs: string): string {
  return abs.slice(ROOT.length + 1);
}
