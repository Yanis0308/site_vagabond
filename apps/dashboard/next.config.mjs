import nextEnv from "@next/env";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Next ne charge pas .env* automatiquement dans next.config.
// Sans loadEnvConfig, les variables seraient vides au moment où la CSP est générée.
// Lecture directe `process.env` ici (bootstrap), conformément à l'exception
// documentée dans AGENTS.md — la validation Zod via `publicEnv` reste assurée
// au runtime applicatif côté `lib/config/public.ts`.
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

// Workspace root explicite : on est dans un worktree git (`.claude/worktrees/...`)
// et il existe un `pnpm-workspace.yaml` à la fois ici et à la racine du repo
// principal. Sans cette config, Turbopack infère le mauvais root, scanne les
// modules au mauvais endroit et la compilation des routes dynamiques peut
// boucler indéfiniment (cf. warning « Next.js inferred your workspace root »).
const __dirname = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(__dirname, "../..");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

// CSP : 'unsafe-eval' nécessaire pour Turbopack en dev ET pour la compilation
// runtime d'AJV côté browser (cf. `generateValidator` dans shared-utils) en prod.
// TODO: basculer sur Value.Check de TypeBox (pas d'eval) ou pré-compiler les schémas via ajv/dist/standalone.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  `connect-src 'self' ${supabaseUrl} ${apiUrl}`.trim(),
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
]
  .filter(Boolean)
  .join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: workspaceRoot,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
