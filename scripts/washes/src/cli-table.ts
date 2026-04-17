export type ActionStatus = 'REGEN' | 'SKIP';
export type ActionKind = 'still' | 'motion';

export interface PlannedAction {
  id: string;
  kind: ActionKind;
  status: ActionStatus;
  prompt: string;
}

const DIVIDER = '─'.repeat(80);

export function renderTable(actions: readonly PlannedAction[], estCost: number): string {
  if (actions.length === 0) {
    return 'No sections to regenerate. All entries matched lockfile hashes.';
  }
  const header = `Section${' '.repeat(18)}Action${' '.repeat(11)}Prompt (80 chars)`;
  const rows = actions.map(a => {
    const id = a.id.padEnd(24);
    const action = `${a.status} (${a.kind})`.padEnd(17);
    const promptSnippet = a.prompt.length > 80 ? `${a.prompt.slice(0, 77)}…` : a.prompt;
    return `${id}${action}${promptSnippet}`;
  });
  return [
    header,
    DIVIDER,
    ...rows,
    DIVIDER,
    `Est. cost: $${estCost.toFixed(2)}`,
  ].join('\n');
}
