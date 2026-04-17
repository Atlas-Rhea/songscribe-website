/**
 * Hedra public API client.
 *
 * Endpoint contract (verified live 2026-04-17; the published hedra-api-starter
 * main.py is OUT OF DATE — different body shape, and no URL on status):
 *   - Base URL:     https://api.hedra.com
 *   - POST          /web-app/public/generations
 *       → { id, asset_id, type, status: "queued", ... }
 *   - GET           /web-app/public/generations/{id}/status
 *       → { status, asset_id, url: null, download_url: null, streaming_url: null, ... }
 *         (status transitions queued → finalizing → complete; `url` stays
 *          null — the result URL is NOT on this endpoint, see below)
 *   - GET           /web-app/public/assets?type={image|video}&ids={asset_id}
 *       → [{ id, asset: { url, width, height, type }, ... }]
 *         (THIS is where the signed CDN URL lives; call after status=complete.
 *          `type` param is REQUIRED; `ids` selects the specific asset.)
 *   - GET           /web-app/public/models
 *       → [{ id, name, type, resolutions, aspect_ratios, ... }, ...]
 *   - POST          /web-app/public/assets                    → { id }   (video flow)
 *   - POST          /web-app/public/assets/{id}/upload        → 200 OK   (video flow, multipart)
 *   - Auth header:  x-api-key: <key>   (NOT Authorization: Bearer; NOT on CDN fetches)
 *
 * Image request body (FLAT — verified live 2026-04-17 against Nano Banana
 * Pro T2I and Flux Dev; the hedra-api-starter main.py uses an outdated
 * `generated_image_inputs` wrapper that returns 422):
 *   {
 *     "type":         "image",
 *     "ai_model_id":  "<model UUID from /models>",
 *     "text_prompt":  "<prompt>",
 *     "aspect_ratio": "1:1" | "16:9" | "9:16" | ...,
 *     "resolution":   "1K" | "2K" | "4K"   // model-specific literals
 *     "seed":         <int, optional>
 *   }
 *
 * Video request body (image-to-video; no audio — still uses the nested
 * wrapper, unlike image):
 *   {
 *     "type": "video",
 *     "ai_model_id":       "<video model UUID from /models>",
 *     "start_keyframe_id": "<asset UUID from POST /assets>",
 *     "generated_video_inputs": {
 *       "text_prompt":  "<prompt>",
 *       "aspect_ratio": "16:9" | "9:16" | "1:1",
 *       "resolution":   "540p" | "720p",     // NB: not "1K"/"2K" like image
 *       "duration_ms":  <int milliseconds, optional>,
 *       "seed":         <int, optional>
 *     }
 *   }
 *   NOTE: start_keyframe_id sits at the TOP level of the body — NOT nested
 *   inside generated_video_inputs.
 *
 * Upload flow (video only): bytes become an "asset" via two POSTs against
 * the Hedra origin (NO presigned S3 step):
 *   1. POST /web-app/public/assets            JSON {name, type:"image"}  → { id }
 *   2. POST /web-app/public/assets/{id}/upload  multipart file=<bytes>    → 200
 * Both carry the x-api-key header.
 *
 * Duration unit: callers pass seconds (matches manifest.json motion.duration);
 * animateImage() converts to milliseconds internally for the wire format.
 *
 * Flow (both image and video): POST creates an async job → poll status
 * until "complete" → fetch the presigned CDN url from the status payload.
 *
 * Retry policy: one retry on 5xx at job creation. Poll errors do not retry;
 * a status of "error" surfaces error_message verbatim. Asset upload has no
 * retry — a bad upload fails fast.
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

export interface AnimateImageRequest {
  /** Raw image bytes (PNG or JPEG) to use as the first frame. */
  imageBytes: Uint8Array;
  /** Filename hint sent in the asset-creation step (e.g. "hero-still.png"). */
  imageName: string;
  prompt: string;
  /** Hedra video model UUID (resolve via listModels() from a slug). */
  modelId: string;
  /** "WxH" string of the input still; only used to derive aspect_ratio. */
  size: string;
  /** Hedra video resolution literal. */
  resolution: '540p' | '720p';
  /** Duration in SECONDS; converted to duration_ms on the wire. */
  durationSeconds: number;
  seed: number;
}

export interface AnimateImageResult {
  bytes: Uint8Array;
  contentType: string;
}

export interface HedraModel {
  id: string;
  /** Hedra calls this `name` — not `display_name`. Verified live 2026-04-17. */
  name: string;
  [k: string]: unknown;
}

