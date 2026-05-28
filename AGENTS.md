# CLAUDE.md - Vagagond POC

## Project Overview

Vagagond is a mobile-first travel application for discovering and collecting points of interest (POIs). The codebase is a **pnpm monorepo** with 5 apps and 3 shared libraries.

## Repository Structure

```
vagagond-poc/
├── apps/
│   ├── api/              # Fastify 5 backend API
│   ├── mobile-app/       # React Native + Expo mobile app
│   ├── data-scraper/     # Google Maps scraper (Puppeteer)
│   ├── data-manager/     # ETL pipeline (OSM/Mapbox)
│   └── website/          # Next.js 16 marketing site + Payload CMS
├── libs/
│   ├── api-utils/        # Fastify plugins (shared between api & data-scraper)
│   ├── database-client/  # Drizzle ORM + PostgreSQL schemas, migrations, repositories
│   └── shared-utils/     # Common types, Zod/TypeBox schemas, utilities
├── patches/              # pnpm patches for ajv & fastify
└── .github/workflows/    # CI (ci-checks.yml)
```

## Tech Stack

- **Package manager**: pnpm 11.4.0 (workspaces + catalogs)
- **Language**: TypeScript 5.9 (strict mode)
- **Backend**: Fastify 5, Drizzle ORM, PostgreSQL, Firebase Admin, AWS S3
- **Mobile**: React Native 19.1, Expo 54, Expo Router, NativeWind (Tailwind), Mapbox, Jotai, React Query, Gluestack UI
- **Web**: Next.js 16, Payload CMS 3, next-intl, Tailwind CSS 4, shadcn/ui, Motion
- **Validation**: TypeBox, Zod, AJV
- **AI/LLM**: @ai-sdk/google, @ai-sdk/groq
- **Deployment**: Fly.io (API, scraper)

## Essential Commands

```bash
# Install dependencies
pnpm install

# Build the shared libs once (cached afterwards)
pnpm build:libs

# Run all checks (TypeScript + ESLint + Prettier) — used by CI and pre-commit hook
pnpm check-all

# Auto-fix lint and formatting issues
pnpm fix-all

# Format all files with Prettier
pnpm prettier-write

# App development (run from the repo root — lance UNIQUEMENT l'app en watch ;
# build initial des libs au démarrage via dependsOn ^build dans turbo.json)
pnpm develop:api         # @vagabond/api
pnpm develop:dashboard   # @vagabond/dashboard
pnpm develop:website     # @vagabond/website (requires Docker: cd apps/website && pnpm docker:up first)
pnpm develop:mobile      # @vagabond/mobile-app
pnpm develop:scraper     # @vagabond/data-scraper

# Watch des 3 libs en parallèle — à lancer dans un second terminal SI tu vas
# modifier des libs pendant la session dev. Sinon `develop:<app>` suffit.
pnpm develop:libs
```

