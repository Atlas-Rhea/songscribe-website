import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { renderTable, type PlannedAction } from '../src/cli-table.ts';

describe('renderTable', () => {
  it('renders one row per planned action with truncated prompt', () => {
    // #given
    const actions: PlannedAction[] = [
      {
        id: 'hero',
        kind: 'still',
        status: 'REGEN',
        prompt: 'A single soft burnt orange watercolor wash on pure white paper, large diffuse bloom, torn edges.',
      },
      { id: 'hero', kind: 'motion', status: 'REGEN', prompt: '6.0s bloom, 90 frames' },
      {
        id: 'f1-chord-editor',
        kind: 'still',
        status: 'SKIP',
        prompt: 'A single deep teal watercolor wash on pure white paper, compact, wet edges.',
      },
    ];

    // #when
    const out = renderTable(actions, 0.46);

    // #then
    assert.match(out, /hero\s+REGEN \(still\)/);
    assert.match(out, /hero\s+REGEN \(motion\)/);
    assert.match(out, /f1-chord-editor\s+SKIP \(still\)/);
    assert.match(out, /Est\. cost: \$0\.46/);
  });

  it('handles an empty plan', () => {
    // #when
    const out = renderTable([], 0);

    // #then
    assert.match(out, /No sections to regenerate/);
  });
});
