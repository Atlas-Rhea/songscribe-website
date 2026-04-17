import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveModelId } from '../src/model-resolver.ts';
import type { HedraModel } from '../src/hedra-client.ts';

const MODELS: HedraModel[] = [
  { id: 'uuid-flux-dev', display_name: 'FLUX Dev' },
  { id: 'uuid-seedream', display_name: 'Seedream 4.0' },
  { id: 'uuid-veo', display_name: 'Veo 3.1 Fast' },
];

describe('resolveModelId', () => {
  it('resolves a dashed slug to its matching display_name UUID (case-insensitive)', () => {
    // #given / #when / #then
    assert.equal(resolveModelId('flux-dev', MODELS), 'uuid-flux-dev');
    assert.equal(resolveModelId('Flux-Dev', MODELS), 'uuid-flux-dev');
    assert.equal(resolveModelId('veo-3.1-fast', MODELS), 'uuid-veo');
    assert.equal(resolveModelId('seedream-4.0', MODELS), 'uuid-seedream');
  });

  it('returns the slug verbatim if it already looks like a UUID', () => {
    // #given
    const raw = '550e8400-e29b-41d4-a716-446655440000';

    // #when / #then
    assert.equal(resolveModelId(raw, MODELS), raw);
  });

  it('throws a helpful error listing available display_names on miss', () => {
    // #given / #when / #then
    assert.throws(
      () => resolveModelId('not-a-model', MODELS),
      /not-a-model.*FLUX Dev.*Seedream 4\.0.*Veo 3\.1 Fast/s,
    );
  });
});
