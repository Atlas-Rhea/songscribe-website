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