const DEFAULT_BASE = 'https://api.hedra.com';
const GENERATIONS_PATH = '/web-app/public/generations';
const MODELS_PATH = '/web-app/public/models';
const ASSETS_PATH = '/web-app/public/assets';

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
      text_prompt: req.prompt,
      aspect_ratio: aspectRatio(w, h),
      resolution: resolutionLabel(Math.max(w, h)),
      seed: req.seed,
    });

    const job = await this.createJob(body);
    const assetId = await this.pollUntilComplete(job.id);
    const url = await this.resolveAssetUrl(assetId, 'image');
    return this.downloadAsset(url, 'image/png');
  }

  async animateImage(req: AnimateImageRequest): Promise<AnimateImageResult> {
    const [wStr, hStr] = req.size.split('x');
    const w = Number(wStr);
    const h = Number(hStr);
    if (!Number.isFinite(w) || !Number.isFinite(h)) {
      throw new Error(`Invalid size "${req.size}"; expected "WxH" like "2048x2048".`);
    }

    const assetId = await this.uploadImageAsset(req.imageBytes, req.imageName);

    const body = JSON.stringify({
      type: 'video',
      ai_model_id: req.modelId,
      start_keyframe_id: assetId,
      generated_video_inputs: {
        text_prompt: req.prompt,
        aspect_ratio: aspectRatio(w, h),
        resolution: req.resolution,
        duration_ms: Math.round(req.durationSeconds * 1000),
        seed: req.seed,
      },
    });

    const job = await this.createJob(body);
    const resultAssetId = await this.pollUntilComplete(job.id);
    const url = await this.resolveAssetUrl(resultAssetId, 'video');
    return this.downloadAsset(url, 'video/mp4');
  }

  private async uploadImageAsset(bytes: Uint8Array, name: string): Promise<string> {
    const createUrl = `${this.baseUrl}${ASSETS_PATH}`;
    const createRes = await this.fetchImpl(createUrl, {
      method: 'POST',
      headers: { 'x-api-key': this.apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type: 'image' }),
    });
    if (!createRes.ok) {
      throw new Error(`HTTP ${createRes.status} from Hedra createAsset: ${await createRes.text()}`);
    }
    const { id } = (await createRes.json()) as { id: string };

    const form = new FormData();
    const blob = new Blob([bytes as unknown as BlobPart]);
    form.append('file', blob, name);

    const uploadUrl = `${this.baseUrl}${ASSETS_PATH}/${id}/upload`;
    const uploadRes = await this.fetchImpl(uploadUrl, {
      method: 'POST',
      headers: { 'x-api-key': this.apiKey },
      body: form,
    });
    if (!uploadRes.ok) {
      throw new Error(`HTTP ${uploadRes.status} from Hedra uploadAsset: ${await uploadRes.text()}`);
    }
    return id;
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

  private async pollUntilComplete(jobId: string): Promise<string> {
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
        asset_id?: string;
        error_message?: string;
      };
      if (payload.status === 'complete') {
        if (!payload.asset_id) {
          throw new Error(`Hedra job ${jobId} complete but no asset_id in status payload.`);
        }
        return payload.asset_id;
      }
      if (payload.status === 'error' || payload.status === 'failed') {
        throw new Error(`Hedra job ${jobId} failed: ${payload.error_message ?? 'unknown error'}`);
      }
      await sleep(this.pollIntervalMs);
    }
    throw new Error(`Hedra job ${jobId} timed out after ${this.maxPolls} polls.`);
  }

  /**
   * Resolve an asset UUID to its signed CDN URL. Must be called after the
   * generation status is "complete" — the URL is NOT on the status payload,
   * despite having `url`/`download_url` fields that sit perpetually null.
   * The `type` query param is required; passing "image" for a video asset
   * returns an empty array (silent miss).
   */
  private async resolveAssetUrl(assetId: string, type: 'image' | 'video'): Promise<string> {
    const url = `${this.baseUrl}${ASSETS_PATH}?type=${type}&ids=${assetId}`;
    const res = await this.fetchImpl(url, {
      method: 'GET',
      headers: { 'x-api-key': this.apiKey },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} from Hedra assets lookup: ${await res.text()}`);
    }
    const list = (await res.json()) as Array<{ id: string; asset?: { url?: string } }>;
    const hit = list.find((a) => a.id === assetId);
    if (!hit?.asset?.url) {
      throw new Error(
        `Asset ${assetId} (${type}) had no CDN url. Response: ${JSON.stringify(list).slice(0, 300)}`,
      );
    }
    return hit.asset.url;
  }

  private async downloadAsset(
    assetUrl: string,
    defaultContentType: string,
  ): Promise<{ bytes: Uint8Array; contentType: string }> {
    const res = await this.fetchImpl(assetUrl);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} downloading asset from ${assetUrl}`);
    }
    const buf = new Uint8Array(await res.arrayBuffer());
    return { bytes: buf, contentType: res.headers.get('content-type') ?? defaultContentType };
  }
}

/** Map "WxH" to Hedra's aspect_ratio literal. */
function aspectRatio(w: number, h: number): string {
  if (w === h) return '1:1';
  const g = gcd(w, h);
  return `${w / g}:${h / g}`;
}

/**
 * Map the longer edge to a Hedra image resolution literal.
 *
 * CAUTION — the literal set is MODEL-SPECIFIC (verified live 2026-04-17):
 *   Nano Banana Pro T2I → "1K" | "2K" | "4K"
 *   Flux Dev            → "540p" | "720p" | "1080p" | "1440p (2K QHD)" | "2160p (4K UHD)"
 *   Nano Banana T2I     → (empty — no resolution parameter)
 * This helper emits the Nano Banana Pro scheme because that's what the
 * manifest uses for stills. Swap models and this mapping must change too.
 */
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
