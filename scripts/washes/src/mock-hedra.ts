/**
 * In-process mock of the Hedra public API.
 *
 * Plug into HedraClient via the fetchImpl option:
 *   new HedraClient({ apiKey: 'mock', fetchImpl: createMockFetch() })
 *
 * The mock routes every endpoint HedraClient actually calls and produces
 * *real* PNG and MP4 bytes via ffmpeg lavfi (solid amber) so downstream
 * stages (cwebp, ffmpeg frame extraction) operate on valid files. Nothing
 * here hits the network.
 *
 * Results are cached per process — ffmpeg runs at most twice (once per
 * media type) regardless of how many sections the manifest defines.
 *
 * Intended for end-to-end plumbing validation — *not* for real pixel
 * output. Remove --mock for actual content generation.
 */

import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const MOCK_IMAGE_MODEL_ID = '11111111-1111-4111-8111-111111111111';
const MOCK_VIDEO_MODEL_ID = '22222222-2222-4222-8222-222222222222';
const MOCK_CDN_HOST = 'mock.hedra.test';

let cachedStill: Promise<Uint8Array> | null = null;
let cachedVideo: Promise<Uint8Array> | null = null;

async function generateSolidPng(): Promise<Uint8Array> {
  const dir = await mkdtemp(join(tmpdir(), 'mock-hedra-still-'));
  const out = join(dir, 'still.png');
  try {
    await execFileAsync('ffmpeg', [
      '-y',
      '-loglevel', 'error',
      '-f', 'lavfi',
      '-i', 'color=c=0xFBBF24:s=1024x1024:d=0.1',
      '-frames:v', '1',
      out,
    ]);
    return new Uint8Array(await readFile(out));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function generateSolidMp4(): Promise<Uint8Array> {
  const dir = await mkdtemp(join(tmpdir(), 'mock-hedra-video-'));
  const out = join(dir, 'video.mp4');
  try {
    await execFileAsync('ffmpeg', [
      '-y',
      '-loglevel', 'error',
      '-f', 'lavfi',
      '-i', 'color=c=0xFBBF24:s=1200x1200:d=6',
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-r', '15',
      out,
    ]);
    return new Uint8Array(await readFile(out));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

const getStill = (): Promise<Uint8Array> => (cachedStill ??= generateSolidPng());
const getVideo = (): Promise<Uint8Array> => (cachedVideo ??= generateSolidMp4());

export function createMockFetch(): typeof fetch {
  const jobs = new Map<string, { type: 'image' | 'video'; assetId: string }>();
  const outputs = new Map<string, { type: 'image' | 'video'; jobId: string }>();
  let jobCounter = 0;
  let assetCounter = 0;

  const handler = async (
    input: URL | RequestInfo,
    init?: RequestInit,
  ): Promise<Response> => {
    const rawUrl =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    const u = new URL(rawUrl);
    const path = u.pathname;
    const method = (init?.method ?? 'GET').toUpperCase();

    if (method === 'GET' && path === '/web-app/public/models') {
      return Response.json([
        { id: MOCK_IMAGE_MODEL_ID, name: 'Flux Dev' },
        { id: MOCK_VIDEO_MODEL_ID, name: 'Grok Video I2V' },
      ]);
    }

    // Uploaded-keyframe asset creation (video flow, step 1)
    if (method === 'POST' && path === '/web-app/public/assets') {
      return Response.json({ id: `mock-asset-${++assetCounter}` });
    }

    if (method === 'POST' && /^\/web-app\/public\/assets\/[^/]+\/upload$/.test(path)) {
      return new Response(null, { status: 200 });
    }

    if (method === 'POST' && path === '/web-app/public/generations') {
      const body = JSON.parse(String(init?.body ?? '{}')) as { type?: string };
      const type: 'image' | 'video' = body.type === 'video' ? 'video' : 'image';
      const id = `mock-job-${++jobCounter}`;
      const assetId = `mock-output-${++assetCounter}`;
      jobs.set(id, { type, assetId });
      outputs.set(assetId, { type, jobId: id });
      return Response.json({ id, asset_id: assetId, type });
    }

    const statusMatch = path.match(/^\/web-app\/public\/generations\/([^/]+)\/status$/);
    if (method === 'GET' && statusMatch) {
      const jobId = statusMatch[1];
      if (!jobId) return new Response('mock: malformed status url', { status: 500 });
      const info = jobs.get(jobId);
      if (!info) {
        return Response.json({ status: 'error', error_message: `Unknown mock job ${jobId}` });
      }
      return Response.json({
        status: 'complete',
        asset_id: info.assetId,
        url: null,
      });
    }

    // GET /assets?type={image|video}&ids={asset_id} — post-completion lookup
    if (method === 'GET' && path === '/web-app/public/assets') {
      const type = u.searchParams.get('type');
      const ids = u.searchParams.get('ids');
      if (!type || !ids) {
        return new Response('mock: /assets requires type and ids', { status: 422 });
      }
      const info = outputs.get(ids);
      if (!info || info.type !== type) {
        return Response.json([]);
      }
      const ext = type === 'image' ? 'png' : 'mp4';
      const kind = type === 'image' ? 'still' : 'video';
      return Response.json([
        {
          id: ids,
          type,
          asset: {
            type: `generated_${type}`,
            url: `https://${MOCK_CDN_HOST}/${kind}/${info.jobId}.${ext}`,
          },
        },
      ]);
    }

    if (method === 'GET' && u.hostname === MOCK_CDN_HOST && path.startsWith('/still/')) {
      const bytes = await getStill();
      return new Response(new Blob([bytes as unknown as BlobPart]), {
        status: 200,
        headers: { 'content-type': 'image/png' },
      });
    }

    if (method === 'GET' && u.hostname === MOCK_CDN_HOST && path.startsWith('/video/')) {
      const bytes = await getVideo();
      return new Response(new Blob([bytes as unknown as BlobPart]), {
        status: 200,
        headers: { 'content-type': 'video/mp4' },
      });
    }

    return new Response(`mock-hedra: unhandled ${method} ${rawUrl}`, { status: 501 });
  };

  return handler as unknown as typeof fetch;
}
