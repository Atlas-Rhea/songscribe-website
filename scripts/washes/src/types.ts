export interface ManifestGlobal {
  model: string;
  size: string;
  template: string;
  negative: string;
  concurrency: number;
}

export interface ManifestMotion {
  enabled: boolean;
  frames: number;
  duration: number;
  direction: string;
  videoModel: string;
  videoPrompt: string;
  /**
   * Optional prompt for a separate "seed" still used as the START keyframe.
   * When present, the section's main still becomes the END keyframe and the
   * I2V model interpolates between them — producing anchored motion (e.g.
   * watercolor blooming from droplets into the full wash). Omit to let the
   * model improvise motion from the main still alone (tends to rotate/deform
   * in place rather than bloom).
   */
  seedPrompt?: string;
}

export interface ManifestSection {
  id: string;
  mood?: string;
  palette?: string;
  density?: string;
  edge?: string;
  seed?: number;
  prompt?: string;
  motion?: ManifestMotion;
}

export interface Manifest {
  version: 1;
  global: ManifestGlobal;
  sections: ManifestSection[];
}

export interface LockEntry {
  id: string;
  prompt: string;
  seed: number;
  model: string;
  size: string;
  hash: string;
  rawPath: string;
  webpPath: string;
  alphaWebpPath: string | null;
  motion: {
    frames: number;
    duration: number;
    hash: string;
    /** Path of the seed still used as start keyframe, when seedPrompt is set. */
    seedPath?: string | null;
  } | null;
  updatedAt: string;
}

export interface Lockfile {
  version: 1;
  entries: Record<string, LockEntry>;
}
