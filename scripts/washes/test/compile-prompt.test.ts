import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { compilePrompt } from '../src/compile-prompt.ts';
import type { ManifestGlobal, ManifestSection } from '../src/types.ts';

const global: ManifestGlobal = {
  model: 'flux-dev',
  size: '2048x2048',
  template: 'A single {palette} watercolor wash, {density}, {edge} edges. Mood: {mood}.',
  negative: 'text, borders',
  concurrency: 1,
};

describe('compilePrompt', () => {
  it('substitutes all four slots and appends negative prompt', () => {
    // #given
    const section: ManifestSection = {
      id: 'hero',
      mood: 'warm',
      palette: 'burnt orange',
      density: 'large diffuse bloom',
      edge: 'torn',
    };

    // #when
    const prompt = compilePrompt(section, global);

    // #then
    assert.match(prompt, /burnt orange watercolor wash/);
    assert.match(prompt, /large diffuse bloom/);
    assert.match(prompt, /torn edges/);
    assert.match(prompt, /Mood: warm\./);
    assert.match(prompt, /NEGATIVE: text, borders/);
  });

  it('falls back to defaults for missing slots', () => {
    // #given
    const section: ManifestSection = { id: 'x' };

    // #when
    const prompt = compilePrompt(section, global);

    // #then
    assert.match(prompt, /soft neutral watercolor wash/);
    assert.match(prompt, /medium bloom/);
    assert.match(prompt, /feathered edges/);
  });

  it('uses section.prompt verbatim when provided, still appends negative', () => {
    // #given
    const section: ManifestSection = { id: 'x', prompt: 'custom prompt' };

    // #when
    const prompt = compilePrompt(section, global);

    // #then
    assert.equal(prompt, 'custom prompt\n\nNEGATIVE: text, borders');
  });

  it('omits NEGATIVE: line when global.negative is empty', () => {
    // #given
    const section: ManifestSection = { id: 'x', palette: 'teal' };
    const noNeg: ManifestGlobal = { ...global, negative: '' };

    // #when
    const prompt = compilePrompt(section, noNeg);

    // #then
    assert.doesNotMatch(prompt, /NEGATIVE/);
  });
});
