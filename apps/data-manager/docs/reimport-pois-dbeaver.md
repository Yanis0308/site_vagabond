# Réimport des POIs via DBeaver (transfert DB → DB)

Procédure pour pousser un nouveau jeu de POIs (ex. local → DEV) **sans rien
supprimer** : on **désactive** (`disabled = true`) les lieux disparus d'OSM au
lieu de les `DELETE`. Conséquence : aucune visite orpheline, les `visited_pois`
restent intactes, l'app affiche un badge « Lieu supprimé » sur les visites
concernées.

> **Règle d'or : on ne fait JAMAIS `DELETE FROM pois`.** Depuis la migration
> `0029_vg_119_poi_fk_enforcement`, supprimer un POI est de toute façon **rejeté
> par Postgres** : **les 5 FK** qui référencent `pois` (`visited_pois`, `poi_data`,
> `poi_enriched`, `poi_boundaries`, `user_feedbacks`) sont en ON DELETE NO ACTION.
> Comme tout POI actif a du `poi_data`, **aucun POI ne peut être supprimé** — c'est
> le verrou DB de l'invariant disable-not-delete (cf. ADR 0011). Donc on désactive,
> point.

## Principe

Import = **snapshot complet** (France entière à chaque run), donc pas de diff à
calculer et **pas de scope** à gérer :

1. On transfère le nouveau jeu dans des tables de **staging** (`*_import`).
2. On **upsert** depuis le staging (insère les nouveaux, met à jour + **réactive**
   les revenus).
3. On **désactive** tout POI OSM qui n'est plus dans le staging.

Le staging joue le rôle de marqueur de run : pas besoin de colonne
`last_imported_at` (l'import ne passe pas par le code app, donc `updated_at` /
`$onUpdate` ne se déclencheraient pas de toute façon).

## Étape 1 — Transfert DBeaver

Dans DBeaver, transférer depuis la base **source** (local) vers la base **DEV**,
dans des tables de staging (PAS les tables live). Le plus simple : option
« Drop/Create target table » de l'assistant de transfert, ou exécuter d'abord
le `DROP TABLE IF EXISTS` ci-dessous.

| Source (local)   | → Staging (DEV)         | Obligatoire ?                                  |
| ---------------- | ----------------------- | ---------------------------------------------- |
| `pois`           | `pois_import`           | Oui                                            |
| `poi_data`       | `poi_data_import`       | Oui (libellés/catégories)                      |
| `poi_boundaries` | `poi_boundaries_import` | Oui (rattachement aux zones des nouveaux POIs) |
| `boundaries`     | `boundaries_import`     | Seulement si les zones ont changé              |

> Les tables `*_import` sont **laissées en place** après le run (pratique pour
> debug) et **écrasées au run suivant** (le `DROP IF EXISTS` les recrée).

### DDL des tables de staging

À exécuter **sur DEV** avant le transfert (ou laisser l'assistant DBeaver gérer
via « Drop/Create target table »). Ce sont de simples **tampons** : on réplique
les types des tables live (mêmes enums / géométries, pour que les
`INSERT … SELECT` de l'étape 2 passent sans cast) mais **sans contrainte** (pas de
PK, FK, NOT NULL, ni défaut). Les invariants sont (re)validés au merge contre les
tables live. Les types enum/PostGIS référencés (`"PoiSourceEnum"`, etc.) existent
déjà en base (créés par les migrations).

```sql
-- pois -> pois_import
DROP TABLE IF EXISTS pois_import;
CREATE TABLE pois_import (
  id              varchar(1000),
  created_at      timestamptz,
  updated_at      timestamptz,
  source          "PoiSourceEnum",
  source_id       varchar(1000),
  coords          geometry(Point, 4326),
  disabled        boolean,
  disabled_reason varchar(1000),
  filter_level    "PoiFilterLevelEnum",
  visit_count     integer
);

-- poi_data -> poi_data_import
DROP TABLE IF EXISTS poi_data_import;
CREATE TABLE poi_data_import (
  id            integer,
  created_at    timestamptz,
  updated_at    timestamptz,
  name          varchar(1000),
  description   varchar(1000),
  raw_info      jsonb,
  source        "PoiDataSourceEnum",
  source_id     varchar(1000),
  language      "LanguageEnum",
  poi_id        varchar(1000),
  nb_of_tags    integer,
  main_category varchar(100),
  categories    jsonb
);

-- poi_boundaries -> poi_boundaries_import
DROP TABLE IF EXISTS poi_boundaries_import;
CREATE TABLE poi_boundaries_import (
  id          integer,
  created_at  timestamptz,
  updated_at  timestamptz,
  poi_id      varchar(1000),
  boundary_id varchar(1000)
);

-- boundaries -> boundaries_import (seulement si les zones ont changé)
DROP TABLE IF EXISTS boundaries_import;
CREATE TABLE boundaries_import (
  id               varchar(1000),
  created_at       timestamptz,
  updated_at       timestamptz,
  name             varchar(1000),
  boundary_level   "BoundaryLevelEnum",
  raw_info         jsonb,
  parent_id        varchar(1000),
  display_point    geometry(Point, 4326),
  place_type       varchar(100),
  population        integer,
  is_capital       boolean,
  importance_score double precision,
  way_area         double precision
);
```

