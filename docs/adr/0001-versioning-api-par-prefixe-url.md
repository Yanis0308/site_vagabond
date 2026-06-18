# Versioning de l'API par préfixe URL `/api/v2/`

Lorsqu'un changement de contrat d'un endpoint de l'**API** doit casser la rétrocompatibilité, on crée une nouvelle version de cet endpoint sous le préfixe `/api/v2/<resource>`, en conservant l'ancien sous `/api/<resource>` inchangé. Les nouveaux endpoints non-breaking restent sous `/api/<resource>`.

## Considered Options

- **Versioning par préfixe URL** (`/api/v2/visited-pois`) — retenu.
- **Versioning par header** (`Accept: application/vnd.vagagond.v2+json`).
- **Pas de versioning, breaking change accepté avec OTA forcée**.

## Why

- **Lisibilité OpenAPI / Swagger** : les routes v1 et v2 apparaissent côté à côté avec leur propre groupe, navigables sans connaître la culture du projet. Le header versioning est invisible dans le navigateur Swagger sans extension custom.
- **Découverte simple côté **Mobile App\*\* : le client HTTP centralisé pointe vers `/api/v2/` pour les ressources concernées, vers `/api/` pour le reste. Pas de logique de négociation de version.
- **Coexistence robuste** : la **Mobile App** déployée via OTA Expo couvre la majorité des utilisateurs en quelques jours, mais une minorité reste sur l'ancienne version pendant plusieurs semaines (app pas ouverte, network offline). L'endpoint v1 reste fonctionnel pour eux pendant cette fenêtre.
- **Pattern Fastify natif** : `fastify.register(routes, { prefix: "api/v2/visited-pois" })` est l'idiome standard, sans librairie tierce ni middleware custom.

## Consequences

- Pour chaque endpoint à breaking-changer, on duplique la déclaration de route (handler v2 + handler v1 conservé). Volume de code accepté.
- Une route v1 dépréciée n'est jamais supprimée sans s'assurer qu'aucun client actif ne l'appelle plus. Suivi via logs de requêtes par route.
- Les nouveaux endpoints sans équivalent v1 (par ex. `GET /api/visited-pois/geojson`, `GET /api/leaderboard/me`) restent en v1 — la convention v2 s'applique **uniquement** aux changements de contrat existants, pas systématiquement.
- Une troisième version sera nommée `/api/v3/...` au moment où elle deviendra nécessaire. Pas de tentative de skip-version.
