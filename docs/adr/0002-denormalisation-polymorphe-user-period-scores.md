# Dénormalisation polymorphe des scores utilisateur par période

Les compteurs `COUNT(visited_pois) GROUP BY user_id` filtrés par période (`monthly`, `all-time`, futur `weekly` / `yearly` / `seasonal`) sont dénormalisés dans une **table polymorphe** `user_period_scores(user_id, period_type, period_key, count)`. La maintenance se fait par transaction applicative dans `visited-poi.repository.ts`.

## Considered Options

- **Calcul on-demand avec indexes** (pas de dénorm) — invalidée par la cible de volume (10K **Visited POIs** par **Mobile User** × ~10K Mobile Users = 100M lignes ; `GROUP BY` + `ORDER BY count DESC LIMIT 20` devient ~10 s).
- **Colonne dénormée par période sur `users`** (`visited_pois_count_current_month` + cron de reset au 1er du mois) — rejetée pour la fragilité du cron, l'absence d'historique et la non-extensibilité.
- **Table polymorphe `user_period_scores(user_id, period_type, period_key, count)`** — retenue.
- **Vue matérialisée + `REFRESH CONCURRENTLY` périodique** — rejetée car le refresh devient coûteux à K records et introduit une latence de propagation.
- **Cache externe Redis** — rejeté comme overkill ; pas d'infra Redis dans le projet aujourd'hui.

Pour le **typage** de `period_type`, le choix `text` (couplé à une union TypeScript stricte via Drizzle `$type<...>()`) a été retenu contre un `pgEnum` PostgreSQL :

- Avec `pgEnum`, ajouter une nouvelle valeur (`'weekly'`, `'yearly'`, `'tour_de_france_2026'`) demande un `ALTER TYPE … ADD VALUE` Drizzle, qui ne peut pas s'exécuter dans une transaction de migration multi-statements et complique la pipeline.
- Avec `text` + union TypeScript, ajouter une période est purement un changement de code : le compilateur garantit l'exhaustivité, et la DB n'a pas à être touchée.
- La validation des valeurs entrantes côté **API** se fait déjà au schéma TypeBox des routes (refus à la frontière).

## Why

- **Extensibilité gratuite** : ajouter `weekly`, `yearly`, ou une période événementielle (`tour_de_france_2026`) ne demande qu'une valeur dans l'enum `period_type` et une nouvelle convention de `period_key`, sans migration de schéma ni nouvelle table.
- **Historique conservé** : les classements passés (par ex. `monthly` de mars 2026) restent queryables — la table accumule, ne reset jamais.
- **Lecture rapide** : `WHERE period_type=? AND period_key=? ORDER BY count DESC LIMIT n` est O(log N) avec un index composé `(period_type, period_key, count DESC, user_id ASC)`. Compatible directement avec la pagination cursor du leaderboard.
- **Maintenance simple** : la table est mise à jour en transaction lors de chaque INSERT/DELETE sur `visited_pois`, dans le repository — seule write-path, atomicité garantie par PostgreSQL.
- **Single source of truth** : pas de doublon avec une colonne `users.visited_pois_count`. L'all-time count se lit via JOIN sur `user_period_scores WHERE period_type='all_time'`.

## Consequences

- **Transaction étendue** dans `visitedPoi.repository.create()` : INSERT visited_poi + UPSERT user_period_scores (une ligne par période active) + UPDATE pois.visit_count, dans un seul `db.transaction(...)`.
- **Backfill obligatoire** au moment du déploiement : la requête de réconciliation documentée dans [`docs/reconcile-user-period-scores.md`](../reconcile-user-period-scores.md) recalcule l'état initial depuis `visited_pois`. Exécutée en transaction `SERIALIZABLE` avec `TRUNCATE` pour gérer les écritures concurrentes pendant la durée (~quelques secondes).
- **Surface de drift** : si un code futur INSERT directement dans `visited_pois` en bypassant le repository, les compteurs divergent. Mitigation : revue PR + script de réconciliation en filet de sécurité périodique.
- **Doublon `pois.visit_count`** non couvert par cette table : il reste une colonne simple sur `pois`. Si demain on veut « POIs les plus visités ce mois-ci », on créera `poi_period_scores` au même pattern. YAGNI pour l'instant.
- **Pattern réplicable** : si d'autres entités demandent des agrégats temporels (par ex. activité par **Boundary** par période), on instancie une table `<entity>_period_scores` au même modèle.
