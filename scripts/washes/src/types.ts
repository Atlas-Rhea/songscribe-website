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
  motion: { frames: number; duration: number; hash: string } | null;
  updatedAt: string;
}

export interface Lockfile {
  version: 1;
  entries: Record<string, LockEntry>;
}
