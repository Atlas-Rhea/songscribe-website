/**
 * Hedra public API client.
 *
 * Endpoint contract (verified 2026-04-17 against
 * https://github.com/hedra-labs/hedra-api-starter/blob/main/main.py):
 *   - Base URL:     https://api.hedra.com
 *   - POST          /web-app/public/generations               → { id, asset_id, type, ai_model_id }
 *   - GET           /web-app/public/generations/{id}/status   → { status, url?, error_message? }
 *   - GET           /web-app/public/models                    → [{ id, display_name, ... }, ...]
 *   - Auth header:  x-api-key: <key>   (NOT Authorization: Bearer)
 *
 * Image request body:
 *   {
 *     "type": "image",
 *     "ai_model_id": "<model UUID from /models>",
 *     "generated_image_inputs": {
 *       "text_prompt":  "<prompt>",
 *       "aspect_ratio": "1:1" | "16:9" | "9:16" | ...,
 *       "resolution":   "1K" | "2K" | "4K",
 *       "seed":         <int, optional>
 *     }
 *   }
 *
 * Flow: POST creates an async job → poll status until "complete" → fetch
 * the presigned CDN url from the status payload → that's the actual image.
 *
 * Retry policy: one retry on 5xx at job creation. Poll errors do not retry;
 * a status of "error" surfaces error_message verbatim.
 */

export interface HedraClientOptions {
  apiKey: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  /** Delay between status polls. Default 2000ms; tests pass 0. */
  pollIntervalMs?: number;
  /** Delay before retrying a failed POST /generations. Default 3000ms. */
  retryDelayMs?: number;
  /** Max polls before giving up. Default 150 (≈5 min at 2s). */
  maxPolls?: number;
}

export interface GenerateImageRequest {
  prompt: string;
  /** Hedra model UUID (resolve via listModels() from a slug). */
  modelId: string;
  /** "WxH" string; mapped to aspect_ratio/resolution. */
  size: string;
  seed: number;
}

export interface GenerateImageResult {
  bytes: Uint8Array;
  contentType: string;
}

export interface HedraModel {
  id: string;
  display_name: string;
  [k: string]: unknown;
}

const DEFAULT_BASE = 'https://api.hedra.com';
const GENERATIONS_PATH = '/web-app/public/generations';
const MODELS_PATH = '/web-app/public/models';

export class HedraClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly pollIntervalMs: number;
  private readonly retryDelayMs: number;
  private readonly maxPolls: number;

  constructor(opts: HedraClientOptions) {
    this.apiKey = opts.apiKey;
    this.baseUrl = opts.baseUrl ?? DEFAULT_BASE;
    this.fetchImpl = opts.fetchImpl ?? fetch;
    this.pollIntervalMs = opts.pollIntervalMs ?? 2000;
    this.retryDelayMs = opts.retryDelayMs ?? 3000;
    this.maxPolls = opts.maxPolls ?? 150;
  }

  async listModels(): Promise<HedraModel[]> {
    const url = `${this.baseUrl}${MODELS_PATH}`;
    const res = await this.fetchImpl(url, {
      method: 'GET',
      headers: { 'x-api-key': this.apiKey },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} from Hedra listModels: ${await res.text()}`);
    }
    return (await res.json()) as HedraModel[];
  }

  async generateImage(req: GenerateImageRequest): Promise<GenerateImageResult> {
    const [wStr, hStr] = req.size.split('x');
    const w = Number(wStr);
    const h = Number(hStr);
    if (!Number.isFinite(w) || !Number.isFinite(h)) {
      throw new Error(`Invalid size "${req.size}"; expected "WxH" like "2048x2048".`);
    }
    const body = JSON.stringify({
      type: 'image',
      ai_model_id: req.modelId,
      generated_image_inputs: {
        text_prompt: req.prompt,
        aspect_ratio: aspectRatio(w, h),
        resolution: resolutionLabel(Math.max(w, h)),
        seed: req.seed,
      },
    });

    const job = await this.createJob(body);
    const asset = await this.pollUntilComplete(job.id);
    return this.downloadAsset(asset.url);
  }

  private async createJob(body: string): Promise<{ id: string }> {
    const url = `${this.baseUrl}${GENERATIONS_PATH}`;
    const init: RequestInit = {
      method: 'POST',
      headers: { 'x-api-key': this.apiKey, 'Content-Type': 'application/json' },
      body,
    };
    const res = await this.fetchImpl(url, init);
    if (res.ok) return (await res.json()) as { id: string };
    if (res.status >= 500 && res.status < 600) {
      await sleep(this.retryDelayMs);
      const retry = await this.fetchImpl(url, init);
      if (retry.ok) return (await retry.json()) as { id: string };
      throw new Error(`HTTP ${retry.status} from Hedra createJob (after retry): ${await retry.text()}`);
    }
    throw new Error(`HTTP ${res.status} from Hedra createJob: ${await res.text()}`);
  }

  private async pollUntilComplete(jobId: string): Promise<{ url: string }> {
    const url = `${this.baseUrl}${GENERATIONS_PATH}/${jobId}/status`;
    for (let i = 0; i < this.maxPolls; i++) {
      const res = await this.fetchImpl(url, {
        method: 'GET',
        headers: { 'x-api-key': this.apiKey },
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} from Hedra poll: ${await res.text()}`);
      }
      const payload = (await res.json()) as {
        status: string;
        url?: string;
        error_message?: string;
      };
      if (payload.status === 'complete') {
        if (!payload.url) throw new Error('Hedra reported complete but no asset url.');
        return { url: payload.url };
      }
      if (payload.status === 'error' || payload.status === 'failed') {
        throw new Error(`Hedra job ${jobId} failed: ${payload.error_message ?? 'unknown error'}`);
      }
      await sleep(this.pollIntervalMs);
    }
    throw new Error(`Hedra job ${jobId} timed out after ${this.maxPolls} polls.`);
  }

  private async downloadAsset(assetUrl: string): Promise<GenerateImageResult> {
    const res = await this.fetchImpl(assetUrl);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} downloading asset from ${assetUrl}`);
    }
    const buf = new Uint8Array(await res.arrayBuffer());
    return { bytes: buf, contentType: res.headers.get('content-type') ?? 'image/png' };
  }
}

/** Map "WxH" to Hedra's aspect_ratio literal. */
function aspectRatio(w: number, h: number): string {
  if (w === h) return '1:1';
  const g = gcd(w, h);
  return `${w / g}:${h / g}`;
}

/** Map the longer edge to Hedra's resolution label. */
function resolutionLabel(longEdge: number): string {
  if (longEdge >= 3500) return '4K';
  if (longEdge >= 1700) return '2K';
  return '1K';
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
