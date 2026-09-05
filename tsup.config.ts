// tsup.config.ts - two builds from one package.
//   1. the library: dist/index.js (+ .cjs, .d.ts) - unchanged from before
//   2. the CLI:     dist/cli/index.js - ESM only, shebang kept, version baked in
// Kept in ONE config so a version bump reaches both. The CLI has no .d.ts on purpose.
import { defineConfig } from 'tsup';
import { readFileSync } from 'node:fs';

const version = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version as string;

export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    sourcemap: false,
  },
  {
    entry: { 'cli/index': 'src/cli/index.ts' },
    format: ['esm'],
    dts: false,
    clean: false,
    sourcemap: false,
    banner: { js: '#!/usr/bin/env node' },
    define: { __CLI_VERSION__: JSON.stringify(version) },
  },
]);
