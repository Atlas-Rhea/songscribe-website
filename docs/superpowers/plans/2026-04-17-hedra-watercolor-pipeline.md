# Hedra Watercolor Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a build-time CLI that calls Hedra to generate one watercolor wash per section (×10) plus a 6-second hero motion sequence, with scroll-scrubbed canvas runtime and CSS scroll-driven decor.

**Architecture:** A local Node+TypeScript CLI in `scripts/washes/` reads a `manifest.json`, calls Hedra's image and image-to-video endpoints, post-processes output with `cwebp` / `rembg` / `ffmpeg`, and writes committed assets into `public/assets/decor/`. A lockfile (`washes.lock.json`) makes runs reproducible and skippable. The shipped site renders stills as `<img>` with `mix-blend-mode: multiply`, and the hero wash plays through a `<canvas>` element that advances frames off a CSS-driven `--p` custom property via `animation-timeline: view()`.

**Tech Stack:** Node 20 + TypeScript (scripts), `tsx` for direct .ts execution (no build step), `node:test` for unit tests, vanilla JS runtime (matches existing `src/main.js` style), Hedra API (`@hedra-labs/hedra-node` or direct `fetch`), `cwebp`, `rembg` (Python CLI), `ffmpeg`.

---

## File Structure

### New files (created by this plan)

- `scripts/washes/package.json` — scoped deps (tsx, node-fetch or undici, dotenv)
- `scripts/washes/tsconfig.json` — strict TS config, ESM module
- `scripts/washes/.gitignore` — node_modules, tmp, __pycache__
- `scripts/washes/README.md` — how to run the CLI
- `scripts/washes/requirements.txt` — rembg pin
- `scripts/washes/manifest.json` — section definitions (source of truth)
- `scripts/washes/washes.lock.json` — reproducibility fingerprint (generated)
- `scripts/washes/src/types.ts` — shared manifest + lockfile shapes
- `scripts/washes/src/compile-prompt.ts` — pure: template slot filling
- `scripts/washes/src/hash.ts` — pure: content hash for lockfile entries
- `scripts/washes/src/lockfile.ts` — pure: load / save / lookup
- `scripts/washes/src/cli-args.ts` — pure: argv → options record
- `scripts/washes/src/cli-table.ts` — pure: render confirmation table
- `scripts/washes/src/hedra-client.ts` — image + image-to-video HTTP
- `scripts/washes/src/post-process.ts` — shell-outs to cwebp and rembg
- `scripts/washes/src/extract-frames.ts` — shell-out to ffmpeg
- `scripts/washes/src/generate.ts` — orchestrator
- `scripts/washes/src/cli.ts` — entrypoint (arg parse → orchestrator)
- `scripts/washes/test/compile-prompt.test.ts`
- `scripts/washes/test/hash.test.ts`
- `scripts/washes/test/lockfile.test.ts`
- `scripts/washes/test/cli-args.test.ts`
- `scripts/washes/test/cli-table.test.ts`
- `scripts/washes/test/hedra-client.test.ts`
- `scripts/washes/test/fixtures/solid-square.png` — tiny asset for cwebp tests
- `src/style-decor.css` — wash positioning, blend mode, note keyframes
- `src/hero-bloom.js` — canvas scroll-scrubber
- `public/assets/decor/README.md` — what goes here
- `public/assets/decor/washes/` — committed wash stills
- `public/assets/decor/motion/hero/` — committed motion frames

### Modified files

- `package.json` — add `"washes": "npm --prefix scripts/washes run generate"` script
- `index.html` — replace placeholder ellipses with `<img class="wash">` blocks; add `<canvas class="hero-bloom">` + poster fallback to the hero; sprinkle `.note` elements into sections
- `src/main.js` — import `./style-decor.css` and kick off `hero-bloom.js`

---

## Task Ordering Rationale

- **Tasks 1–3** lay the foundation (scripts package, manifest seed, root npm script). Nothing runs yet.
- **Tasks 4–8** build pure functions with real tests. No network, no shell outs, fast TDD loop.
- **Tasks 9–12** add the I/O integrations. Hedra is mocked in tests; real fixture images drive cwebp/rembg/ffmpeg tests.
- **Task 13** wires the orchestrator that composes all of the above.
- **Tasks 14–15** run the CLI against real Hedra for the hero section — the first time any API call fires.
- **Tasks 16–19** ship the runtime pieces (CSS, canvas, index.html wiring, fallbacks).
- **Task 20** expands to the remaining 9 sections.
- **Task 21** is the final visual QA + commit.

---

### Task 1: Scaffold `scripts/washes/` Node package

**Files:**
- Create: `scripts/washes/package.json`
- Create: `scripts/washes/tsconfig.json`
- Create: `scripts/washes/.gitignore`
- Create: `scripts/washes/README.md`
- Create: `scripts/washes/requirements.txt`
- Create: `scripts/washes/src/.gitkeep`
- Create: `scripts/washes/test/.gitkeep`
- Modify: `package.json` (root)

- [ ] **Step 1: Create `scripts/washes/package.json`**

```json
{
  "name": "@songscribe/washes",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "generate": "tsx src/cli.ts",
    "test": "node --test --import tsx ./test/*.test.ts"
  },
  "dependencies": {
    "dotenv": "^16.4.5",
    "undici": "^6.19.0"
  },
  "devDependencies": {
    "tsx": "^4.19.0",
    "typescript": "^5.5.0",
    "@types/node": "^20.14.0"
  }
}
```

- [ ] **Step 2: Create `scripts/washes/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "allowImportingTsExtensions": false,
    "noEmit": true
  },
  "include": ["src/**/*.ts", "test/**/*.ts"]
}
```

- [ ] **Step 3: Create `scripts/washes/.gitignore`**

```
node_modules/
__pycache__/
*.tmp
tmp/
.env.local
```

- [ ] **Step 4: Create `scripts/washes/requirements.txt`**

```
rembg[cpu]==2.0.57
onnxruntime==1.18.1
```

- [ ] **Step 5: Create `scripts/washes/README.md`**

````markdown
# Watercolor wash generator

Local-only build-time CLI. Reads `manifest.json`, calls Hedra, writes assets to
`public/assets/decor/`.

## Prereqs

1. System binaries: `cwebp`, `ffmpeg` on PATH (install via `brew install webp ffmpeg`).
2. Python + rembg: `pip install -r requirements.txt` (one-time ~176MB model download on first run).
3. Copy `.env.local.example` to `.env.local` and fill in `HEDRA_API_KEY=…`.

## Common commands

```bash
npm --prefix scripts/washes install        # once
npm run washes -- --estimate               # print prompts + cost, no API calls
npm run washes -- --only hero              # regenerate one section
npm run washes                             # full regen with dry-run confirmation
```

See `docs/superpowers/specs/2026-04-17-hedra-watercolor-pipeline-design.md` for the full design.
````

- [ ] **Step 6: Create placeholder files so git tracks dirs**

```bash
touch scripts/washes/src/.gitkeep scripts/washes/test/.gitkeep
```

- [ ] **Step 7: Add the `washes` npm script to the root `package.json`**

Open `/Users/Atlas/Projects/songscribe-website/package.json`. Replace the `"scripts"` block with:

```json
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "washes": "npm --prefix scripts/washes run generate --"
  },
```

- [ ] **Step 8: Install scripts deps**

Run: `npm --prefix scripts/washes install`
Expected: exit 0, `scripts/washes/node_modules/` created.

- [ ] **Step 9: Verify install with a dry `npm test`**

