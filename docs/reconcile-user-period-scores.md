# Réconciliation de `user_period_scores`

Requête de backfill / réconciliation des compteurs dénormalisés `user_period_scores`
depuis la source de vérité `visited_pois` (cf. [ADR-0002](./adr/0002-denormalisation-polymorphe-user-period-scores.md)).

## Quand l'exécuter

- **Backfill initial** : une fois après le déploiement de la migration `0025` qui
  crée la table `user_period_scores` vide (sinon le leaderboard n'affiche que
  l'activité postérieure au déploiement).
- **Filet de sécurité** : ponctuellement si on soupçonne un drift (par ex. un
  code qui aurait écrit dans `visited_pois` en bypassant `visited-poi.repository.ts`).

## Sémantique (alignée sur le write-path live)

- `count = COUNT(*)` des `visited_pois` — équivalent à `COUNT(DISTINCT poi_id)`
  grâce à l'index unique `(user_id, poi_id)`, et il n'y a pas de soft-delete sur
  la table.
- Périodes : `all_time` (`period_key = ''`) + `monthly` (`period_key = 'YYYY-MM'`),
  le mois étant calculé **en UTC** comme `computeActivePeriods` (`getUTC*`).
- Idempotent : `TRUNCATE` + recompute. Transaction `SERIALIZABLE` pour gérer les
  écritures concurrentes pendant l'opération (~quelques secondes ; `TRUNCATE`
  prend un lock `ACCESS EXCLUSIVE` bref, les `createCustom` concurrents se mettent
  en file et se réappliquent correctement après le commit).

## Requête

```sql
BEGIN;
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- Reconstruit entièrement la table dénormalisée depuis la source de vérité.
TRUNCATE TABLE user_period_scores RESTART IDENTITY;

-- all_time : 1 ligne par user, period_key = '' (cf. computeActivePeriods)
INSERT INTO user_period_scores (user_id, period_type, period_key, count, created_at, updated_at)
SELECT user_id, 'all_time', '', COUNT(*), now(), now()
FROM visited_pois
GROUP BY user_id;

-- monthly : 1 ligne par (user, YYYY-MM) en UTC (cf. getUTC* dans le code)
INSERT INTO user_period_scores (user_id, period_type, period_key, count, created_at, updated_at)
SELECT user_id,
       'monthly',
       to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM'),
       COUNT(*),
       now(), now()
FROM visited_pois
GROUP BY user_id, to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM');

-- Garde-fou : doit renvoyer 0 ligne. Chaque all_time = COUNT réel des visited_pois.
SELECT s.user_id, s.count AS score, c.real
FROM user_period_scores s
JOIN (SELECT user_id, COUNT(*) AS real FROM visited_pois GROUP BY user_id) c
  ON c.user_id = s.user_id
WHERE s.period_type = 'all_time' AND s.period_key = '' AND s.count <> c.real;

-- Si la vérification renvoie 0 ligne -> COMMIT. Sinon -> ROLLBACK.
COMMIT;
```
