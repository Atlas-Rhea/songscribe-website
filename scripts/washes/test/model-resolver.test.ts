import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveModelId } from '../src/model-resolver.ts';
import type { HedraModel } from '../src/hedra-client.ts';

const MODELS: HedraModel[] = [
  { id: 'uuid-flux-dev', name: 'Flux Dev' },
  { id: 'uuid-nano-banana-pro', name: 'Nano Banana Pro T2I' },
  { id: 'uuid-grok', name: 'Grok Video I2V' },
];

describe('resolveModelId', () => {
  it('resolves a dashed slug to its matching name UUID (case-insensitive)', () => {
    // #given / #when / #then
    assert.equal(resolveModelId('flux-dev', MODELS), 'uuid-flux-dev');
    assert.equal(resolveModelId('Flux-Dev', MODELS), 'uuid-flux-dev');
    assert.equal(resolveModelId('grok-video-i2v', MODELS), 'uuid-grok');
    assert.equal(resolveModelId('nano-banana-pro-t2i', MODELS), 'uuid-nano-banana-pro');
  });

  it('returns the slug verbatim if it already looks like a UUID', () => {
    // #given
    const raw = '550e8400-e29b-41d4-a716-446655440000';

    // #when / #then
    assert.equal(resolveModelId(raw, MODELS), raw);
  });

  it('throws a helpful error listing available names on miss', () => {
    // #given / #when / #then
    assert.throws(
      () => resolveModelId('not-a-model', MODELS),
      /not-a-model.*Flux Dev.*Nano Banana Pro T2I.*Grok Video I2V/s,
    );
  });
});