Run: `npm --prefix scripts/washes test`
Expected: `0 tests … pass` (no tests yet — we're verifying the runner wires up).

- [ ] **Step 10: Commit**

```bash
git add scripts/washes/ package.json
git commit -m "chore: scaffold scripts/washes package for Hedra wash pipeline"
```

---

### Task 2: Seed `manifest.json` with hero entry only

**Files:**
- Create: `scripts/washes/manifest.json`

We start with a single hero entry so the first end-to-end run has a narrow blast radius. The other nine sections get added in Task 20 once the pipeline works.

- [ ] **Step 1: Create `scripts/washes/manifest.json`**

```json
{
  "version": 1,
  "global": {
    "model": "flux-dev",
    "size": "2048x2048",
    "template": "A single {palette} watercolor wash on pure white paper, {density}, {edge} edges, slight granulation, hand-painted, no subject, centered, isolated, high-resolution scan. Overall mood: {mood}.",
    "negative": "text, borders, frame, subject, object, geometry, sharp lines, digital gradient, vignette, photograph, 3D render",
    "concurrency": 1
  },
  "sections": [
    {
      "id": "hero",
      "mood": "warm invitation, dawn light, unhurried",
      "palette": "soft burnt orange blending into amber",
      "density": "large diffuse bloom with a quieter center",
      "edge": "torn, feathered",
      "seed": 47213,
      "motion": {
        "enabled": true,
        "frames": 90,
        "duration": 6.0,
        "direction": "bloom",
        "videoModel": "veo-3.1-fast",
        "videoPrompt": "the watercolor wash slowly blooming outward from its center, paint expanding organically into the surrounding paper, subtle wet edge spread, no new objects appearing"
      }
    }
  ]
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/washes/manifest.json
git commit -m "feat: seed wash manifest with hero entry"
```

---

### Task 3: Define shared types

**Files:**
- Create: `scripts/washes/src/types.ts`

- [ ] **Step 1: Write `src/types.ts`**

```typescript
export interface ManifestGlobal {
  model: string;
  size: string;
  template: string;
  negative: string;
  concurrency: number;
}

export interface ManifestMotion {
  enabled: boolean;
  frames: number;
  duration: number;
  direction: string;
  videoModel: string;
  videoPrompt: string;
}

export interface ManifestSection {
  id: string;
  mood?: string;
  palette?: string;
  density?: string;
  edge?: string;
  seed?: number;
  prompt?: string;
  motion?: ManifestMotion;
}

export interface Manifest {
  version: 1;
  global: ManifestGlobal;
  sections: ManifestSection[];
}

export interface LockEntry {
  id: string;
  prompt: string;
  seed: number;
  model: string;
  size: string;
  hash: string;
  rawPath: string;
  webpPath: string;
  alphaWebpPath: string | null;
  motion: { frames: number; duration: number; hash: string } | null;
  updatedAt: string;
}

export interface Lockfile {
  version: 1;
  entries: Record<string, LockEntry>;
}
```

- [ ] **Step 2: Typecheck the file**

Run: `npm --prefix scripts/washes exec -- tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add scripts/washes/src/types.ts
git commit -m "feat(washes): define manifest and lockfile types"
```

---

### Task 4: `compile-prompt.ts` (pure, TDD)

**Files:**
- Create: `scripts/washes/test/compile-prompt.test.ts`
- Create: `scripts/washes/src/compile-prompt.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// test/compile-prompt.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { compilePrompt } from '../src/compile-prompt.ts';
import type { ManifestGlobal, ManifestSection } from '../src/types.ts';

const global: ManifestGlobal = {
  model: 'flux-dev',
  size: '2048x2048',
  template: 'A single {palette} watercolor wash, {density}, {edge} edges. Mood: {mood}.',
  negative: 'text, borders',
  concurrency: 1,
};

describe('compilePrompt', () => {
  it('substitutes all four slots and appends negative prompt', () => {
    // #given
    const section: ManifestSection = {
      id: 'hero',
      mood: 'warm',
      palette: 'burnt orange',
      density: 'large diffuse bloom',
      edge: 'torn',
    };

    // #when
    const prompt = compilePrompt(section, global);

    // #then
    assert.match(prompt, /burnt orange watercolor wash/);
    assert.match(prompt, /large diffuse bloom/);
    assert.match(prompt, /torn edges/);
    assert.match(prompt, /Mood: warm\./);
    assert.match(prompt, /NEGATIVE: text, borders/);
  });

  it('falls back to defaults for missing slots', () => {
    // #given
    const section: ManifestSection = { id: 'x' };

    // #when
    const prompt = compilePrompt(section, global);

    // #then
    assert.match(prompt, /soft neutral watercolor wash/);
    assert.match(prompt, /medium bloom/);
    assert.match(prompt, /feathered edges/);
  });

  it('uses section.prompt verbatim when provided, still appends negative', () => {
    // #given
    const section: ManifestSection = { id: 'x', prompt: 'custom prompt' };

    // #when
    const prompt = compilePrompt(section, global);

    // #then
    assert.equal(prompt, 'custom prompt\n\nNEGATIVE: text, borders');
  });

  it('omits NEGATIVE: line when global.negative is empty', () => {
    // #given
    const section: ManifestSection = { id: 'x', palette: 'teal' };
    const noNeg: ManifestGlobal = { ...global, negative: '' };

    // #when
    const prompt = compilePrompt(section, noNeg);

    // #then
    assert.doesNotMatch(prompt, /NEGATIVE/);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm --prefix scripts/washes test`
Expected: `Cannot find module '../src/compile-prompt.ts'` (or similar resolution error).

- [ ] **Step 3: Implement `compile-prompt.ts`**

```typescript
// src/compile-prompt.ts
import type { ManifestGlobal, ManifestSection } from './types.ts';

const DEFAULT_SLOTS = {
  palette: 'soft neutral',
  density: 'medium bloom',
  edge: 'feathered',
  mood: 'quiet, unhurried',
} as const;

type Slot = keyof typeof DEFAULT_SLOTS;
const SLOT_KEYS = Object.keys(DEFAULT_SLOTS) as Slot[];

export function compilePrompt(section: ManifestSection, global: ManifestGlobal): string {
  const body = section.prompt ?? fillTemplate(section, global.template);
  return global.negative ? `${body}\n\nNEGATIVE: ${global.negative}` : body;
}

function fillTemplate(section: ManifestSection, template: string): string {
  return SLOT_KEYS.reduce((acc, slot) => {
    const value = section[slot] ?? DEFAULT_SLOTS[slot];
    return acc.replaceAll(`{${slot}}`, value);
  }, template);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm --prefix scripts/washes test`
Expected: `4 pass, 0 fail`.

- [ ] **Step 5: Commit**

```bash
git add scripts/washes/src/compile-prompt.ts scripts/washes/test/compile-prompt.test.ts
git commit -m "feat(washes): add compile-prompt pure function with tests"
```

---

### Task 5: `hash.ts` (pure, TDD)

**Files:**
- Create: `scripts/washes/test/hash.test.ts`
- Create: `scripts/washes/src/hash.ts`

The hash fingerprints `{prompt + seed + model + size}` so the lockfile can detect when a section's inputs have changed.

- [ ] **Step 1: Write the failing tests**

```typescript
// test/hash.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fingerprint } from '../src/hash.ts';

describe('fingerprint', () => {
  it('produces a stable 16-char hex digest for equal inputs', () => {
    // #given
    const a = fingerprint({ prompt: 'x', seed: 1, model: 'flux-dev', size: '2048x2048' });
    const b = fingerprint({ prompt: 'x', seed: 1, model: 'flux-dev', size: '2048x2048' });

    // #then
    assert.equal(a, b);
    assert.match(a, /^[0-9a-f]{16}$/);
  });

  it('changes when any field changes', () => {
    // #given
    const base = { prompt: 'x', seed: 1, model: 'flux-dev', size: '2048x2048' };

    // #when
    const h0 = fingerprint(base);
    const h1 = fingerprint({ ...base, prompt: 'y' });
    const h2 = fingerprint({ ...base, seed: 2 });
    const h3 = fingerprint({ ...base, model: 'seedream-4' });
    const h4 = fingerprint({ ...base, size: '1024x1024' });

    // #then
    assert.notEqual(h0, h1);
    assert.notEqual(h0, h2);
    assert.notEqual(h0, h3);
    assert.notEqual(h0, h4);
  });
});
```

- [ ] **Step 2: Run to verify fail**

Run: `npm --prefix scripts/washes test`
Expected: resolution error for `../src/hash.ts`.

- [ ] **Step 3: Implement**

```typescript
// src/hash.ts
import { createHash } from 'node:crypto';

export interface FingerprintInputs {
  prompt: string;
  seed: number;
  model: string;
  size: string;
}

export function fingerprint({ prompt, seed, model, size }: FingerprintInputs): string {
  const payload = JSON.stringify({ prompt, seed, model, size });
  return createHash('sha256').update(payload).digest('hex').slice(0, 16);
}
```

- [ ] **Step 4: Run tests**

Run: `npm --prefix scripts/washes test`
Expected: `6 pass, 0 fail`.

- [ ] **Step 5: Commit**

```bash
git add scripts/washes/src/hash.ts scripts/washes/test/hash.test.ts
git commit -m "feat(washes): add fingerprint hash function with tests"
```

---

### Task 6: `lockfile.ts` (pure, TDD)

**Files:**
- Create: `scripts/washes/test/lockfile.test.ts`
- Create: `scripts/washes/src/lockfile.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// test/lockfile.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadLockfile, saveLockfile, shouldSkip, upsertEntry } from '../src/lockfile.ts';
import type { Lockfile, LockEntry } from '../src/types.ts';

const makeEntry = (overrides: Partial<LockEntry> = {}): LockEntry => ({
  id: 'hero',
  prompt: 'p',
  seed: 1,
  model: 'flux-dev',
  size: '2048x2048',
  hash: 'abc123',
  rawPath: 'public/assets/decor/washes/hero.raw.png',
  webpPath: 'public/assets/decor/washes/hero.webp',
  alphaWebpPath: 'public/assets/decor/washes/hero.a.webp',
  motion: null,
  updatedAt: '2026-04-17T00:00:00.000Z',
  ...overrides,
});

describe('loadLockfile', () => {
  it('returns an empty lockfile when the file does not exist', async () => {
    // #given
    const dir = await mkdtemp(join(tmpdir(), 'lf-'));
    const path = join(dir, 'washes.lock.json');

    // #when
    const lf = await loadLockfile(path);

    // #then
    assert.deepEqual(lf, { version: 1, entries: {} });
  });

  it('loads an existing file', async () => {
    // #given
    const dir = await mkdtemp(join(tmpdir(), 'lf-'));
    const path = join(dir, 'washes.lock.json');
    const seed: Lockfile = { version: 1, entries: { hero: makeEntry() } };
    await writeFile(path, JSON.stringify(seed));

    // #when
    const lf = await loadLockfile(path);

    // #then
    assert.equal(lf.entries.hero?.hash, 'abc123');
  });
});

describe('shouldSkip', () => {
  it('returns true when hash matches and force is false', () => {
    // #given
    const lf: Lockfile = { version: 1, entries: { hero: makeEntry({ hash: 'abc123' }) } };

    // #when / #then
    assert.equal(shouldSkip(lf, 'hero', 'abc123', false), true);
  });

  it('returns false when hash differs', () => {
    // #given
    const lf: Lockfile = { version: 1, entries: { hero: makeEntry({ hash: 'abc123' }) } };

    // #when / #then
    assert.equal(shouldSkip(lf, 'hero', 'DIFFERENT', false), false);
  });

  it('returns false when force is true even if hash matches', () => {
    // #given
    const lf: Lockfile = { version: 1, entries: { hero: makeEntry({ hash: 'abc123' }) } };

    // #when / #then
    assert.equal(shouldSkip(lf, 'hero', 'abc123', true), false);
  });

  it('returns false when entry does not exist', () => {
    // #given
    const lf: Lockfile = { version: 1, entries: {} };

    // #when / #then
    assert.equal(shouldSkip(lf, 'hero', 'abc123', false), false);
  });
});

describe('upsertEntry + saveLockfile', () => {
  it('writes an entry and it round-trips through disk', async () => {
    // #given
    const dir = await mkdtemp(join(tmpdir(), 'lf-'));
    const path = join(dir, 'washes.lock.json');
    const lf: Lockfile = { version: 1, entries: {} };
    const entry = makeEntry();

    // #when
    const next = upsertEntry(lf, entry);
    await saveLockfile(path, next);
    const reloaded = JSON.parse(await readFile(path, 'utf8')) as Lockfile;

    // #then
    assert.equal(reloaded.entries.hero?.hash, 'abc123');
  });
});
```

- [ ] **Step 2: Run to verify fail**

Run: `npm --prefix scripts/washes test`
Expected: resolution error.

- [ ] **Step 3: Implement**

```typescript
// src/lockfile.ts
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { Lockfile, LockEntry } from './types.ts';

export async function loadLockfile(path: string): Promise<Lockfile> {
  try {
    const raw = await readFile(path, 'utf8');
    return JSON.parse(raw) as Lockfile;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return { version: 1, entries: {} };
    }
    throw err;
  }
}

export async function saveLockfile(path: string, lf: Lockfile): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(lf, null, 2) + '\n', 'utf8');
}

export function shouldSkip(lf: Lockfile, id: string, expectedHash: string, force: boolean): boolean {
  if (force) return false;
  const entry = lf.entries[id];
  if (!entry) return false;
  return entry.hash === expectedHash;
}

export function upsertEntry(lf: Lockfile, entry: LockEntry): Lockfile {
  return {
    version: 1,
    entries: { ...lf.entries, [entry.id]: entry },
  };
}
```

- [ ] **Step 4: Run tests**

Run: `npm --prefix scripts/washes test`
Expected: `12 pass, 0 fail`.

- [ ] **Step 5: Commit**

```bash
git add scripts/washes/src/lockfile.ts scripts/washes/test/lockfile.test.ts
git commit -m "feat(washes): add lockfile load/save/skip logic with tests"
```

---

### Task 7: `cli-args.ts` (pure, TDD)

**Files:**
- Create: `scripts/washes/test/cli-args.test.ts`
- Create: `scripts/washes/src/cli-args.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// test/cli-args.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs } from '../src/cli-args.ts';

describe('parseArgs', () => {
  it('defaults to full regen with prompt', () => {
    // #given / #when
    const opts = parseArgs([]);

    // #then
    assert.deepEqual(opts, {
      estimate: false,
      only: null,
      stillsOnly: false,
      motionOnly: false,
      force: false,
      noAlpha: false,
      yes: false,
    });
  });

  it('--estimate sets estimate to true', () => {
    assert.equal(parseArgs(['--estimate']).estimate, true);
  });

  it('--only hero sets only to ["hero"]', () => {
    assert.deepEqual(parseArgs(['--only', 'hero']).only, ['hero']);
  });

  it('--sections a,b,c sets only to three ids', () => {
    assert.deepEqual(parseArgs(['--sections', 'a,b,c']).only, ['a', 'b', 'c']);
  });

  it('combined flags parse together', () => {
    // #given / #when
    const opts = parseArgs(['--only', 'hero', '--force', '--no-alpha', '--yes']);

    // #then
    assert.equal(opts.force, true);
    assert.equal(opts.noAlpha, true);
    assert.equal(opts.yes, true);
    assert.deepEqual(opts.only, ['hero']);
  });

  it('throws on unknown flag', () => {
    // #then
    assert.throws(() => parseArgs(['--bogus']), /Unknown flag: --bogus/);
  });
});
```

- [ ] **Step 2: Run to verify fail**

Run: `npm --prefix scripts/washes test`

- [ ] **Step 3: Implement**

```typescript
// src/cli-args.ts
export interface CliOptions {
  estimate: boolean;
  only: string[] | null;
  stillsOnly: boolean;
  motionOnly: boolean;
  force: boolean;
  noAlpha: boolean;
  yes: boolean;
}

export function parseArgs(argv: readonly string[]): CliOptions {
  const opts: CliOptions = {
    estimate: false,
    only: null,
    stillsOnly: false,
    motionOnly: false,
    force: false,
    noAlpha: false,
    yes: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '--estimate': opts.estimate = true; break;
      case '--stills-only': opts.stillsOnly = true; break;
      case '--motion-only': opts.motionOnly = true; break;
      case '--force': opts.force = true; break;
      case '--no-alpha': opts.noAlpha = true; break;
      case '--yes': case '-y': opts.yes = true; break;
      case '--only': {
        const v = argv[++i];
        if (!v) throw new Error('--only requires a value');
        opts.only = [v];
        break;
      }
      case '--sections': {
        const v = argv[++i];
        if (!v) throw new Error('--sections requires a value');
        opts.only = v.split(',').map(s => s.trim()).filter(Boolean);
        break;
      }
      default: throw new Error(`Unknown flag: ${arg}`);
    }
  }
  return opts;
}
```

- [ ] **Step 4: Run tests**

Run: `npm --prefix scripts/washes test`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/washes/src/cli-args.ts scripts/washes/test/cli-args.test.ts
git commit -m "feat(washes): add CLI argument parser"
```

---

### Task 8: `cli-table.ts` (pure, TDD)

**Files:**
- Create: `scripts/washes/test/cli-table.test.ts`
- Create: `scripts/washes/src/cli-table.ts`

Renders the confirmation table before any API call.

- [ ] **Step 1: Write the failing tests**

```typescript
// test/cli-table.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { renderTable, type PlannedAction } from '../src/cli-table.ts';

describe('renderTable', () => {
  it('renders one row per planned action with truncated prompt', () => {
    // #given
    const actions: PlannedAction[] = [
      {
        id: 'hero',
        kind: 'still',
        status: 'REGEN',
        prompt: 'A single soft burnt orange watercolor wash on pure white paper, large diffuse bloom, torn edges.',
      },
      { id: 'hero', kind: 'motion', status: 'REGEN', prompt: '6.0s bloom, 90 frames' },
      {
        id: 'f1-chord-editor',
        kind: 'still',
        status: 'SKIP',
        prompt: 'A single deep teal watercolor wash on pure white paper, compact, wet edges.',
      },
    ];

    // #when
    const out = renderTable(actions, 0.46);

    // #then
    assert.match(out, /hero\s+REGEN \(still\)/);
    assert.match(out, /hero\s+REGEN \(motion\)/);
    assert.match(out, /f1-chord-editor\s+SKIP \(still\)/);
    assert.match(out, /Est\. cost: \$0\.46/);
  });

  it('handles an empty plan', () => {
    // #when
    const out = renderTable([], 0);

    // #then
    assert.match(out, /No sections to regenerate/);
  });
});
```

- [ ] **Step 2: Run to verify fail**

Run: `npm --prefix scripts/washes test`

- [ ] **Step 3: Implement**

```typescript
// src/cli-table.ts
export type ActionStatus = 'REGEN' | 'SKIP';
export type ActionKind = 'still' | 'motion';

export interface PlannedAction {
  id: string;
  kind: ActionKind;
  status: ActionStatus;
  prompt: string;
}

const DIVIDER = '─'.repeat(80);

export function renderTable(actions: readonly PlannedAction[], estCost: number): string {
  if (actions.length === 0) {
    return 'No sections to regenerate. All entries matched lockfile hashes.';
  }
  const header = `Section${' '.repeat(18)}Action${' '.repeat(11)}Prompt (80 chars)`;
  const rows = actions.map(a => {
    const id = a.id.padEnd(24);
    const action = `${a.status} (${a.kind})`.padEnd(17);
    const promptSnippet = a.prompt.length > 80 ? `${a.prompt.slice(0, 77)}…` : a.prompt;
    return `${id}${action}${promptSnippet}`;
  });
  return [
    header,
    DIVIDER,
    ...rows,
    DIVIDER,
    `Est. cost: $${estCost.toFixed(2)}`,
  ].join('\n');
}
```

- [ ] **Step 4: Run tests**

Run: `npm --prefix scripts/washes test`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/washes/src/cli-table.ts scripts/washes/test/cli-table.test.ts
git commit -m "feat(washes): add confirmation-table renderer"
```

---

### Task 9: `hedra-client.ts` — image endpoint (with mocked tests)

**Files:**
- Create: `scripts/washes/test/hedra-client.test.ts`
- Create: `scripts/washes/src/hedra-client.ts`

**Before writing code**, verify the exact Hedra endpoint shape. Hedra's API has changed and could change again. Use the `librarian` agent or fetch the docs via the MCP context7 tool. The contract below is a best-guess starting point; adjust to match the real shape.

- [ ] **Step 1: Verify the real Hedra image endpoint**

Run a `WebFetch` against `https://www.hedra.com/docs/legacy-api-reference/generate-image-endpoint` OR dispatch the `librarian` agent with: "Fetch the current Hedra generate-image-endpoint docs. I need: URL, HTTP method, required headers (auth), request body fields for model/prompt/size/seed, response body shape (is it a direct image URL, a base64 blob, or a job ID to poll?), expected status codes."

Write the findings into a comment block at the top of `src/hedra-client.ts` so the next engineer has the source of truth.

- [ ] **Step 2: Write the failing tests (stub the `fetch` dependency)**

```typescript
// test/hedra-client.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { HedraClient } from '../src/hedra-client.ts';

describe('HedraClient.generateImage', () => {
  it('POSTs prompt/model/size/seed to the image endpoint and returns bytes', async () => {
    // #given
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const fakeBytes = new Uint8Array([137, 80, 78, 71]); // PNG magic bytes
    const fetchImpl: typeof fetch = async (url, init) => {
      calls.push({ url: String(url), init: init ?? {} });
      return new Response(fakeBytes, { status: 200, headers: { 'content-type': 'image/png' } });
    };
    const client = new HedraClient({ apiKey: 'test-key', fetchImpl });

    // #when
    const result = await client.generateImage({
      prompt: 'x', model: 'flux-dev', size: '2048x2048', seed: 1,
    });

    // #then
    assert.equal(calls.length, 1);
    assert.match(calls[0]!.url, /hedra/);
    assert.equal((calls[0]!.init.headers as Record<string, string>).Authorization, 'Bearer test-key');
    assert.ok(result.bytes instanceof Uint8Array);
    assert.equal(result.bytes.byteLength, 4);
  });

  it('retries once on 5xx, then succeeds', async () => {
    // #given
    let n = 0;
    const fetchImpl: typeof fetch = async () => {
      n++;
      if (n === 1) return new Response('upstream boom', { status: 503 });
      return new Response(new Uint8Array([1, 2, 3]), { status: 200 });
    };
    const client = new HedraClient({ apiKey: 'k', fetchImpl, retryDelayMs: 0 });

    // #when
    const result = await client.generateImage({
      prompt: 'x', model: 'flux-dev', size: '2048x2048', seed: 1,
    });

    // #then
    assert.equal(n, 2);
    assert.equal(result.bytes.byteLength, 3);
  });

  it('fails loud on 4xx (no retry)', async () => {
    // #given
    let n = 0;
    const fetchImpl: typeof fetch = async () => {
      n++;
      return new Response('bad prompt', { status: 400 });
    };
    const client = new HedraClient({ apiKey: 'k', fetchImpl, retryDelayMs: 0 });

    // #when / #then
    await assert.rejects(
      () => client.generateImage({ prompt: 'x', model: 'flux-dev', size: '2048x2048', seed: 1 }),
      /HTTP 400/,
    );
    assert.equal(n, 1);
  });
});
```

- [ ] **Step 3: Run to verify fail**

Run: `npm --prefix scripts/washes test`

- [ ] **Step 4: Implement** (adjust URL + body shape to match what you found in Step 1)

```typescript
// src/hedra-client.ts
// Hedra API reference: https://www.hedra.com/docs/legacy-api-reference/generate-image-endpoint
// Verify the exact shape (URL, body, response) before trusting this file.

export interface HedraClientOptions {
  apiKey: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  retryDelayMs?: number;
}

export interface GenerateImageRequest {
  prompt: string;
  model: string;
  size: string; // "2048x2048"
  seed: number;
  negative?: string;
}

export interface GenerateImageResult {
  bytes: Uint8Array;
  contentType: string;
}

const DEFAULT_BASE = 'https://api.hedra.com';
const IMAGE_PATH = '/web-app/backend/generate-image';

export class HedraClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly retryDelayMs: number;

  constructor(opts: HedraClientOptions) {
    this.apiKey = opts.apiKey;
    this.baseUrl = opts.baseUrl ?? DEFAULT_BASE;
    this.fetchImpl = opts.fetchImpl ?? fetch;
    this.retryDelayMs = opts.retryDelayMs ?? 3000;
  }

  async generateImage(req: GenerateImageRequest): Promise<GenerateImageResult> {
    const [w, h] = req.size.split('x').map(Number);
    const body = JSON.stringify({
      prompt: req.prompt,
      model: req.model,
      width: w,
      height: h,
      seed: req.seed,
      negative_prompt: req.negative ?? '',
    });
    const url = `${this.baseUrl}${IMAGE_PATH}`;
    const init: RequestInit = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body,
    };
    return this.fetchWithRetry(url, init);
  }

  private async fetchWithRetry(url: string, init: RequestInit): Promise<GenerateImageResult> {
    const res = await this.fetchImpl(url, init);
    if (res.ok) {
      const buf = new Uint8Array(await res.arrayBuffer());
      return { bytes: buf, contentType: res.headers.get('content-type') ?? 'image/png' };
    }
    if (res.status >= 500 && res.status < 600) {
      await sleep(this.retryDelayMs);
      const retry = await this.fetchImpl(url, init);
      if (retry.ok) {
        const buf = new Uint8Array(await retry.arrayBuffer());
        return { bytes: buf, contentType: retry.headers.get('content-type') ?? 'image/png' };
      }
      throw new Error(`HTTP ${retry.status} from Hedra (after retry): ${await retry.text()}`);
    }
    throw new Error(`HTTP ${res.status} from Hedra: ${await res.text()}`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}
```

- [ ] **Step 5: Run tests**

Run: `npm --prefix scripts/washes test`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add scripts/washes/src/hedra-client.ts scripts/washes/test/hedra-client.test.ts
git commit -m "feat(washes): add Hedra image client with retry logic"
```

---

### Task 10: Extend `hedra-client.ts` with image-to-video endpoint

**Files:**
- Modify: `scripts/washes/src/hedra-client.ts`
- Modify: `scripts/washes/test/hedra-client.test.ts`

Hedra's image-to-video flow typically: upload the still → create a video job → poll for completion → download MP4. The exact endpoint shape varies and MUST be verified.

- [ ] **Step 1: Verify the image-to-video flow**

Via `librarian` agent: "Fetch the current Hedra image-to-video endpoint docs. Specifically: how do I upload an image? How do I start a video generation job (body fields for model, duration, prompt, seed)? How do I poll? How do I download the result (direct URL or streamed bytes)?"

Write findings as a comment block at the top of `hedra-client.ts`.

- [ ] **Step 2: Write failing test for `animateImage`**

Append to `test/hedra-client.test.ts`:

```typescript
describe('HedraClient.animateImage', () => {
  it('uploads image, creates job, polls until complete, returns mp4 bytes', async () => {
    // #given
    const seq: string[] = [];
    const mp4 = new Uint8Array([0, 0, 0, 24]); // fake mp4
    const fetchImpl: typeof fetch = async (url, init) => {
      const u = String(url);
      seq.push(u);
      if (u.includes('/upload')) {
        return new Response(JSON.stringify({ asset_id: 'asset_abc' }), { status: 200 });
      }
      if (u.includes('/video') && init?.method === 'POST') {
        return new Response(JSON.stringify({ job_id: 'job_xyz' }), { status: 200 });
      }
      if (u.includes('job_xyz')) {
        return new Response(JSON.stringify({ status: 'complete', url: 'https://cdn.hedra/v/xyz.mp4' }), { status: 200 });
      }
      if (u.includes('cdn.hedra')) {
        return new Response(mp4, { status: 200 });
      }
      return new Response('not found', { status: 404 });
    };
    const client = new HedraClient({ apiKey: 'k', fetchImpl, pollIntervalMs: 0 });

    // #when
    const out = await client.animateImage({
      imageBytes: new Uint8Array([1, 2, 3]),
      prompt: 'bloom',
      duration: 6,
      model: 'veo-3.1-fast',
    });

    // #then
    assert.equal(out.bytes.byteLength, 4);
    assert.ok(seq.some(u => u.includes('/upload')));
    assert.ok(seq.some(u => u.includes('job_xyz')));
  });
});
```

- [ ] **Step 3: Run to verify fail**

Run: `npm --prefix scripts/washes test`

- [ ] **Step 4: Implement `animateImage`**

First, extend the options interface and the class fields. Replace the existing `HedraClientOptions` interface and the top of the `HedraClient` class in `src/hedra-client.ts` with:

```typescript
export interface HedraClientOptions {
  apiKey: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  retryDelayMs?: number;
  pollIntervalMs?: number;
  maxPollMs?: number;
}

// inside class body, replace the existing field list and constructor with:
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly retryDelayMs: number;
  private readonly pollIntervalMs: number;
  private readonly maxPollMs: number;

  constructor(opts: HedraClientOptions) {
    this.apiKey = opts.apiKey;
    this.baseUrl = opts.baseUrl ?? DEFAULT_BASE;
    this.fetchImpl = opts.fetchImpl ?? fetch;
    this.retryDelayMs = opts.retryDelayMs ?? 3000;
    this.pollIntervalMs = opts.pollIntervalMs ?? 4000;
    this.maxPollMs = opts.maxPollMs ?? 600_000;
  }
```

Then add the new request/response types and the `animateImage` method:

```typescript
export interface AnimateImageRequest {
  imageBytes: Uint8Array;
  prompt: string;
  duration: number;
  model: string;
}

export interface AnimateImageResult {
  bytes: Uint8Array;
  contentType: string;
}

// inside the class, below generateImage:
async animateImage(req: AnimateImageRequest): Promise<AnimateImageResult> {
  // 1. upload image asset
  const uploadRes = await this.fetchImpl(`${this.baseUrl}/web-app/backend/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${this.apiKey}` },
    body: req.imageBytes,
  });
  if (!uploadRes.ok) throw new Error(`upload failed: HTTP ${uploadRes.status}`);
  const { asset_id } = (await uploadRes.json()) as { asset_id: string };

  // 2. create job
  const jobRes = await this.fetchImpl(`${this.baseUrl}/web-app/backend/video`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      asset_id,
      prompt: req.prompt,
      duration: req.duration,
      model: req.model,
    }),
  });
  if (!jobRes.ok) throw new Error(`job create failed: HTTP ${jobRes.status}`);
  const { job_id } = (await jobRes.json()) as { job_id: string };

  // 3. poll
  const deadline = Date.now() + this.maxPollMs;
  while (Date.now() < deadline) {
    const stat = await this.fetchImpl(
      `${this.baseUrl}/web-app/backend/video/${job_id}`,
      { headers: { Authorization: `Bearer ${this.apiKey}` } },
    );
    if (!stat.ok) throw new Error(`poll failed: HTTP ${stat.status}`);
    const payload = (await stat.json()) as { status: string; url?: string };
    if (payload.status === 'complete' && payload.url) {
      const dl = await this.fetchImpl(payload.url);
      if (!dl.ok) throw new Error(`download failed: HTTP ${dl.status}`);
      const buf = new Uint8Array(await dl.arrayBuffer());
      return { bytes: buf, contentType: dl.headers.get('content-type') ?? 'video/mp4' };
    }
    if (payload.status === 'failed') throw new Error('Hedra reported job status: failed');
    await sleep(this.pollIntervalMs);
  }
  throw new Error('Hedra job poll timed out');
}
```

(Also add `pollIntervalMs`, `maxPollMs` to constructor options with defaults `4000` and `600000`.)

- [ ] **Step 5: Run tests**

Run: `npm --prefix scripts/washes test`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add scripts/washes/src/hedra-client.ts scripts/washes/test/hedra-client.test.ts
git commit -m "feat(washes): add Hedra image-to-video flow with polling"
```