## Étape 2 — Fusion (SQL à exécuter sur DEV)

> **⚠️ Tout en upsert (pas de `DELETE`), parents avant enfants.** Depuis la
> migration `0030` (FK NO ACTION vers `pois`), les `INSERT` enfants exigent que le
> parent existe : l'ordre est **`pois` → `boundaries` → `poi_data` / `poi_boundaries`**.
> Les `EXISTS (… FROM pois/boundaries …)` évitent qu'une ligne de staging orpheline
> fasse échouer tout le merge sur violation FK ; en snapshot cohérent ils ne
> filtrent rien.
>
> Conséquence du « sans delete » : une row obsolète en base mais absente de l'import
> (ex. un `poi_data` d'une langue retirée, un rattachement de zone devenu caduc)
> **n'est pas supprimée**. Acceptable pour un re-snapshot cohérent ; si un nettoyage
> strict est requis, repasser ponctuellement sur un delete ciblé.

```sql
BEGIN;

-- 1) POIs : upsert + réactivation des revenus -----------------------------
INSERT INTO pois (id, source, source_id, coords, filter_level, disabled, created_at, updated_at)
SELECT id, source, source_id, coords, filter_level, false, now(), now()
FROM pois_import
ON CONFLICT (id) DO UPDATE SET
  coords          = excluded.coords,
  filter_level    = excluded.filter_level,
  disabled        = false,
  disabled_reason = NULL,
  updated_at      = now();
-- NB : on ne touche PAS visit_count (préservé).

-- 2) POIs : désactivation des disparus (dataset complet => pas de scope) ---
UPDATE pois
SET disabled = true, disabled_reason = 'absent_from_snapshot'
WHERE source = 'OSM'
  AND disabled = false
  AND id NOT IN (SELECT id FROM pois_import);

-- 3) boundaries (seulement si les zones ont changé) : upsert ----------------
--    À jouer AVANT poi_boundaries (FK boundary_id -> boundaries). Sauter ce bloc
--    si boundaries_import n'a pas été transféré (zones inchangées).
INSERT INTO boundaries (id, created_at, updated_at, name, boundary_level, raw_info, parent_id, display_point, place_type, population, is_capital, importance_score, way_area)
SELECT id, created_at, updated_at, name, boundary_level, raw_info, parent_id, display_point, place_type, population, is_capital, importance_score, way_area
FROM boundaries_import
ON CONFLICT (id) DO UPDATE SET
  updated_at       = now(),
  name             = excluded.name,
  boundary_level   = excluded.boundary_level,
  raw_info         = excluded.raw_info,
  parent_id        = excluded.parent_id,
  display_point    = excluded.display_point,
  place_type       = excluded.place_type,
  population       = excluded.population,
  is_capital       = excluded.is_capital,
  importance_score = excluded.importance_score,
  way_area         = excluded.way_area;

-- 4) poi_data : upsert sur la clé naturelle (source, poi_id, language) --------
--    Pas de delete : on rafraîchit les rows importées, on AJOUTE les nouvelles ;
--    les POIs désactivés gardent leur poi_data (le nom reste affichable).
--    FK poi_data.poi_id -> pois NO ACTION (0030) : l'INSERT exige le parent (EXISTS).
INSERT INTO poi_data (created_at, updated_at, name, description, raw_info, source, source_id, language, poi_id, main_category, categories, nb_of_tags)
SELECT pdi.created_at, pdi.updated_at, pdi.name, pdi.description, pdi.raw_info, pdi.source, pdi.source_id, pdi.language, pdi.poi_id, pdi.main_category, pdi.categories, pdi.nb_of_tags
FROM poi_data_import pdi
WHERE EXISTS (SELECT 1 FROM pois p WHERE p.id = pdi.poi_id)
ON CONFLICT (source, poi_id, language) DO UPDATE SET
  updated_at    = now(),
  name          = excluded.name,
  description   = excluded.description,
  raw_info      = excluded.raw_info,
  source_id     = excluded.source_id,
  main_category = excluded.main_category,
  categories    = excluded.categories,
  nb_of_tags    = excluded.nb_of_tags;

-- 5) poi_boundaries : upsert sur la clé naturelle (poi_id, boundary_id) -------
--    Pas de delete : on ajoute les nouveaux rattachements, on ignore ceux déjà
--    présents (DO NOTHING). FK poi_id -> pois et boundary_id -> boundaries :
--    l'INSERT exige les deux parents (EXISTS + step 3 joué avant).
INSERT INTO poi_boundaries (poi_id, boundary_id)
SELECT pbi.poi_id, pbi.boundary_id
FROM poi_boundaries_import pbi
WHERE EXISTS (SELECT 1 FROM pois p WHERE p.id = pbi.poi_id)
  AND EXISTS (SELECT 1 FROM boundaries b WHERE b.id = pbi.boundary_id)
ON CONFLICT (poi_id, boundary_id) DO NOTHING;

COMMIT;
```

> Vérifie/adapte la liste exacte des colonnes de `poi_data` selon ton schéma
> avant d'exécuter (l'INSERT doit lister les mêmes colonnes que le staging).

