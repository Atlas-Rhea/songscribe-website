#!/usr/bin/env node
// Self-check for build-guide.mjs. Run: node scripts/test-build-guide.mjs
import assert from 'node:assert/strict';
import {
  parseFrontmatter,
  stripHtmlComments,
  transformCallouts,
  substituteMarkers,
  groupShotRows,
  olStartToCounter,
} from './build-guide.mjs';

// #given frontmatter with scalar, number, comment, quoted string and array
const { data, body } = parseFrontmatter(
  '---\ntitle: Hello\norder: 3\ntier: free   # free | lifetime\nsince: "2.3"\nshots: [a, b-c]\n---\nBody\n'
);
// #then each type parses
assert.deepEqual(data, { title: 'Hello', order: 3, tier: 'free', since: '2.3', shots: ['a', 'b-c'] });
assert.equal(body, 'Body\n');

// #given a held-back note #then it never survives
assert.equal(stripHtmlComments('Text\n<!-- held back: Paste Lyrics -->\n'), 'Text\n\n');

// #given each callout kind #then it gets its class, label and rendered inline markdown
const tip = transformCallouts('> **Tip:** Tap **Create**.');
assert.match(tip, /guide-callout--tip/);
assert.match(tip, /<svg[^>]*>.*<\/svg>Tip<\/p>/);
assert.match(tip, /<strong>Create<\/strong>/);
assert.match(transformCallouts('> **Heads up:** x'), /guide-callout--heads-up.*Heads-up/);
assert.match(transformCallouts('> **Lifetime:** x'), /guide-callout--lifetime/);

// #given media markers
const media = new Map([
  ['s1', { id: 's1', kind: 'shot', alt: 'One', caption: 'Cap', dark_twin: 's1d' }],
  ['s1d', { id: 's1d', kind: 'shot', alt: 'One dark' }],
  ['s2', { id: 's2', kind: 'shot', alt: 'Two' }],
  ['c1', { id: 'c1', kind: 'clip', alt: 'Clip' }],
  ['bad', { id: 'bad', kind: 'shot', do_not_publish: true }],
]);
const out = substituteMarkers('{{shot: s1}}\n{{shot: s2}}\n{{clip: c1}}', 'p', media);
// #then first figure is eager, later ones lazy; twin renders; clip has a toggle
assert.equal((out.match(/loading="lazy"/g) || []).length, 1);
assert.match(out, /guide-shot__dark/);
assert.match(out, /guide-clip__toggle/);
// #then unknown, unpublishable and wrong-kind ids fail loudly
assert.throws(() => substituteMarkers('{{shot: nope}}', 'p', media), /unknown media id/);
assert.throws(() => substituteMarkers('{{shot: bad}}', 'p', media), /do_not_publish/);
assert.throws(() => substituteMarkers('{{clip: s1}}', 'p', media), /points at a shot/);

// #given consecutive shots #then they share one row; a lone shot does not
const two = '<figure class="guide-shot">a</figure>\n<figure class="guide-shot">b</figure>';
assert.equal(groupShotRows(two), `<div class="guide-shot-row">${two}</div>`);
assert.equal(groupShotRows('<figure class="guide-shot">a</figure>'), '<figure class="guide-shot">a</figure>');
// #given a lone shot, a heading, then a pair #then only the pair is grouped
const mixed = `<figure class="guide-shot">a</figure>\n<h2>X</h2>\n${two}`;
assert.equal(groupShotRows(mixed), `<figure class="guide-shot">a</figure>\n<h2>X</h2>\n<div class="guide-shot-row">${two}</div>`);

// #given a list split by a figure #then numbering continues
assert.equal(olStartToCounter('<ol start="3">'), '<ol style="counter-reset: substep 2">');

console.log('build-guide self-check: ok');