---

### Task 11: `post-process.ts` — cwebp and rembg shell-outs

**Files:**
- Create: `scripts/washes/src/post-process.ts`
- Create: `scripts/washes/test/fixtures/solid-square.png` (64×64 solid color)
- No tests for this module — it's thin shell-out glue; verified in Task 14.

- [ ] **Step 1: Create the fixture PNG**

```bash
mkdir -p scripts/washes/test/fixtures
python3 -c "from PIL import Image; Image.new('RGB', (64, 64), (255, 127, 60)).save('scripts/washes/test/fixtures/solid-square.png')"
```

If Pillow isn't available, create the fixture by any means (a 64×64 opaque PNG is fine).

- [ ] **Step 2: Write `post-process.ts`**

```typescript
// src/post-process.ts
import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';

export interface CwebpOptions {
  quality: number;       // 0-100
  alphaQuality?: number; // 0-100, default 90
  method?: number;       // 0-6, default 6
}

export async function cwebp(inputPath: string, outputPath: string, opts: CwebpOptions): Promise<void> {
  const args = [
    '-q', String(opts.quality),
    '-alpha_q', String(opts.alphaQuality ?? 90),
    '-m', String(opts.method ?? 6),
    inputPath,
    '-o', outputPath,
  ];
  await run('cwebp', args);
}

export async function rembg(inputPath: string, outputPath: string): Promise<void> {
  await run('rembg', ['i', '-m', 'u2net', inputPath, outputPath]);
}

export async function assertBinary(name: string): Promise<void> {
  try {
    await run(name, ['-version']);
  } catch {
    throw new Error(
      `\n${name} not found on PATH. Install first:\n` +
      `  cwebp: brew install webp\n` +
      `  ffmpeg: brew install ffmpeg\n` +
      `  rembg:  pip install -r scripts/washes/requirements.txt\n`,
    );
  }
}

export async function fileExists(path: string): Promise<boolean> {
  try { await access(path); return true; } catch { return false; }
}

function run(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: 'inherit' });
    proc.on('error', reject);
    proc.on('exit', code => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited with code ${code}`));
    });
  });
}
```

- [ ] **Step 3: Quick smoke test from shell**

Run:
```bash
mkdir -p scripts/washes/tmp
cwebp -q 82 -alpha_q 90 -m 6 scripts/washes/test/fixtures/solid-square.png -o scripts/washes/tmp/smoke.webp && ls -la scripts/washes/tmp/smoke.webp
```

Expected: a `smoke.webp` file of <1KB appears. If `cwebp: command not found`, run `brew install webp`.

- [ ] **Step 4: Commit**

```bash
git add scripts/washes/src/post-process.ts scripts/washes/test/fixtures/
git commit -m "feat(washes): add cwebp + rembg shell-out wrappers"
```

---

### Task 12: `extract-frames.ts` — ffmpeg frame extraction

**Files:**
- Create: `scripts/washes/src/extract-frames.ts`

- [ ] **Step 1: Write `extract-frames.ts`**

```typescript
// src/extract-frames.ts
import { spawn } from 'node:child_process';
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export interface ExtractFramesOptions {
  videoBytes: Uint8Array;
  outputDir: string;   // e.g. public/assets/decor/motion/hero
  fps: number;         // e.g. 15
  width: number;       // e.g. 1200
  tmpDir: string;      // scratch dir, cleaned after
}

