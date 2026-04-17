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
