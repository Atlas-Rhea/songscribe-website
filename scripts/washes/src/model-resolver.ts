import type { HedraModel } from './hedra-client.ts';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolve a manifest-style slug (e.g. "flux-dev", "grok-video-i2v") to a
 * Hedra model UUID by matching against the model's `name` field.
 *
 * Matching normalizes both sides by lowercasing and stripping spaces/dashes,
 * so "flux-dev" matches "Flux Dev" and "grok-video-i2v" matches
 * "Grok Video I2V".
 *
 * If the input already looks like a UUID, it's returned as-is — this lets
 * callers bypass the resolver for model IDs pinned in the manifest.
 *
 * Throws with the list of available names when nothing matches.
 */
export function resolveModelId(slugOrUuid: string, models: readonly HedraModel[]): string {
  if (UUID_RE.test(slugOrUuid)) return slugOrUuid;
  const needle = normalize(slugOrUuid);
  const hit = models.find((m) => normalize(m.name).includes(needle));
  if (hit) return hit.id;
  const names = models.map((m) => m.name).join(', ');
  throw new Error(
    `Model slug "${slugOrUuid}" did not match any Hedra model. Available: ${names}. ` +
    `Update manifest.json to use one of these names (or its dashed/lowercase equivalent).`,
  );
}

function normalize(s: string): string {
  return s.toLowerCase().replaceAll(/[\s-]+/g, '');
}