export async function extractFrames(opts: ExtractFramesOptions): Promise<string[]> {
  await mkdir(opts.outputDir, { recursive: true });
  await mkdir(opts.tmpDir, { recursive: true });

  const videoPath = join(opts.tmpDir, 'input.mp4');
  await writeFile(videoPath, opts.videoBytes);

  await runFfmpeg([
    '-y', '-i', videoPath,
    '-vf', `fps=${opts.fps},scale=${opts.width}:-1`,
    join(opts.tmpDir, '%03d.png'),
  ]);

  const pngNames = (await readdir(opts.tmpDir))
    .filter(n => n.endsWith('.png'))
    .sort();
  return pngNames.map(n => join(opts.tmpDir, n));
}

export async function cleanupTmp(tmpDir: string): Promise<void> {
  await rm(tmpDir, { recursive: true, force: true });
}

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', args, { stdio: 'inherit' });
    proc.on('error', reject);
    proc.on('exit', code => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}`));
    });
  });
}
```

- [ ] **Step 2: Smoke test ffmpeg is installed**

Run: `ffmpeg -version`
Expected: prints version. If not, `brew install ffmpeg`.

- [ ] **Step 3: Commit**

```bash
git add scripts/washes/src/extract-frames.ts
git commit -m "feat(washes): add ffmpeg frame extractor"
```

