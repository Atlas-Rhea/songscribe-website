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