**How lib rebuilds work**: workspace deps résolues par **symlink** dans `node_modules` (pas d'`inject-workspace-packages`).

- `pnpm develop:<app>` ne watch que l'app. Les libs sont buildées une fois au démarrage via `dependsOn: ["^build"]`, puis figées.
- `pnpm develop:libs` lance les 3 `tsc --watch` en parallèle, à ouvrir dans un second terminal si on modifie les libs pendant la session.

Sous `develop:libs`, modif de `libs/<foo>/src/*.ts` → `tsc --watch` rebuild `dist/` → symlink propage vers les consumers → watcher de l'app détecte. Pas de `pnpm install`.


## Code Quality & Linting

Pre-commit hook (husky) runs `pnpm check-all`. CI runs the same on push/PR to main.

### Key ESLint Rules

- **Explicit return types** required on all functions (`@typescript-eslint/explicit-function-return-type`)
- **No `any`** — use `unknown` instead (strict TypeScript checked)
- **No `console`** — use proper logging
- **Strict boolean expressions** — no truthy/falsy checks on strings, numbers, or objects
- **Strict equality** — always use `===`/`!==`
- **Import sorting** enforced via `simple-import-sort`
- **Inline type imports** — use `import { type Foo }` not `import type { Foo }`
- **ESLint disable comments** must include a description
- **No `sql<T>` tagged templates** — use `.mapWith(Number)`, `.mapWith(String)` instead
- **TanStack Query** lint rules active
- **Tailwind CSS** class ordering enforced
- **React "you might not need an effect"** plugin active

### Prettier Config

- 2-space indentation, no tabs
- Double quotes
- Trailing commas everywhere
- Semicolons
- Always use parentheses around arrow function params

## Coding Conventions

### TypeScript

- Strict mode enabled everywhere
- No `any` — use `unknown`
- All functions must have explicit return type annotations
- Use `Type[]` for simple array types (not `Array<Type>`)
- Use inline type imports: `import { type Foo } from "bar"`

### Naming

- **Files/directories**: kebab-case (`user-service.ts`)
- **Classes/interfaces**: PascalCase
- **Functions/variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Enums**: PascalCase with UPPER_SNAKE_CASE values

### React / React Native

- One component per file
- Functional components with hooks only
- Keep components under 200 lines
- **Do NOT use `useMemo`/`useCallback`** — React Compiler handles optimization
- Extract complex logic into custom hooks
- Define explicit prop types

### Project Architecture

- **API routes** are in `apps/api/src/routes/` — each folder is a domain (pois, users, zones, etc.)
- **Business logic** goes in `apps/api/src/services/`
- **Fastify plugins** are in `apps/api/src/plugins/` and `libs/api-utils/src/plugins/`
- **Database access** is via repositories in `libs/database-client/src/repositories/`
- **Schemas** are shared from `libs/shared-utils/src/schemas/`
- **Mobile hooks** are organized by concern in `apps/mobile-app/hooks/` (queries, mutations, maps, other)
- **Mobile components** are feature-based in `apps/mobile-app/components/`
- **Website routes** are internationalized via `apps/website/app/[locale]/`
- **Website CMS** uses Payload collections in `apps/website/collections/`
- **Website translations** are in `apps/website/messages/{locale}.json` (11 languages)

## Git Conventions

### Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

Types: feat, fix, docs, style, refactor, perf, test, chore, ci
Scopes: api, mobile, website, scraper, db, ui, deps (optional)
Example: feat(api): add endpoint for POI filtering by category
```

### Branches

```
feature/VG-123-description
fix/VG-123-description
refactor/VG-123-description
```

### Pull Requests

- Keep PRs under 200 lines (max ~500)
- Use the PR template in `.github/pull_request_template.md`
- CI must pass (`pnpm check-all`)

## Environment

- `.env.example` exists at root (for SafeQL database URL)
- Each app may have its own `.env` — never commit `.env` files
- Node.js 22.12+ required (CI matrix, engines)
- **Ports** are configurable per app via `.env` (defaults: API `PORT=3000`, website `WEBSITE_PORT=3001`, dashboard `DASHBOARD_PORT=3002`, mobile `MOBILE_APP_PORT=8081`, Postgres host `5432`, scraper `PORT=3234`). See each app's `.env.example`.
- **Do not read `process.env` in application code** — use each app's config layer (`apps/api/src/plugins/config.ts`, `apps/dashboard/lib/config/public.ts`, `apps/mobile-app/app.config.ts`, etc.). Exceptions: `dotenv.config()` at boot and `NODE_ENV` for dev/prod mode.

## Common Gotchas

1. **Libs watch propagation**: `pnpm develop:<app>` ne watch QUE l'app (les libs sont buildées une fois au démarrage). Si tu modifies les libs pendant la session, ouvre `pnpm develop:libs` dans un terminal séparé — la cascade `tsc --watch` → symlink → app watcher se déclenche automatiquement, sans `pnpm install`.
3. **Patched dependencies**: `ajv` et `fastify` ont des pnpm patches dans `patches/` (déclarés dans `pnpm-workspace.yaml` → `patchedDependencies`). À surveiller lors des upgrades.
5. **`pnpm-lock.yaml` regen**: avec pnpm 11, `pnpm install` après suppression du lockfile peut dire "Already up to date" tant que `node_modules/.pnpm/lock.yaml` (cache interne) est cohérent. Force la regen avec :
   ```bash
   rm -rf node_modules apps/*/node_modules libs/*/node_modules pnpm-lock.yaml
   pnpm install --ignore-scripts  # première passe → lockfile
   pnpm install                   # seconde passe → postinstall scripts (puppeteer download, etc.)
   ```
6. **SafeQL**: Database query validation is configured in `eslint-safeql.config.mjs` — requires a running PostgreSQL for type checking
7. **The project README is in French** — the team works in French
