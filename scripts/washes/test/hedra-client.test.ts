import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { HedraClient } from '../src/hedra-client.ts';

const PNG_MAGIC = new Uint8Array([137, 80, 78, 71]);

/**
 * Build a fake fetch that replies to a scripted sequence of URL-substring checks.
 * Each entry matches in order; first match wins, then advances the cursor.
 * This keeps tests declarative without pulling in a mocking library.
 */
function scriptedFetch(
  steps: Array<{ match: RegExp; reply: () => Response }>,
): { fetchImpl: typeof fetch; calls: Array<{ url: string; init: RequestInit }> } {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  let i = 0;
  const fetchImpl: typeof fetch = async (url, init) => {
    const u = String(url);
    calls.push({ url: u, init: init ?? {} });
    const step = steps[i];
    if (!step || !step.match.test(u)) {
      throw new Error(`scriptedFetch got unexpected request #${i}: ${u}`);
    }
    i++;
    return step.reply();
  };
  return { fetchImpl, calls };
}

describe('HedraClient.generateImage', () => {
  it('creates a job, polls until complete, fetches bytes from the asset URL', async () => {
    // #given
    const { fetchImpl, calls } = scriptedFetch([
      // POST /generations → returns a job id
      { match: /\/generations$/, reply: () =>
        new Response(JSON.stringify({ id: 'job-123', asset_id: 'a1', type: 'image' }), {
          status: 200, headers: { 'content-type': 'application/json' },
        }),
      },
      // GET /generations/job-123/status → still queued
      { match: /\/generations\/job-123\/status$/, reply: () =>
        new Response(JSON.stringify({ status: 'queued' }), {
          status: 200, headers: { 'content-type': 'application/json' },
        }),
      },
      // GET /generations/job-123/status → complete + url
      { match: /\/generations\/job-123\/status$/, reply: () =>
        new Response(JSON.stringify({ status: 'complete', url: 'https://cdn.hedra.com/a1.png' }), {
          status: 200, headers: { 'content-type': 'application/json' },
        }),
      },
      // GET the CDN asset → PNG bytes
      { match: /cdn\.hedra\.com\/a1\.png$/, reply: () =>
        new Response(PNG_MAGIC, { status: 200, headers: { 'content-type': 'image/png' } }),
      },
    ]);
    const client = new HedraClient({
      apiKey: 'test-key', fetchImpl, pollIntervalMs: 0, retryDelayMs: 0,
    });

    // #when
    const result = await client.generateImage({
      prompt: 'x', modelId: 'model-uuid-abc', size: '2048x2048', seed: 1,
    });

    // #then
    assert.equal(calls.length, 4);
    assert.match(calls[0]!.url, /\/web-app\/public\/generations$/);
    assert.equal(calls[0]!.init.method, 'POST');
    const createHeaders = calls[0]!.init.headers as Record<string, string>;
    assert.equal(createHeaders['x-api-key'], 'test-key');
    assert.equal(createHeaders['Content-Type'], 'application/json');
    const createBody = JSON.parse(calls[0]!.init.body as string);
    assert.equal(createBody.type, 'image');
    assert.equal(createBody.ai_model_id, 'model-uuid-abc');
    assert.equal(createBody.generated_image_inputs.text_prompt, 'x');
    assert.equal(createBody.generated_image_inputs.aspect_ratio, '1:1');
    assert.equal(createBody.generated_image_inputs.seed, 1);
    assert.equal(result.bytes.byteLength, 4);
    assert.equal(result.contentType, 'image/png');
  });

  it('retries once on 5xx at job creation, then succeeds', async () => {
    // #given
    const { fetchImpl } = scriptedFetch([
      { match: /\/generations$/, reply: () => new Response('boom', { status: 503 }) },
      { match: /\/generations$/, reply: () =>
        new Response(JSON.stringify({ id: 'job-retry', type: 'image' }), {
          status: 200, headers: { 'content-type': 'application/json' },
        }),
      },
      { match: /\/generations\/job-retry\/status$/, reply: () =>
        new Response(JSON.stringify({ status: 'complete', url: 'https://cdn.hedra.com/r.png' }), {
          status: 200, headers: { 'content-type': 'application/json' },
        }),
      },
      { match: /cdn\.hedra\.com\/r\.png$/, reply: () =>
        new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { 'content-type': 'image/png' } }),
      },
    ]);
    const client = new HedraClient({
      apiKey: 'k', fetchImpl, pollIntervalMs: 0, retryDelayMs: 0,
    });

    // #when
    const result = await client.generateImage({
      prompt: 'x', modelId: 'm', size: '1024x1024', seed: 1,
    });

    // #then
    assert.equal(result.bytes.byteLength, 3);
  });

  it('fails loud on 4xx at job creation (no retry)', async () => {
    // #given
    let n = 0;
    const fetchImpl: typeof fetch = async () => {
      n++;
      return new Response('bad prompt', { status: 400 });
    };
    const client = new HedraClient({
      apiKey: 'k', fetchImpl, pollIntervalMs: 0, retryDelayMs: 0,
    });

    // #when / #then
    await assert.rejects(
      () => client.generateImage({ prompt: 'x', modelId: 'm', size: '1024x1024', seed: 1 }),
      /HTTP 400/,
    );
    assert.equal(n, 1);
  });

  it('throws if polling reports a failed job', async () => {
    // #given
    const { fetchImpl } = scriptedFetch([
      { match: /\/generations$/, reply: () =>
        new Response(JSON.stringify({ id: 'job-fail', type: 'image' }), {
          status: 200, headers: { 'content-type': 'application/json' },
        }),
      },
      { match: /\/generations\/job-fail\/status$/, reply: () =>
        new Response(JSON.stringify({ status: 'error', error_message: 'nsfw content' }), {
          status: 200, headers: { 'content-type': 'application/json' },
        }),
      },
    ]);
    const client = new HedraClient({
      apiKey: 'k', fetchImpl, pollIntervalMs: 0, retryDelayMs: 0,
    });

    // #when / #then
    await assert.rejects(
      () => client.generateImage({ prompt: 'x', modelId: 'm', size: '1024x1024', seed: 1 }),
      /nsfw content/,
    );
  });
});

describe('HedraClient.listModels', () => {
  it('GETs /models and returns the array', async () => {
    // #given
    const models = [
      { id: 'u1', display_name: 'FLUX Dev' },
      { id: 'u2', display_name: 'Seedream 4.0' },
    ];
    const fetchImpl: typeof fetch = async (url, init) => {
      assert.match(String(url), /\/web-app\/public\/models$/);
      assert.equal((init?.headers as Record<string, string>)['x-api-key'], 'k');
      return new Response(JSON.stringify(models), {
        status: 200, headers: { 'content-type': 'application/json' },
      });
    };
    const client = new HedraClient({ apiKey: 'k', fetchImpl });

    // #when
    const result = await client.listModels();

    // #then
    assert.deepEqual(result, models);
  });
});
