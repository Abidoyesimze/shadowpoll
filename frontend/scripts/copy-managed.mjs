// Copies the compiled circuit artifacts (managed/) into public/ so Vite
// serves them as static files, letting the browser fetch prover/verifier
// keys and ZKIR at runtime via FetchZkConfigProvider - mirroring how the CLI
// reads them from disk via NodeZkConfigProvider.
import { cp, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(here, '../../contract/src/managed');
const dest = path.resolve(here, '../public/managed');

if (!existsSync(src)) {
  console.error(`Compiled contract not found at ${src}. Run "npm run compact --workspace=contract" first.`);
  process.exit(1);
}

await rm(dest, { recursive: true, force: true });
await mkdir(path.dirname(dest), { recursive: true });
await cp(src, dest, { recursive: true });
console.log(`Copied ${src} -> ${dest}`);
