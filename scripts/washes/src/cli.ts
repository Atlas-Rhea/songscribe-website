import { parseArgs } from './cli-args.ts';
import { generate } from './generate.ts';

const opts = parseArgs(process.argv.slice(2));
generate(opts).catch((err: Error) => {
  console.error('\n✖', err.message);
  process.exit(1);
});