## Tables liées — qui touche-t-on, qui préserve-t-on ?

| Table            | Origine         | Au réimport                                                                                                                                                                                      |
| ---------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pois`           | OSM             | **Upsert + disable** (jamais delete)                                                                                                                                                             |
| `poi_data`       | OSM             | **Upsert** sur `(source, poi_id, language)`, sans delete. FK `poi_id` ON DELETE NO ACTION depuis `0030`                                                                                          |
| `poi_boundaries` | OSM (transform) | **Upsert** sur `(poi_id, boundary_id)` (DO NOTHING), sans delete. FK `poi_id` ON DELETE NO ACTION (`0030`). Les POIs désactivés gardent leurs liens → la visite reste dans sa zone avec le badge |
| `boundaries`     | OSM (transform) | Upsert si changé                                                                                                                                                                                 |
| `poi_enriched`   | **App (LLM)**   | **NE PAS TOUCHER** — donnée générée, à préserver. Un POI désactivé garde son enrichissement                                                                                                      |
| `visited_pois`   | **Utilisateur** | **NE JAMAIS TOUCHER** — historique des visites. FK `poi_id` ON DELETE NO ACTION (`0030`) → delete d'un POI visité refusé par la DB                                                               |
| `user_feedbacks` | Utilisateur     | Ne pas toucher. FK `target_poi_id` ON DELETE NO ACTION (`0030`) → un POI ciblé par un feedback ne peut pas être supprimé                                                                         |

## Étape 3 — Contrôles post-import

```sql
-- Combien de POIs réactivés / désactivés ?
SELECT disabled, count(*) FROM pois WHERE source='OSM' GROUP BY disabled;

-- Aucune visite ne doit pointer vers un POI INEXISTANT (voir requête orphelins).
```

## Vérifier les orphelins (visites pointant vers un POI absent)

> Depuis la migration `0029_vg_119_poi_fk_enforcement` (FK `visited_pois_poi_id_fkey`),
> de nouveaux orphelins **ne peuvent plus apparaître** : la DB refuse de supprimer un
> POI visité. Cette requête sert donc surtout **avant** d'appliquer `0030` (l'`ADD
CONSTRAINT` échoue tant qu'il reste des orphelins) ou comme contrôle défensif.

```sql
-- une visite orpheline par ligne
SELECT
  vp.id AS visited_poi_id, vp.poi_id, vp.created_at,
  u.user_id, u.nickname, u.full_name, u.email
FROM visited_pois vp
LEFT JOIN pois  p ON p.id = vp.poi_id
LEFT JOIN users u ON u.user_id = vp.user_id
WHERE p.id IS NULL
ORDER BY u.user_id, vp.created_at DESC;
```

## ⚠️ Exceptionnel — supprimer les visites orphelines (avant `0030` uniquement)

> **Dernier recours, et seulement pour débloquer l'`ADD CONSTRAINT` de la migration
> `0030`** si des orphelins préexistent. À privilégier d'abord : réinsérer les POIs
> manquants en `disabled = true` (les visites se rerattachent + badge « Lieu
> supprimé », aucune donnée utilisateur perdue). N'utilise le `DELETE` ci-dessous
> que si ces visites sont irrécupérables (données de test, POIs définitivement
> perdus). Après `0030`, ce cas ne peut plus se produire.
>
> ⚠️ Ce `DELETE` **n'ajuste pas** `user_period_scores` (compteurs du leaderboard).
> Si le leaderboard doit rester exact, recalcule-les après coup avec la procédure
> de [docs/reconcile-user-period-scores.md](../../../docs/reconcile-user-period-scores.md)
> (`TRUNCATE` + recompute depuis `visited_pois`).

```sql
BEGIN;

-- 1) Contrôle : combien de visites orphelines vont être supprimées ?
SELECT count(*) AS a_supprimer
FROM visited_pois vp
LEFT JOIN pois p ON p.id = vp.poi_id
WHERE p.id IS NULL;

-- 2) Capture des visites orphelines (+ leur position GPS liée)
CREATE TEMP TABLE _orphan_visits ON COMMIT DROP AS
SELECT vp.id, vp.location_id
FROM visited_pois vp
LEFT JOIN pois p ON p.id = vp.poi_id
WHERE p.id IS NULL;

-- 3) Suppression des visites orphelines
DELETE FROM visited_pois
WHERE id IN (SELECT id FROM _orphan_visits);

-- 4) Optionnel : nettoie les positions GPS devenues inutilisées
DELETE FROM user_locations ul
WHERE ul.id IN (SELECT location_id FROM _orphan_visits)
  AND NOT EXISTS (SELECT 1 FROM visited_pois vp WHERE vp.location_id = ul.id);

-- Vérifie le résultat avant de valider (COMMIT) ou annule (ROLLBACK).
COMMIT;
```
