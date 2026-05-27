# Auth Dashboard : Supabase Auth (Email OTP code), provider distinct de la Mobile App

Le **Dashboard** utilise **Supabase Auth** comme provider d'identité, en mode **Email OTP code** (code à 6 chiffres reçu par mail). La **Mobile App** reste sous **Firebase Auth**. Les deux populations sont disjointes : les **Dashboard Users** vivent dans `dashboard_users`, accessibles via le préfixe API `/api/dashboard/*` qui valide les JWT Supabase via une 2e branche dans le plugin auth Fastify.

## Considered Options

- **Un seul projet Firebase Auth partagé** entre Mobile App et Dashboard. Rejeté : pas d'Email OTP code natif sur Firebase (seulement Email Link ou SMS).
- **Deux projets Firebase distincts** (mobile + dashboard). Rejeté : toujours pas d'Email OTP code natif ; pivot UX préféré.
- **Supabase Auth pour le Dashboard, Firebase Auth pour la Mobile App** — retenu.

## Why

- **Supabase est déjà dans la stack** : le Postgres applicatif est hébergé chez Supabase (cf. `libs/database-client/src/supabase-cert.ts`), utilisé jusqu'ici comme *pur* provider DB (pas de RLS, pas de Realtime, pas de Storage, pas d'Auth). Activer Supabase Auth n'introduit pas un nouvel acteur dans l'infra — juste un service du provider qu'on a déjà.
- **Email OTP code natif** : Supabase Auth supporte directement le code 6 chiffres par email (`signInWithOtp({ email, options: { shouldCreateUser: false } })` + `verifyOtp({ email, token, type: "email" })`). C'est l'UX que l'équipe a demandée. Firebase ne le supporte qu'au prix d'une Cloud Function custom et de l'émission de custom tokens — beaucoup d'effort pour reproduire ce que Supabase fait nativement.
- **Cloisonnement de sécurité** : provider distinct → un compromis sur les clés publiques de la **Mobile App** (largement distribuées dans les bundles iOS/Android) n'ouvre par construction aucun accès à la surface Dashboard.
- **Pas de collision sémantique en DB** : les UUIDs Supabase et les UIDs Firebase vivent dans des namespaces différents ; séparer en `dashboard_users` est naturel et évite que `roleEnum` (mobile) porte des rôles qui n'existent que côté Dashboard.
- **Un seul Fastify** plutôt qu'un service dédié : la donnée et `libs/database-client` sont les mêmes ; doubler l'API pour seulement un hook auth différent serait du sur-engineering.

## Consequences

- Le plugin auth Fastify (`apps/api/src/plugins/auth.ts`) gagne une branche : si `request.url.startsWith(DASHBOARD_API_PREFIX)`, on valide le JWT Supabase (via `jose` + JWKS Supabase) et on consulte `dashboard_users` ; sinon comportement actuel (Firebase) inchangé.
- Nouvelles variables de configuration dans `apps/api/src/plugins/config.ts` : `supabaseUrl`, `supabaseJwksUrl`. Côté Dashboard : `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (nouveau système 2025+ Supabase, format `sb_publishable_…`, et non l'« anon key » legacy JWT HS256 qui reste fonctionnelle mais dépréciée).
- Le **Dashboard Next.js** intègre `@supabase/supabase-js` + `@supabase/ssr` pour le flow Email OTP et la session côté cookies. ky attache `Authorization: Bearer <access_token>` aux appels vers `/api/dashboard/*`.
- Choix SMS OTP **explicitement écarté** pour le Dashboard : friction (numéro à collecter), coût Twilio, pas adapté au profil B2B (offices de tourisme).
- Un staff qui voudrait aussi utiliser la Mobile App aura **deux comptes distincts** (Supabase pour le Dashboard, Firebase pour la Mobile). Acceptable et même souhaitable (cloisonnement).
- **Auth Supabase activée dans le projet Supabase existant** (celui qui sert déjà la DB applicative). Pas de 2e projet Supabase.
- **Pas de FK** `dashboard_users.user_id → auth.users(id)` : on ne couple pas nos migrations Drizzle au schéma `auth` géré par Supabase. La portabilité reste préservée.
- **Pas de suppression cascadée en v0** : si un user est retiré de Supabase Auth, sa row dans `dashboard_users` devient orpheline mais inerte (aucun JWT ne peut plus être mintée pour cet UUID). Un script de cleanup éventuel sera ajouté plus tard si nécessaire.
- **Type de la colonne** : `dashboard_users.user_id` est `uuid` natif Postgres (et non `varchar` comme `users.user_id`), parce qu'on sait que c'est toujours un UUID Supabase strictement formaté.
- **Provisioning manuel via Supabase Studio en phase 1** : pas de script CLI ni de UI d'invitation pour démarrer. Le staff Vagagond ajoute les utilisateurs à la main dans la console Supabase. Combiné avec :
  - "Allow new users to sign up" désactivé côté Supabase (paramètre du projet) ;
  - `signInWithOtp({ email, options: { shouldCreateUser: false } })` côté Dashboard Next.js.
- **Upsert au 1er login + rôle par défaut `"STAFF"`** : la row `dashboard_users` est créée automatiquement par le hook auth Fastify lors du premier appel API authentifié, avec `role = "STAFF"`. Phase 2 (B2B), on lira le rôle depuis `auth.users.app_metadata.role` (set au moment de la création manuelle) au lieu du default.
