import { createHash } from 'node:crypto';

export interface FingerprintInputs {
  prompt: string;
  seed: number;
  model: string;
  size: string;
}

export function fingerprint({ prompt, seed, model, size }: FingerprintInputs): string {
  const payload = JSON.stringify({ prompt, seed, model, size });
  return createHash('sha256').update(payload).digest('hex').slice(0, 16);
}