---

### Task 13: `generate.ts` + `cli.ts` — orchestrator

**Files:**
- Create: `scripts/washes/src/generate.ts`
- Create: `scripts/washes/src/cli.ts`

The orchestrator reads manifest → computes plan → optionally prints table + confirms → runs. This task is long because it glues everything together, but each sub-function is small.

- [ ] **Step 1: Write `generate.ts`**

```typescript
// src/generate.ts
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { config as loadDotenv } from 'dotenv';
import { compilePrompt } from './compile-prompt.ts';
import { fingerprint } from './hash.ts';
import { loadLockfile, saveLockfile, shouldSkip, upsertEntry } from './lockfile.ts';
import { renderTable, type PlannedAction } from './cli-table.ts';
import { HedraClient } from './hedra-client.ts';
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

export async function generate(opts: CliOptions): Promise<void> {
  const manifest = JSON.parse(await readFile(MANIFEST, 'utf8')) as Manifest;
  const lock = await loadLockfile(LOCK);

  const sections = filterSections(manifest.sections, opts.only);
  const plan = buildPlan(sections, manifest, lock, opts);

  const estCost = plan.reduce((sum, a) => sum + (a.kind === 'still' ? STILL_COST_USD : MOTION_COST_USD) * (a.status === 'REGEN' ? 1 : 0), 0);
  console.log(renderTable(plan, estCost));

  if (opts.estimate) return;
  if (plan.every(a => a.status === 'SKIP')) return;

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
  if (!apiKey) throw new Error('HEDRA_API_KEY missing. Copy .env.local.example to .env.local and fill it in.');
  await assertBinary('cwebp');
  if (plan.some(a => a.kind === 'motion' && a.status === 'REGEN')) {
    await assertBinary('ffmpeg');
  }

  const client = new HedraClient({ apiKey });
  let nextLock = lock;

  for (const section of sections) {
    const prompt = compilePrompt(section, manifest.global);
    const seed = section.seed ?? Math.floor(Math.random() * 1_000_000);
    const hash = fingerprint({ prompt, seed, model: manifest.global.model, size: manifest.global.size });

    let entry: LockEntry | null = nextLock.entries[section.id] ?? null;

    if (!opts.motionOnly && !shouldSkip(nextLock, section.id, hash, opts.force)) {
      entry = await regenStill({ client, manifest, section, prompt, seed, hash, opts });
      nextLock = upsertEntry(nextLock, entry);
      await saveLockfile(LOCK, nextLock);
    }

    if (!opts.stillsOnly && section.motion?.enabled && entry) {
      const motionEntry = await regenMotion({ client, section, stillRawPath: entry.rawPath });
      const merged: LockEntry = { ...entry, motion: motionEntry };
      nextLock = upsertEntry(nextLock, merged);
      await saveLockfile(LOCK, nextLock);
    }
  }

  console.log('\nDone.');
}

function filterSections(all: ManifestSection[], only: string[] | null): ManifestSection[] {
  if (!only) return all;
  return all.filter(s => only.includes(s.id));
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
    const hash = fingerprint({ prompt, seed, model: manifest.global.model, size: manifest.global.size });
    const stillSkipped = shouldSkip(lock, section.id, hash, opts.force);
    if (!opts.motionOnly) {
      plan.push({ id: section.id, kind: 'still', status: stillSkipped ? 'SKIP' : 'REGEN', prompt });
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
}): Promise<LockEntry> {
  const { client, manifest, section, prompt, seed, hash, opts } = args;
  console.log(`\n→ ${section.id}: generating still…`);

  const img = await client.generateImage({
    prompt,
    model: manifest.global.model,
    size: manifest.global.size,
    seed,
    negative: manifest.global.negative,
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
}): Promise<LockEntry['motion']> {
  const { client, section, stillRawPath } = args;
  const motion = section.motion!;
  console.log(`\n→ ${section.id}: generating ${motion.duration}s motion…`);

  const imageBytes = await readFile(resolve(ROOT, stillRawPath));
  const vid = await client.animateImage({
    imageBytes,
    prompt: motion.videoPrompt,
    duration: motion.duration,
    model: motion.videoModel,
  });

  const outDir = join(MOTION_DIR, section.id);
  const tmpDir = join(TMP, `frames-${section.id}`);
  const pngFrames = await extractFrames({
    videoBytes: vid.bytes,
    outputDir: outDir,
    fps: motion.frames / motion.duration,
    width: 1200,
    tmpDir,
  });

  let lastWebp = '';
  for (let i = 0; i < pngFrames.length; i++) {
    const out = join(outDir, `${String(i + 1).padStart(3, '0')}.webp`);
    await cwebp(pngFrames[i]!, out, { quality: 78, method: 6 });
    lastWebp = out;
  }
  // poster = last frame (final bloom state)
  if (lastWebp) await cwebp(pngFrames[pngFrames.length - 1]!, join(outDir, 'poster.webp'), { quality: 85, method: 6 });
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
```

