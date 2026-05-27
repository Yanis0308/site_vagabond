# @vagabond/dashboard

Dashboard B2B Vagagond — Next.js 16 + Supabase Auth (OTP) + React Query.

## Variables d'environnement

Copier `.env.example` en `.env.local` et remplir :

| Variable                               | Description                                                                         |
| -------------------------------------- | ----------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | URL du projet Supabase (Studio → Settings → API).                                   |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key Supabase (format `sb_publishable_…`, remplace l'anon key).          |
| `NEXT_PUBLIC_API_URL`                  | Base URL de l'API Fastify (ex. `http://localhost:3000` en dev).                     |
| `DASHBOARD_PORT`                       | Port du serveur Next en dev (optionnel, défaut **3002** via script `pnpm develop`). |

Les variables publiques sont validées dans [`lib/config/public.ts`](lib/config/public.ts)
(seul point de lecture `process.env` côté dashboard). Le code applicatif consomme
`publicEnv`, pas `process.env` directement.

Aucune variable privée (server-only) requise en V0 — pattern client-first via le
SDK Supabase browser + `ky` direct vers `/api/dashboard/*` (cf. ADR 0007).

## Développement local

Depuis la **racine du repo** (pour que Turbo rebuild les libs en watch) :

```bash
pnpm develop:dashboard
```

L'app écoute sur `http://localhost:3002` par défaut (`DASHBOARD_PORT` surchargeable).
L'API Fastify doit tourner en parallèle (`pnpm develop:api`, port **3000** par défaut via `PORT` dans `apps/api/.env`).

## Build prod

```bash
pnpm turbo run build --filter=@vagabond/dashboard
```

Le CI exécute ce build avec des placeholders pour les `NEXT_PUBLIC_*` (cf.
`.github/workflows/ci-checks.yml`) — aucun appel réseau au build time.

## Déploiement Vercel

À configurer côté Vercel (POC manuel) :

- **Root Directory** : `apps/dashboard`
- **Build Command** : laisser auto (Vercel détecte Next + monorepo pnpm)
- **Install Command** : `pnpm install --frozen-lockfile`
- **Node Version** : 22.x
- **Environment Variables** : les 3 `NEXT_PUBLIC_*` ci-dessus, avec les vraies
  valeurs prod (Supabase prod + URL Fly.io de l'API).

Note : pour le SDK Supabase, ajouter le domaine Vercel dans
**Supabase → Authentication → URL Configuration → Site URL / Redirect URLs**,
sinon le callback OTP refuse la redirection.
