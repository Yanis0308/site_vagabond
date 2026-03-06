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
│   └── website/          # Next.js marketing site (unmaintained)
├── libs/
│   ├── api-utils/        # Fastify plugins (shared between api & data-scraper)
│   ├── database-client/  # Drizzle ORM + PostgreSQL schemas, migrations, repositories
│   └── shared-utils/     # Common types, Zod/TypeBox schemas, utilities
├── patches/              # pnpm patches for ajv & fastify
└── .github/workflows/    # CI (ci-checks.yml)
```

## Tech Stack

- **Package manager**: pnpm 10.1.0 (workspaces)
- **Language**: TypeScript 5.9 (strict mode)
- **Backend**: Fastify 5, Drizzle ORM, PostgreSQL, Firebase Admin, AWS S3
- **Mobile**: React Native 19.1, Expo 54, Expo Router, NativeWind (Tailwind), Mapbox, Jotai, React Query, Gluestack UI
- **Web**: Next.js 15 (unmaintained)
- **Validation**: TypeBox, Zod, AJV
- **AI/LLM**: @ai-sdk/google, @ai-sdk/groq
- **Deployment**: Fly.io (API, scraper)

## Essential Commands

```bash
# Install dependencies (also rebuilds libs via postinstall)
pnpm install

# Run all checks (TypeScript + ESLint + Prettier) — used by CI and pre-commit hook
pnpm check-all

# Auto-fix lint and formatting issues
pnpm fix-all

# Format all files with Prettier
pnpm prettier-write

# API development
cd apps/api && pnpm run develop

# Mobile development
cd apps/mobile-app && pnpm run develop
```

**Important**: After modifying any file in `libs/`, run `pnpm install` to rebuild the libraries so apps pick up the changes.

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

## Git Conventions

### Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

Types: feat, fix, docs, style, refactor, perf, test, chore, ci
Scopes: api, mobile, scraper, db, ui, deps (optional)
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
- Node.js 20.x required (CI matrix)

## Common Gotchas

1. **Libs need rebuild**: After changing `libs/*`, run `pnpm install` to trigger postinstall builds
2. **Patched dependencies**: `ajv` and `fastify` have pnpm patches in `patches/` — be careful when upgrading these
3. **SafeQL**: Database query validation is configured in `eslint-safeql.config.mjs` — requires a running PostgreSQL for type checking
4. **The project README is in French** — the team works in French