- [ ] **Step 2: Write `cli.ts`**

```typescript
// src/cli.ts
import { parseArgs } from './cli-args.ts';
import { generate } from './generate.ts';

const opts = parseArgs(process.argv.slice(2));
generate(opts).catch(err => {
  console.error('\n✖', err.message);
  process.exit(1);
});
```

- [ ] **Step 3: Typecheck**

Run: `npm --prefix scripts/washes exec -- tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Smoke test with `--estimate` (no network)**

Run: `npm run washes -- --estimate`
Expected: prints table with one row (`hero REGEN (still)`) + one row (`hero REGEN (motion)`) + total cost `$0.53`.

- [ ] **Step 5: Commit**

```bash
git add scripts/washes/src/generate.ts scripts/washes/src/cli.ts
git commit -m "feat(washes): add generate orchestrator and CLI entrypoint"
```

---

### Task 14: Install system deps and run real hero generation

**Files:**
- Create: `scripts/washes/.env.local` (git-ignored)
- Modifies (auto-generated): `scripts/washes/washes.lock.json`
- Creates (auto-generated): `public/assets/decor/washes/hero.{raw.png,webp,a.webp}`, `public/assets/decor/motion/hero/{001..090}.webp`, `poster.webp`

- [ ] **Step 1: Install system deps**

```bash
brew install webp ffmpeg
pip install -r scripts/washes/requirements.txt
```

Expected: `cwebp -version`, `ffmpeg -version`, and `rembg --help` all succeed.

- [ ] **Step 2: Create `.env.local`**

```bash
printf "HEDRA_API_KEY=%s\n" "<paste-from-hedra-dashboard>" > scripts/washes/.env.local
```

(User pastes their actual key. File is `.gitignore`d.)

- [ ] **Step 3: Run hero still only first**

Run: `npm run washes -- --only hero --stills-only --yes`

Expected:
- Progress logs: `→ hero: generating still…`, `→ hero: running rembg…`
- Files created: `public/assets/decor/washes/hero.raw.png`, `hero.webp`, `hero.a.webp`
- `washes.lock.json` updated with a `hero` entry
- Exit 0

If 4xx from Hedra: the prompt or model name is likely wrong. Check `src/compile-prompt.ts` output by adding a temporary `console.log` — or re-verify the Hedra endpoint docs.

- [ ] **Step 4: Inspect the output visually**

Open `public/assets/decor/washes/hero.webp` in an image viewer. The wash should look like a hand-painted burnt-orange watercolor blob on white paper.

If the result is wrong aesthetically (not a watercolor, has subjects/objects, sharp lines):
1. Open `scripts/washes/manifest.json` and tweak the `palette` / `density` / `edge` / `mood` slots, or set an explicit `prompt` field.
2. `npm run washes -- --only hero --stills-only --force --yes` to regenerate.
3. Repeat until happy.

- [ ] **Step 5: Run hero motion**

Run: `npm run washes -- --only hero --motion-only --yes`

Expected:
- Logs: `→ hero: generating 6s motion…`, ffmpeg progress, 90 `cwebp` invocations
- `public/assets/decor/motion/hero/001.webp` through `090.webp` created
- `public/assets/decor/motion/hero/poster.webp` created
- Total size of motion dir: 500–800KB

If Hedra's poll times out, bump `maxPollMs` in `generate.ts` → new `HedraClient({ ..., maxPollMs: 1200000 })`.

- [ ] **Step 6: Commit (generated assets)**

```bash
git add public/assets/decor/ scripts/washes/washes.lock.json scripts/washes/.env.local.example
git commit -m "feat: generate hero wash still + 6s motion frames via Hedra"
```

Note: DO NOT commit `.env.local`. Also create `.env.local.example`:

```bash
echo "HEDRA_API_KEY=" > scripts/washes/.env.local.example
git add scripts/washes/.env.local.example
```

---

### Task 15: Create `src/style-decor.css`

**Files:**
- Create: `src/style-decor.css`
- Modify: `src/main.js`

- [ ] **Step 1: Write `src/style-decor.css`**

```css
/* src/style-decor.css
 * Positions watercolor washes and defines CSS scroll-driven decor motion.
 */

:root {
  --cream: #F0EBE6;
}

/* Base wash — every section layers a still using multiply blend */
.wash {
  position: absolute;
  pointer-events: none;
  user-select: none;
  mix-blend-mode: multiply;
  z-index: 0;
}
.wash-tl { top: -18vw;  left: -14vw;  width: 78vw; max-width: 1100px; }
.wash-br { bottom: -22vw; right: -14vw; width: 70vw; max-width: 1000px; }
.wash-tr { top: -14vw;  right: -12vw; width: 60vw; max-width: 900px;  }
.wash-bl { bottom: -18vw; left: -14vw;  width: 68vw; max-width: 960px;  }

/* Hero scroll-scrubbed canvas */
.hero-bloom {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  mix-blend-mode: multiply;
  z-index: 0;
  display: block;
}
.hero-bloom-fallback {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  object-fit: cover;
  mix-blend-mode: multiply;
  z-index: 0;
  display: none;
}

/* Hero progress animation drives --p on every paint */
.hero {
  animation-timeline: view(block);
  animation-name: heroProgress;
  animation-fill-mode: both;
  animation-timing-function: linear;
}
@keyframes heroProgress {
  from { --p: 0; }
  to   { --p: 1; }
}

/* Notes and quills — four drift variants */
.note {
  position: absolute;
  pointer-events: none;
  animation-timeline: view();
  animation-range: cover 0% cover 100%;
  animation-fill-mode: both;
  animation-timing-function: ease-out;
  opacity: 0;
}
.note[data-drift="1"] { animation-name: drift1; }
.note[data-drift="2"] { animation-name: drift2; }
.note[data-drift="3"] { animation-name: drift3; }
.note[data-drift="4"] { animation-name: drift4; }

@keyframes drift1 {
  from { transform: translate(-20px, 40px) rotate(-8deg); opacity: 0; }
  50%  { opacity: .55; }
  to   { transform: translate(30px, -60px) rotate(6deg);  opacity: 0; }
}
@keyframes drift2 {
  from { transform: translate(40px, 60px)  rotate(12deg);  opacity: 0; }
  50%  { opacity: .5; }
  to   { transform: translate(-50px, -40px) rotate(-10deg); opacity: 0; }
}
@keyframes drift3 {
  from { transform: translate(-30px, -20px) rotate(6deg);  opacity: 0; }
  50%  { opacity: .6; }
  to   { transform: translate(20px, 40px)   rotate(-4deg); opacity: 0; }
}
@keyframes drift4 {
  from { transform: translate(20px, -50px) rotate(-14deg); opacity: 0; }
  50%  { opacity: .48; }
  to   { transform: translate(-40px, 30px) rotate(10deg);  opacity: 0; }
}

