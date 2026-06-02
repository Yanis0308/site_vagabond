#!/usr/bin/env node
// Lance `eslint` en relançant un process NEUF uniquement quand le worker
// synckit de `better-tailwindcss/enforce-canonical-classes` hang en CI.
//
// Contexte : la règle `enforce-canonical-classes` résout les classes Tailwind
// via un worker `worker_threads` synchrone (synckit). Dans un package ESM
// (`"type": "module"`), le chargement ESM de ce worker hang parfois sur les
// runners GitHub Actions ; le thread principal, bloqué sur `Atomics.wait`,
// finit par throw `Internal error: Atomics.wait() failed: timed-out` et fait
// crasher tout le run ESLint (exit 2). Bug upstream non résolu et
// non-déterministe (synckit#230, schoero/eslint-plugin-better-tailwindcss#341),
// et un seul timeout corrompt tous les appels suivants du même process
// (synckit#183) — d'où l'obligation de relancer un process frais.
//
// Comme l'échec est non-déterministe, une simple relance passe presque
// toujours. On ne relance QUE sur cette signature précise : un vrai problème
// de lint (exit 1, warnings/erreurs) ou une vraie erreur de config (exit 2
// sans la signature) est renvoyé immédiatement, jamais masqué.

import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";

const MAX_ATTEMPTS = 3;
const SYNCKIT_CRASH = /Atomics\.wait\(\) failed|\bsynckit\b/i;

const cwd = process.cwd();
const args = process.argv.slice(2);

// Résout le binaire eslint local à l'app courante (pnpm hoist → pas forcément
// dans `<app>/node_modules/.bin`), pour l'exécuter directement via Node.
const require = createRequire(path.join(cwd, "package.json"));
const eslintPkgJson = require.resolve("eslint/package.json");
const eslintBinRel =
  typeof require(eslintPkgJson).bin === "string"
    ? require(eslintPkgJson).bin
    : require(eslintPkgJson).bin.eslint;
const eslintBin = path.resolve(path.dirname(eslintPkgJson), eslintBinRel);

const env = {
  ...process.env,
  // Plafonne l'attente du worker : sur un hang, on échoue vite (≤60 s) puis on
  // relance, plutôt que de bloquer indéfiniment.
  SYNCKIT_TIMEOUT: process.env.SYNCKIT_TIMEOUT ?? "60000",
};

let lastCode = 0;
for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
  const result = spawnSync(process.execPath, [eslintBin, ...args], {
    cwd,
    env,
    encoding: "utf8",
  });

  process.stdout.write(result.stdout ?? "");
  process.stderr.write(result.stderr ?? "");

  lastCode = result.status ?? 1;

  const isSynckitCrash =
    lastCode === 2 &&
    SYNCKIT_CRASH.test(`${result.stdout ?? ""}${result.stderr ?? ""}`);

  if (!isSynckitCrash) {
    process.exit(lastCode);
  }

  if (attempt < MAX_ATTEMPTS) {
    process.stderr.write(
      `\n[eslint-retry] crash worker synckit détecté (tentative ${attempt}/${MAX_ATTEMPTS}), relance d'un process ESLint neuf…\n`,
    );
  }
}

process.stderr.write(
  `[eslint-retry] échec persistant du worker synckit après ${MAX_ATTEMPTS} tentatives.\n`,
);
process.exit(lastCode);
