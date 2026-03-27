# Website Vagabond

Site web marketing **Next.js 16** avec **Payload CMS** pour la gestion de contenu, **next-intl** pour l'internationalisation (11 langues), et **Tailwind CSS 4** pour le styling. Intègre **Vercel Analytics**, des pages SEO dynamiques (sitemap, robots, JSON-LD), et un blog géré via Payload.

## Technologies principales

- **Next.js 16** - Framework React avec Turbopack
- **Payload CMS 3** - CMS headless intégré (admin + API)
- **TypeScript** - Typage statique
- **Tailwind CSS 4** - Styling utilitaire
- **shadcn/ui** - Composants UI
- **next-intl** - Internationalisation (11 langues)
- **Motion** (Framer Motion) - Animations
- **PostgreSQL** - Base de données (via Payload)
- **Drizzle/Postgres adapter** - Adaptateur Payload pour PostgreSQL
- **Zod** - Validation des variables d'environnement
- **Sharp** - Optimisation d'images
- **Vercel Analytics** - Analytics web
- **QRCode** - Génération de QR codes
- **Smartbanner.js** - Bannière d'installation mobile

## Architecture

```
apps/website/
├── app/
│   ├── (payload)/                # Routes Payload CMS
│   │   ├── admin/               # Interface d'administration
│   │   ├── api/                 # API REST Payload
│   │   └── layout.tsx           # Layout admin
│   ├── [locale]/                # Routes internationalisées
│   │   ├── (marketing)/         # Pages marketing (landing, FAQ, pro, contact)
│   │   ├── (legal)/             # Pages légales (CGU, confidentialité, mentions légales)
│   │   ├── blog/                # Blog (liste + articles)
│   │   ├── contact/             # Page contact
│   │   ├── explorer/            # Exploration (régions, départements, villes)
│   │   │   ├── [region]/
│   │   │   ├── [departement]/
│   │   │   └── [ville]/
│   │   ├── faq/                 # Foire aux questions
│   │   └── pro/                 # Page offre professionnelle (B2B)
│   ├── fonts.ts                 # Configuration des polices
│   ├── globals.css              # Styles globaux Tailwind
│   ├── robots.ts                # Configuration robots.txt
│   └── sitemap.ts               # Génération du sitemap
├── collections/                  # Collections Payload CMS
│   ├── articles.ts              # Articles de blog
│   ├── categories.ts            # Catégories d'articles
│   ├── departements.ts          # Départements français
│   ├── media.ts                 # Médias (images)
│   ├── regions.ts               # Régions françaises
│   ├── users.ts                 # Utilisateurs admin
│   └── villes.ts                # Villes françaises
├── components/
│   ├── landing/                 # Sections de la landing page
│   │   ├── hero-section.tsx
│   │   ├── stats-section.tsx
│   │   ├── how-it-works-section.tsx
│   │   ├── screenshots-section.tsx
│   │   ├── map-section.tsx
│   │   ├── b2b-teaser-section.tsx
│   │   ├── trust-bar.tsx
│   │   └── final-cta-section.tsx
│   ├── marketing/               # Composants marketing (nav, footer, locale switcher)
│   ├── blog/                    # Composants blog (filtres, articles liés)
│   └── ui/                      # Composants UI (shadcn/ui + custom)
├── i18n/                        # Configuration next-intl (routing, request, navigation)
├── messages/                    # Fichiers de traduction (fr, en, de, nl, it, es, pt, zh, ja, pl, ko)
├── lib/
│   ├── config/
│   │   ├── public.ts            # Variables d'environnement publiques (Zod validated)
│   │   └── private.ts           # Variables d'environnement serveur (Zod validated)
│   ├── analytics.ts             # Vercel Analytics
│   ├── france-map-data.ts       # Données SVG carte de France
│   ├── json-ld.tsx              # Données structurées JSON-LD pour le SEO
│   ├── locales.ts               # Définition des locales supportées
│   ├── payload.ts               # Client Payload (queries)
│   ├── qr-code.ts               # Génération de QR codes
│   └── reading-time.ts          # Calcul du temps de lecture
├── migrations/                   # Migrations Payload (PostgreSQL)
├── scripts/
│   ├── seed.ts                  # Script de seed principal
│   └── seed-villes.ts           # Seed des villes françaises
├── dev/
│   └── docker-compose.yml       # PostgreSQL local (port 5433)
├── public/
│   ├── images/                  # Images statiques (logos, screenshots, badges)
│   └── llms.txt                 # Fichier LLMs.txt
└── payload.config.ts            # Configuration Payload CMS
```

## Installation

