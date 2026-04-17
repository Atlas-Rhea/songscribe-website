export interface CliOptions {
  estimate: boolean;
  only: string[] | null;
  stillsOnly: boolean;
  motionOnly: boolean;
  force: boolean;
  noAlpha: boolean;
  yes: boolean;
  mock: boolean;
}

export function parseArgs(argv: readonly string[]): CliOptions {
  const opts: CliOptions = {
    estimate: false,
    only: null,
    stillsOnly: false,
    motionOnly: false,
    force: false,
    noAlpha: false,
    yes: false,
    mock: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '--estimate': opts.estimate = true; break;
      case '--stills-only': opts.stillsOnly = true; break;
      case '--motion-only': opts.motionOnly = true; break;
      case '--force': opts.force = true; break;
      case '--no-alpha': opts.noAlpha = true; break;
      case '--yes': case '-y': opts.yes = true; break;
      case '--mock': opts.mock = true; break;
      case '--only': {
        const v = argv[++i];
        if (!v) throw new Error('--only requires a value');
        opts.only = [v];
        break;
      }
      case '--sections': {
        const v = argv[++i];
        if (!v) throw new Error('--sections requires a value');
        opts.only = v.split(',').map(s => s.trim()).filter(Boolean);
        break;
      }
      default: throw new Error(`Unknown flag: ${arg}`);
    }
  }
  return opts;
}
