// Vice Cover Studio — hand-in program (Node 22, standard library only).
//
// What it does, in three steps:
//   1. Copies this repo's app/ (the offline cover maker: index.html, style.css,
//      src/*.js, fonts/Anton-Regular.ttf under its OFL licence, and the two
//      kit sample photos) and screenshots/ into the output directory.
//   2. Writes /output/dossier.json with buildDossier from the vendored
//      make.fun library (./vendor/makefun-app.ts), using the scorer's own
//      caps so an entry the scorer would refuse is refused here first.
//   3. Prints a small verification line — how many app files and screenshots
//      went in and how big the dossier is — so a bad run is obvious at once.
//
// Run it outside the grader with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Inside the grader MAKEFUN_OUTPUT_DIR is unset and /output is used.
// The program runs twice and both runs must write identical bytes, so it
// writes nothing time-dependent and copies files as they are.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// Directory this file lives in — the repo root, beside app/ and screenshots/.
const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Count plain files under a directory, recursively, for the verify line.
function countFiles(dir) {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) total += countFiles(path);
    else if (entry.isFile()) total += 1;
  }
  return total;
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's own caps: only text_max_bytes shapes the dossier bytes; the
// others refuse an entry the scorer would refuse (more than 4 screenshots or
// one over 256 KiB; more than 993 files in app/ or 48 MiB of app files in
// all, or a path under app/ over 1000 bytes).
const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(out, 'dossier.json'), dossier);

// Verification: counts and sizes, printed so a bad run is obvious at once.
const appFiles = countFiles(join(out, 'app'));
const shotFiles = existsSync(join(out, 'screenshots'))
  ? readdirSync(join(out, 'screenshots')).filter((f) => statSync(join(out, 'screenshots', f)).isFile())
  : [];
console.log(
  `Vice Cover Studio handed in: ${appFiles} app files, ${shotFiles.length} screenshots ` +
    `(${shotFiles.join(', ')}), dossier.json ${dossier.length} bytes -> ${out}`,
);