```bash
# Depuis la racine du monorepo
pnpm install

# Depuis le dossier du website
cd apps/website
pnpm install
```

## Configuration

### Base de données locale

Le site utilise PostgreSQL pour Payload CMS. Un fichier Docker Compose est fourni :

```bash
# Démarrer PostgreSQL (port 5433)
pnpm docker:up

# Arrêter PostgreSQL
pnpm docker:down
```

### Variables d'environnement

Créez un fichier `.env.local` à la racine de `apps/website/` basé sur `.env.example` :

```bash
cp .env.example .env.local
```

```bash
# Site
NEXT_PUBLIC_SITE_URL=https://www.vagabond.gg

# App Store links
NEXT_PUBLIC_APP_STORE_URL=https://apps.apple.com/fr/app/vagabond-voyage-en-france/id6737132413
NEXT_PUBLIC_GOOGLE_PLAY_URL=https://play.google.com/store/apps/details?id=com.vagabond.explore.tourism

# Calendly
NEXT_PUBLIC_CALENDLY_URL=https://calendly.com/...

# CEO LinkedIn
NEXT_PUBLIC_CEO_LINKEDIN_URL=https://www.linkedin.com/in/...

# Tap.it
NEXT_PUBLIC_TAAP_IT_DESKTOP_URL=https://taap.it/vagabond_france
NEXT_PUBLIC_TAAP_IT_MOBILE_URL=https://taap.it/vagabond_deeplink

# Payload CMS
DATABASE_URL=postgresql://user:password@localhost:5433/vagabond_website
PAYLOAD_SECRET=your-secret-here
```

Les variables d'environnement sont validées au démarrage avec **Zod** via `lib/config/public.ts` et `lib/config/private.ts`.

### Seed des données

```bash
# Seeder la base de données (régions, départements, villes, articles)
pnpm seed
```

## Scripts disponibles

```bash
# Développement (Turbopack)
pnpm develop

# Build
pnpm build

# Production
pnpm start

# Seed de la base de données
pnpm seed

# Docker PostgreSQL
pnpm docker:up
pnpm docker:down

# Vérifications
pnpm typescript-check  # Vérification TypeScript
pnpm lint-check        # Vérification ESLint
pnpm lint-fix          # Correction automatique ESLint
pnpm prettier-check    # Vérification Prettier
pnpm prettier-fix      # Correction automatique Prettier
```

## Internationalisation

Le site supporte **11 langues** via **next-intl** :

| Code | Langue            |
| ---- | ----------------- |
| fr   | Français (défaut) |
| en   | Anglais           |
| de   | Allemand          |
| nl   | Néerlandais       |
| it   | Italien           |
| es   | Espagnol          |
| pt   | Portugais         |
| zh   | Chinois           |
| ja   | Japonais          |
| pl   | Polonais          |
| ko   | Coréen            |

Les traductions sont dans `messages/{locale}.json`. Le préfixe de locale est en mode `as-needed` (pas de `/fr` pour la locale par défaut).

## Payload CMS

### Interface d'administration

Accessible à `/admin` après démarrage. Collections disponibles :

- **Users** - Utilisateurs admin du CMS
- **Media** - Médias (images uploadées)
- **Articles** - Articles de blog (avec éditeur Lexical rich text)
- **Categories** - Catégories d'articles
- **Regions** - Régions françaises
- **Departements** - Départements français
- **Villes** - Villes françaises

### API REST

Payload expose automatiquement une API REST à `/api/*` pour chaque collection.

## SEO

- **Sitemap** dynamique (`app/sitemap.ts`) - Génère toutes les URLs pour toutes les locales
- **Robots.txt** dynamique (`app/robots.ts`)
- **JSON-LD** - Données structurées pour les moteurs de recherche (`lib/json-ld.tsx`)
- **Breadcrumbs SEO** - Fil d'ariane structuré
- **LLMs.txt** - Fichier pour les crawlers IA (`public/llms.txt`)

## Pages principales

### Marketing

- **Landing page** - Hero, stats, captures d'écran, carte, trust bar, CTA
- **FAQ** - Questions fréquentes
- **Pro (B2B)** - Offre professionnelle avec prise de rendez-vous Calendly
- **Contact** - Page de contact

### Contenu

- **Blog** - Articles avec catégories, temps de lecture, et articles liés
- **Explorer** - Navigation géographique (régions → départements → villes)

### Légal

- **CGU** - Conditions générales d'utilisation
- **Confidentialité** - Politique de confidentialité
- **Mentions légales** - Mentions légales

## Stratégie de rendu

Chaque page utilise une stratégie de rendu adaptée à la fréquence de mise à jour de son contenu. Toutes les pages marketing sont des **Server Components** — aucune n'utilise `"use client"`.