/* Fallbacks */
@supports not (animation-timeline: view()) {
  .hero-bloom { display: none; }
  .hero-bloom-fallback { display: block; }
  .note { animation: none; opacity: .35; }
}
@media (prefers-reduced-motion: reduce) {
  .hero-bloom { display: none; }
  .hero-bloom-fallback { display: block; }
  .note { animation: none; opacity: .35; }
  .hero { animation: none; }
}
```

- [ ] **Step 2: Wire `style-decor.css` into `src/main.js`**

Open `src/main.js`. Add the import at the top:

```javascript
import './style-glass.css'
import './style-decor.css'
import { LiquidLogoCSS } from './LiquidLogoCSS.js'
```

- [ ] **Step 3: Dev-server smoke check**

Run: `npm run dev` (in one terminal; leave running for the next few tasks)
Expected: Vite starts on `http://localhost:5173`, page loads, existing layout unchanged (no washes yet — we haven't added the markup).

- [ ] **Step 4: Commit**

```bash
git add src/style-decor.css src/main.js
git commit -m "feat: add decor stylesheet for washes, hero bloom, and note drift"
```

---

### Task 16: Create `src/hero-bloom.js` canvas scrubber

**Files:**
- Create: `src/hero-bloom.js`
- Modify: `src/main.js`

- [ ] **Step 1: Write `src/hero-bloom.js`**

```javascript
// src/hero-bloom.js
// Scroll-scrubbed canvas: draws a frame from the motion sequence based on
// the CSS --p custom property advanced by `animation-timeline: view()`.

const FRAME_COUNT = 90
const FRAME_PATH_BASE = '/assets/decor/motion/hero'

/**
 * @param {HTMLCanvasElement} canvas
 */
export async function initHeroBloom(canvas) {
  const hero = canvas.closest('.hero')
  if (!hero) return

  const frames = await preloadFrames()
  sizeCanvas(canvas, frames[0])
  window.addEventListener('resize', () => sizeCanvas(canvas, frames[0]))

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const tick = () => {
    const p = parseFloat(getComputedStyle(hero).getPropertyValue('--p')) || 0
    const clamped = Math.min(Math.max(p, 0), 1)
    const idx = Math.min(FRAME_COUNT - 1, Math.floor(clamped * FRAME_COUNT))
    const frame = frames[idx]
    if (frame && frame.complete && frame.naturalWidth > 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(frame, 0, 0, canvas.width, canvas.height)
    }
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

async function preloadFrames() {
  const frames = new Array(FRAME_COUNT)
  const loaders = []
  for (let i = 0; i < FRAME_COUNT; i++) {
    const img = new Image()
    img.src = `${FRAME_PATH_BASE}/${String(i + 1).padStart(3, '0')}.webp`
    frames[i] = img
    loaders.push(img.decode().catch(() => {}))
  }
  // Start scrubbing as soon as the first 10 have decoded so first paint is fast.
  await Promise.all(loaders.slice(0, 10))
  return frames
}

function sizeCanvas(canvas, sampleFrame) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const rect = canvas.getBoundingClientRect()
  canvas.width = Math.round(rect.width * dpr)
  canvas.height = Math.round(rect.height * dpr)
}
```

- [ ] **Step 2: Import and call it from `src/main.js`**

Replace the top of `src/main.js` with:

```javascript
import './style-glass.css'
import './style-decor.css'
import { LiquidLogoCSS } from './LiquidLogoCSS.js'
import { initHeroBloom } from './hero-bloom.js'

const container = document.querySelector('#logo-container')
if (container) {
  const logo = new LiquidLogoCSS(container)
  logo.init()
}

const heroBloomCanvas = document.querySelector('.hero-bloom')
if (heroBloomCanvas && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  initHeroBloom(heroBloomCanvas)
}

initMobileNav()
initSmoothScroll()
// … rest unchanged
```

- [ ] **Step 3: Commit**

```bash
git add src/hero-bloom.js src/main.js
git commit -m "feat: add hero scroll-scrubbed canvas bloom"
```

---

### Task 17: Wire washes into `index.html`

**Files:**
- Modify: `index.html`

At this point only the hero section has real generated assets; other sections will use placeholders until Task 20 generates them.

- [ ] **Step 1: Add the hero canvas + fallback + wash**

Find the existing hero `<section>` in `index.html`. Add these two elements as the FIRST children of the section (before any heading/content):

```html
<canvas class="hero-bloom" aria-hidden="true"></canvas>
<img class="hero-bloom-fallback" src="/assets/decor/motion/hero/poster.webp"
     alt="" aria-hidden="true" />
```

The `hero-bloom` canvas replaces any static wash image inside the hero. The canvas is positioned absolutely via `.hero-bloom` styles; make sure the hero section has `position: relative` in its existing CSS (most hero layouts do).

- [ ] **Step 2: Replace the hero's placeholder orange ellipse (if present)**

Search `index.html` for any decorative div/SVG that represents the old orange blob. Delete it — the canvas is the replacement.

- [ ] **Step 3: Confirm the hero has `position: relative`**

Run: `grep -n "position: relative" public/assets/css/main.css | head -5` (or wherever hero styles live). If the hero isn't `position: relative`, add it to the `.hero` selector in that stylesheet.

- [ ] **Step 4: Dev-server visual check**

With `npm run dev` running, open `http://localhost:5173` and scroll through the hero section.

Expected:
- The hero background shows the watercolor wash, tinted by the cream page bg via multiply blend
- As you scroll through the hero, the wash visibly blooms outward (frames advancing)
- When you reach `prefers-reduced-motion: reduce` (Chrome DevTools → Rendering → Emulate CSS media feature `prefers-reduced-motion: reduce`), the canvas disappears and the poster shows instead.

If the canvas stays blank:
- Open DevTools Console, check for failed frame loads (404s)
- Confirm `getComputedStyle(document.querySelector('.hero')).getPropertyValue('--p')` returns a number between 0 and 1 as you scroll
- If `--p` is always empty, `animation-timeline` isn't supported in your browser — switch to a recent Chrome/Safari, or rely on the `@supports not` poster fallback

- [ ] **Step 5: Commit**

```bash
git add index.html public/assets/css/main.css
git commit -m "feat: wire hero canvas bloom and poster fallback into index"
```

---

### Task 18: Sprinkle `.note` decor elements into existing sections

**Files:**
- Modify: `index.html`

We have SVGs `/assets/images/decor/note-01.svg` through `note-06.svg` and `quill-01.svg`, `quill-02.svg`. Place 2–4 per section with varied `data-drift` variants, at aesthetically pleasing absolute positions.

- [ ] **Step 1: Add a helper structure inside each section**

Immediately before the closing `</section>` of the hero and each feature section, insert a decor block. Example for the hero:

```html
<div class="section-decor" aria-hidden="true">
  <img class="note" data-drift="1" src="/assets/images/decor/note-01.svg" alt=""
       style="top: 14%; left: 8%; width: 42px;" />
  <img class="note" data-drift="3" src="/assets/images/decor/quill-01.svg" alt=""
       style="top: 66%; right: 12%; width: 64px;" />
  <img class="note" data-drift="2" src="/assets/images/decor/note-04.svg" alt=""
       style="bottom: 18%; left: 22%; width: 36px;" />
</div>
```

Do this for each of the nine sections below the hero. Vary the note/quill SVG, the `data-drift` value, and the inline `top/left/right/bottom/width` so they feel scattered rather than uniform. Rough guidance: 2–4 notes per section, sizes 28–72px, randomly placed avoiding the center third where text lives.

- [ ] **Step 2: Ensure the section containers are `position: relative`**

Check `public/assets/css/main.css`: every `<section>` should have `position: relative` (so the absolutely-positioned `.note` children anchor to the section, not the page).

- [ ] **Step 3: Visual check**

Dev server is still running. Reload. Scroll through the page.

Expected: small notes and quills drift in and out as each section enters view. Emulate reduced-motion → notes freeze at `opacity: 0.35`.

- [ ] **Step 4: Commit**

```bash
git add index.html public/assets/css/main.css
git commit -m "feat: sprinkle note and quill decor with CSS view-timeline drift"
```

---

### Task 19: Verify fallbacks work end-to-end

**Files:**
- No new files — verification only

- [ ] **Step 1: Test `prefers-reduced-motion: reduce`**

Chrome DevTools → Rendering panel → set "Emulate CSS media feature `prefers-reduced-motion`" to `reduce`. Reload.

Expected:
- Hero canvas hidden; hero poster image visible instead
- Notes frozen at 0.35 opacity
- No jittery reflow or flash

- [ ] **Step 2: Test `@supports not (animation-timeline: view())`**

In Firefox (which currently ships `animation-timeline` behind `layout.css.scroll-driven-animations.enabled`), toggle that flag OFF in `about:config`. Reload.

Expected:
- Hero canvas hidden; poster visible
- Notes frozen at 0.35 opacity

