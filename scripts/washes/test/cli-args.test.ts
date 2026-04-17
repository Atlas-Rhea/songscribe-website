import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs } from '../src/cli-args.ts';

describe('parseArgs', () => {
  it('defaults to full regen with prompt', () => {
    // #given / #when
    const opts = parseArgs([]);

    // #then
    assert.deepEqual(opts, {
      estimate: false,
      only: null,
      stillsOnly: false,
      motionOnly: false,
      force: false,
      noAlpha: false,
      yes: false,
      mock: false,
    });
  });

  it('--estimate sets estimate to true', () => {
    assert.equal(parseArgs(['--estimate']).estimate, true);
  });

  it('--only hero sets only to ["hero"]', () => {
    assert.deepEqual(parseArgs(['--only', 'hero']).only, ['hero']);
  });

  it('--sections a,b,c sets only to three ids', () => {
    assert.deepEqual(parseArgs(['--sections', 'a,b,c']).only, ['a', 'b', 'c']);
  });

  it('combined flags parse together', () => {
    // #given / #when
    const opts = parseArgs(['--only', 'hero', '--force', '--no-alpha', '--yes']);

    // #then
    assert.equal(opts.force, true);
    assert.equal(opts.noAlpha, true);
    assert.equal(opts.yes, true);
    assert.deepEqual(opts.only, ['hero']);
  });

  it('throws on unknown flag', () => {
    // #then
    assert.throws(() => parseArgs(['--bogus']), /Unknown flag: --bogus/);
  });
});
