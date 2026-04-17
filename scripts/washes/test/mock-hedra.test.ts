import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createMockFetch } from '../src/mock-hedra.ts';

const BASE = 'https://api.hedra.com';

describe('createMockFetch', () => {
  it('returns the two canonical models on GET /models', async () => {
    // #given
    const fetchImpl = createMockFetch();

    // #when
    const res = await fetchImpl(`${BASE}/web-app/public/models`);
    const body = (await res.json()) as Array<{ id: string; display_name: string }>;

    // #then
    assert.equal(res.status, 200);
    assert.equal(body.length, 2);
    assert.equal(body[0]?.display_name, 'FLUX Dev');
    assert.equal(body[1]?.display_name, 'Veo 3.1 Fast');
  });

  it('routes an image job end-to-end to real PNG bytes', async () => {
    // #given
    const fetchImpl = createMockFetch();

    // #when
    const createRes = await fetchImpl(`${BASE}/web-app/public/generations`, {
      method: 'POST',
      body: JSON.stringify({ type: 'image', ai_model_id: 'm' }),
    });
    const { id } = (await createRes.json()) as { id: string };
    const statusRes = await fetchImpl(`${BASE}/web-app/public/generations/${id}/status`);
    const status = (await statusRes.json()) as { status: string; url?: string };
    assert.equal(status.status, 'complete');
    const pngRes = await fetchImpl(status.url!);
    const bytes = new Uint8Array(await pngRes.arrayBuffer());

    // #then — PNG magic number: 89 50 4E 47
    assert.equal(bytes[0], 0x89);
    assert.equal(bytes[1], 0x50);
    assert.equal(bytes[2], 0x4e);
    assert.equal(bytes[3], 0x47);
    assert.ok(bytes.length > 100);
  });

  it('routes a video job end-to-end to real MP4 bytes', async () => {
    // #given
    const fetchImpl = createMockFetch();

    // #when
    const createRes = await fetchImpl(`${BASE}/web-app/public/generations`, {
      method: 'POST',
      body: JSON.stringify({ type: 'video', ai_model_id: 'm', start_keyframe_id: 'k' }),
    });
    const { id } = (await createRes.json()) as { id: string };
    const statusRes = await fetchImpl(`${BASE}/web-app/public/generations/${id}/status`);
    const status = (await statusRes.json()) as { url?: string };
    const mp4Res = await fetchImpl(status.url!);
    const bytes = new Uint8Array(await mp4Res.arrayBuffer());

    // #then — MP4: "ftyp" box at bytes 4..8
    const ftypMarker = String.fromCharCode(bytes[4]!, bytes[5]!, bytes[6]!, bytes[7]!);
    assert.equal(ftypMarker, 'ftyp');
    assert.ok(bytes.length > 1000);
  });

  it('completes the two-step asset upload handshake', async () => {
    // #given
    const fetchImpl = createMockFetch();

    // #when
    const createRes = await fetchImpl(`${BASE}/web-app/public/assets`, {
      method: 'POST',
      body: JSON.stringify({ name: 'x.png', type: 'image' }),
    });
    const { id } = (await createRes.json()) as { id: string };
    const uploadRes = await fetchImpl(`${BASE}/web-app/public/assets/${id}/upload`, {
      method: 'POST',
      body: new FormData(),
    });

    // #then
    assert.match(id, /^mock-asset-/);
    assert.equal(uploadRes.status, 200);
  });

  it('returns 501 for unrouted paths', async () => {
    // #given
    const fetchImpl = createMockFetch();

    // #when
    const res = await fetchImpl(`${BASE}/definitely/not/a/route`);

    // #then
    assert.equal(res.status, 501);
  });
});
