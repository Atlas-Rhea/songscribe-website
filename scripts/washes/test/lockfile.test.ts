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