Alternatively, in a Chromium-based browser, temporarily paste this into DevTools Console to simulate:
```js
document.documentElement.style.setProperty('animation-timeline', 'none !important');
```
The `@supports` fallback wouldn't technically trigger this way, but the visual outcome is close — use Firefox for true verification.

- [ ] **Step 3: Test with JavaScript disabled**

DevTools → Command palette → "Disable JavaScript". Reload.

Expected:
- Stills still render (they're plain `<img>`)
- Canvas is empty (no scrubber running), but the hero poster fallback is also hidden because JS didn't run. This is intentional — the poster shows via `@supports not` / `prefers-reduced-motion`, and without JS the user still sees the cream + static wash still.
- Notes freeze (no `animation-timeline` driver in some browsers, they fall to the `@media` rule fallback).

If the hero looks empty with JS off, add a no-JS CSS fallback by showing the poster when `<html>` lacks a `js` class. Optional polish, not blocking.

- [ ] **Step 4: Take a screenshot and commit a doc of verified matrix**

Append to `scripts/washes/README.md`:

```markdown
## Fallback verification matrix

| Condition | Tested on | Result |
|-----------|-----------|--------|
| `prefers-reduced-motion: reduce` | Chrome DevTools | Canvas hidden, poster shown, notes frozen ✓ |
| `@supports not (animation-timeline)` | Firefox flag off | Canvas hidden, poster shown, notes frozen ✓ |
| JavaScript disabled | Chrome | Stills render, canvas empty, notes frozen ✓ |
```

- [ ] **Step 5: Commit**

```bash
git add scripts/washes/README.md
git commit -m "docs(washes): record fallback verification matrix"
```

---

### Task 20: Expand manifest to all 10 sections and regenerate

**Files:**
- Modify: `scripts/washes/manifest.json`
- Generates: 9 new wash triplets in `public/assets/decor/washes/`

- [ ] **Step 1: Add the nine remaining section entries**

Open `scripts/washes/manifest.json`. Expand the `sections` array. The exact section IDs must match what you used in `index.html`. Typical list:

```json
{
  "id": "f1-chord-editor",
  "mood": "focused, grounded, ink on staff paper",
  "palette": "deep teal with graphite undertone",
  "density": "compact, deliberate",
  "edge": "wet, softly defined",
  "seed": 88104
},
{
  "id": "f2-recording",
  "mood": "quiet studio, late evening",
  "palette": "muted coral over warm sand",
  "density": "medium bloom with uneven density",
  "edge": "feathered with a soft halo",
  "seed": 31247
},
{
  "id": "f3-tuner",
  "mood": "precise, clean, morning light",
  "palette": "cool sage green with hints of silver",
  "density": "small tight bloom",
  "edge": "crisp wet edge",
  "seed": 92041
},
{
  "id": "f4-chord-builder",
  "mood": "constructive, methodical",
  "palette": "dusty rose transitioning to mauve",
  "density": "medium diffuse",
  "edge": "torn, uneven",
  "seed": 45892
},
{
  "id": "f5-setlist",
  "mood": "gathering, communal, stage lighting",
  "palette": "warm ochre with charcoal shadows",
  "density": "broad wash with a quieter center",
  "edge": "soft feathered",
  "seed": 67321
},
{
  "id": "f6-pro-mode",
  "mood": "performance, focused intensity",
  "palette": "deep indigo blending into violet",
  "density": "dense, concentrated",
  "edge": "strong wet edge",
  "seed": 12789
},
{
  "id": "f7-pdf-export",
  "mood": "archival, considered, paper-on-paper",
  "palette": "sepia with umber undertones",
  "density": "light diffuse",
  "edge": "torn",
  "seed": 55678
},
{
  "id": "pricing",
  "mood": "generous, golden hour",
  "palette": "warm honey with faint rose",
  "density": "large soft bloom",
  "edge": "feathered, atmospheric",
  "seed": 38291
},
{
  "id": "footer",
  "mood": "closing, settled, twilight",
  "palette": "slate blue fading into cream",
  "density": "quiet, thin",
  "edge": "very soft feathered",
  "seed": 70456
}
```

Append these inside the `"sections": [ … ]` array, after the existing hero entry.

- [ ] **Step 2: Dry-run the plan**

Run: `npm run washes -- --estimate`

Expected: table lists 10 still rows (hero SKIP if lockfile still matches, nine REGEN) + 1 motion row for hero. Est. cost: ~$0.27.

If any section ID looks wrong or a slot value misses the mark, iterate on `manifest.json` (this is where Claude Code session help is valuable — ask for tweaks).

- [ ] **Step 3: Generate all remaining sections**

Run: `npm run washes -- --stills-only --yes`

Expected:
- Nine new `*.webp` + `*.a.webp` + `*.raw.png` triplets under `public/assets/decor/washes/`
- `washes.lock.json` contains all 10 entries
- Total runtime: ~3–6 minutes (rembg dominates, one image at a time)

If any section fails mid-run: the orchestrator saves the lockfile after each success, so rerun `--only <failed-id>` to resume.

- [ ] **Step 4: Wire the remaining nine washes into `index.html`**

For each of the nine sections, inside the `<section>` immediately after the section's opening tag, add:

```html
<img class="wash wash-tl" src="/assets/decor/washes/<section-id>.webp"
     alt="" aria-hidden="true" loading="lazy" />
```

Vary the positioning class (`wash-tl`, `wash-tr`, `wash-bl`, `wash-br`) across sections so the washes don't all occupy the same corner — this is what gives the page rhythm. Some sections may benefit from two washes (e.g. a `wash-tl` and a `wash-br`); use your taste.

- [ ] **Step 5: Visual QA pass**

Reload `http://localhost:5173`. Scroll through the entire page.

Expected:
- Every section has a subtle watercolor wash in a section-appropriate color
- Washes feel cohesive (consistent "hand"), not jarring
- Cream page background breathes between them
- Notes drift as each section enters view
- Hero wash blooms on scroll

Ugly results? Go back to Task 20 Step 1 — tweak the manifest slot for that section and `npm run washes -- --only <id> --stills-only --force --yes`.

- [ ] **Step 6: Commit**

```bash
git add scripts/washes/manifest.json scripts/washes/washes.lock.json public/assets/decor/ index.html
git commit -m "feat: generate washes for all ten sections and wire into site"
```

---

### Task 21: Final production build + deploy check

**Files:**
- No source changes — verification and handoff

- [ ] **Step 1: Production build**

Run: `npm run build`
Expected: `dist/` directory created with all assets. Exit 0.

Check `dist/assets/decor/` exists and contains the washes + motion frames.

- [ ] **Step 2: Preview the production build**

Run: `npm run preview`
Open the URL it prints (usually `http://localhost:4173`).

Expected: identical experience to dev mode, but served from production build. Scroll through every section once more.

- [ ] **Step 3: Measure total asset weight**

Run: `du -sh dist/assets/decor/` — report the size.
Expected: < 5 MB total (10 washes × ~300KB + 90 motion frames × ~7KB + alphas + poster).

If significantly larger: reduce `cwebp` quality in `post-process.ts` (e.g. quality: 75 instead of 82 for stills) and regenerate.

- [ ] **Step 4: Lighthouse check**

In Chrome DevTools → Lighthouse → Performance audit on `http://localhost:4173`.
Expected: Performance ≥ 85, no red CLS or LCP flags caused by the new assets.

If the hero LCP regressed significantly: add `fetchpriority="high"` to the hero-bloom fallback `<img>` and `preload` the first motion frame in `<head>`.

- [ ] **Step 5: Final commit and push**

```bash
git status   # confirm clean working tree
git log --oneline -20   # sanity-check the task commits
# If on a feature branch, push and open a PR; otherwise we're done.
```

- [ ] **Step 6: Update CLAUDE.md and design spec status**

Open `docs/superpowers/specs/2026-04-17-hedra-watercolor-pipeline-design.md` and change the header:

```
**Status:** Approved for planning
```

to:

```
**Status:** Implemented 2026-04-17
```

Open `CLAUDE.md` and, near the bottom under "Common Tasks", add:

```markdown
### Regenerate watercolor washes

```bash
npm run washes -- --estimate           # preview plan + cost
npm run washes -- --only hero --force  # regenerate one section
npm run washes -- --yes                # full regen
```

See `docs/superpowers/specs/2026-04-17-hedra-watercolor-pipeline-design.md` for the full design.
```

- [ ] **Step 7: Commit**

```bash
git add docs/superpowers/specs/2026-04-17-hedra-watercolor-pipeline-design.md CLAUDE.md
git commit -m "docs: mark Hedra wash pipeline as implemented"
```

---

## Out of Scope (for this plan)

- Runtime A/B testing of multiple wash variants
- Motion for non-hero sections
- Dark-mode theme swap using the `.a.webp` alpha variants
- WebGL-based watercolor rendering
- Localization / geolocation-based palette variants
- Generating notes/quills SVGs themselves (existing hand-drawn assets are reused)

## Rollback

Every asset is committed. Revert any bad regeneration with a single git revert of the commit introducing it. The lockfile commits alongside the assets, so reverting `washes.lock.json` + `public/assets/decor/` together restores a consistent state.

The shipped site does not make any API calls. If Hedra changes or goes down, the committed assets keep shipping indefinitely.
