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