### SSG (Static Site Generation) — générées au build

Pages purement statiques, ne changent qu'au prochain déploiement.

| Route                       | Contenu                      |
| --------------------------- | ---------------------------- |
| `/(marketing)/contact`      | Page contact                 |
| `/(marketing)/faq`          | Foire aux questions          |
| `/(marketing)/presse`       | Kit presse                   |
| `/(marketing)/pro`          | Offre B2B + Calendly         |
| `/(legal)/cgu`              | Conditions générales         |
| `/(legal)/confidentialite`  | Politique de confidentialité |
| `/(legal)/mentions-legales` | Mentions légales             |

### ISR (Incremental Static Regeneration) — statiques avec revalidation

Pages pré-générées au build, revalidées en arrière-plan après expiration du cache.

| Route                                                  | `revalidate` | `generateStaticParams`      | Notes                            |
| ------------------------------------------------------ | ------------ | --------------------------- | -------------------------------- |
| `/(marketing)/` (home)                                 | 24h          | non                         | Affiche les régions via Payload  |
| `/(marketing)/explorer`                                | 24h          | non                         | Hub carte de France              |
| `/(marketing)/explorer/[region]`                       | 24h          | oui (toutes les régions)    | Pré-générées au build            |
| `/(marketing)/explorer/[region]/[departement]`         | 24h          | oui (tous les départements) | Pré-générées au build            |
| `/(marketing)/explorer/[region]/[departement]/[ville]` | 7 jours      | non                         | Générées à la demande (fallback) |
| `/(marketing)/blog/[slug]`                             | 1h           | oui (100 articles)          | Pré-générées au build            |

### SSR (Server-Side Rendering) — rendues à chaque requête

| Route                | Raison                                           |
| -------------------- | ------------------------------------------------ |
| `/(marketing)/blog`  | Utilise `searchParams` (filtre `?categorie=...`) |
| `/(payload)/admin/*` | Interface admin Payload CMS                      |
| `/(payload)/api/*`   | Routes API REST Payload                          |

### Fichiers spéciaux

| Fichier          | Type                                                         |
| ---------------- | ------------------------------------------------------------ |
| `app/sitemap.ts` | Généré dynamiquement (fetch régions, départements, articles) |
| `app/robots.ts`  | Statique                                                     |

> **Note** : Les pages marketing accèdent aux données via la **Local API** Payload (`payload.find()`), qui est un appel direct in-process à PostgreSQL — pas de requête HTTP vers `/api/*`. L'API REST existe en parallèle mais n'est utilisée que par des clients externes.

## Composants UI

Les composants utilisent **shadcn/ui** avec **Tailwind CSS 4** :

```bash
# Ajouter un composant shadcn
npx shadcn@latest add button
```

Composants personnalisés notables :

- `france-map.tsx` - Carte interactive SVG de la France
- `scratch-card.tsx` - Carte à gratter interactive
- `count-up.tsx` - Compteur animé
- `app-store-badges.tsx` - Badges App Store / Google Play

## Développement

### Structure des routes

Les routes suivent la structure de fichiers Next.js avec **next-intl** :

- `app/[locale]/(marketing)/page.tsx` → `/` (landing page)
- `app/[locale]/blog/page.tsx` → `/blog`
- `app/[locale]/blog/[slug]/page.tsx` → `/blog/:slug`
- `app/[locale]/explorer/page.tsx` → `/explorer`
- `app/[locale]/explorer/[region]/page.tsx` → `/explorer/:region`
- `app/(payload)/admin/*` → `/admin` (CMS)

### Ajout d'une page

1. Créer un fichier dans `app/[locale]/`
2. Exporter un composant React Server Component par défaut
3. Utiliser `useTranslations` pour les traductions
4. La route sera automatiquement disponible dans toutes les locales

### Ajout d'une collection Payload

1. Créer un fichier dans `collections/` (ex: `my-collection.ts`)
2. Exporter la configuration de la collection
3. L'ajouter au tableau `collections` dans `payload.config.ts`
4. Générer les migrations : `npx payload migrate:create`

## Notes importantes

- Les variables d'environnement sont validées au démarrage avec Zod - l'app ne démarre pas si une variable requise manque
- Le CMS Payload est intégré directement dans Next.js (pas de serveur séparé)
- Les migrations Payload sont dans `migrations/` et gérées automatiquement
- Les images sont optimisées avec Sharp via Next.js et Payload

## Ressources

- [Next.js Documentation](https://nextjs.org/docs)
- [Payload CMS Documentation](https://payloadcms.com/docs)
- [next-intl Documentation](https://next-intl.dev/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
