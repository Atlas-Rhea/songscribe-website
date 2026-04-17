import type { ManifestGlobal, ManifestSection } from './types.ts';

const DEFAULT_SLOTS = {
  palette: 'soft neutral',
  density: 'medium bloom',
  edge: 'feathered',
  mood: 'quiet, unhurried',
} as const;

type Slot = keyof typeof DEFAULT_SLOTS;
const SLOT_KEYS = Object.keys(DEFAULT_SLOTS) as Slot[];

export function compilePrompt(section: ManifestSection, global: ManifestGlobal): string {
  const body = section.prompt ?? fillTemplate(section, global.template);
  return global.negative ? `${body}\n\nNEGATIVE: ${global.negative}` : body;
}

function fillTemplate(section: ManifestSection, template: string): string {
  return SLOT_KEYS.reduce((acc, slot) => {
    const value = section[slot] ?? DEFAULT_SLOTS[slot];
    return acc.replaceAll(`{${slot}}`, value);
  }, template);
}
