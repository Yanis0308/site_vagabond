# Désactivation des POI au lieu de suppression

Quand un **POI** disparaît d'OSM (ou ne passe plus nos filtres), on le passe en
**POI désactivé** (`pois.disabled = true`, raison `absent_from_snapshot`) — on ne
le **supprime jamais**. Raison : un `DELETE` perdrait l'historique utilisateur —
il créerait des **Visites orphelines** (coords nulles → crash de validation des
listes mobiles) et nullifierait `user_feedbacks.target_poi_id`. Cette règle est
désormais **verrouillée par des clés étrangères `ON DELETE NO ACTION`** (cf.
section _Enforcement_) : la base refuse purement et simplement la suppression d'un
POI référencé. Historiquement, `visited_pois.poi_id` n'avait aucune FK, d'où le
risque d'orphelins qui a motivé cette décision.

## Sémantique d'un POI désactivé

`disabled` est un **état dérivé** de « absent du dernier **Snapshot d'import** »,
pas un flag de modération indépendant. Comportements (cf. `CONTEXT.md`) :

- **Carte, recherche, détail (`/pois/:id`), validation** : le POI est invisible /
  renvoie 404 / la création de **Visite** est refusée.
- **Complétion de zone (%)** : exclu du numérateur **et** du dénominateur (« % de
  ce qui existe »). La règle couvre les **deux** ratios qui déterminent l'état
  d'une zone (`utils/zoneState.ts`) : le ratio de **POIs**
  (`visited_pois_count / total_pois_count`) **et** le ratio de **sous-zones**
  (`completed_subzones_count / total_subzones_count`) — cf. section _Complétion :
  deux ensembles de Boundaries pertinentes_.
- **Historique des visites** : la **Visite** reste affichée avec un badge « Lieu
  supprimé » (champ `isDisabled`), mais n'est pas comptée dans la complétion.
- **Leaderboard** : **compté** (inclut les désactivés). Choix délibéré : le
  leaderboard mesure l'effort historique de l'utilisateur ; le désindexer
  rétroactivement ferait baisser des scores et imposerait de réconcilier
  `user_period_scores` après chaque import (cf. ADR-0002).

## Complétion : deux ensembles de Boundaries « pertinentes »

Exclure les désactivés de la complétion impose de distinguer **deux** ensembles de
Boundaries, là où `boundary.repository` n'en dérivait historiquement qu'un (le CTE
récursif `relevant_zones`, qui n'a jamais filtré `disabled`) :

- **Pertinentes pour l'affichage** (`relevantZoneIds`) — dérivées de **toute**
  **Visite**, désactivés inclus. Pilotent _quelles zones afficher_ et _quels lieux
  renvoyer en historique_.
- **Pertinentes pour la complétion** (`relevantActiveZoneIds`) — dérivées des seules
  **Visites** vers un **POI actif** (`pois.disabled = false`). Pilotent les
  **numérateurs** de complétion : ratio de POIs **et** appartenance d'une sous-zone à
  `completed_subzones_count`.

Sans cette distinction, une sous-zone dont la seule activité de l'utilisateur est une
**Visite** vers un **POI désactivé** est comptée comme « faite » et peut faire passer
sa zone parente en **« complétée » (verte)** à tort — ce qui contredit la règle
ci-dessus.

Conséquence **assumée** : une zone peut être **affichée** (elle a une **Visite**) tout
en étant **« unvisited » / 0 %** (aucun **POI actif** validé). Le gris reflète la
complétion _actuelle_ (« ce qui reste à faire parmi ce qui existe »), pas l'historique.

**Alternative rejetée** — filtrer `disabled` directement dans l'unique CTE
`relevant_zones` : plus simple, mais une zone « désactivés-only » disparaîtrait
entièrement du profil et de la carte, **effaçant la trace de la Visite** de
l'utilisateur. Le surcoût d'un second ensemble dérivé est le prix de la règle
d'affichage.

> Note de vocabulaire : `completed_subzones_count` compte une sous-zone dès qu'elle
> est **touchée** (≥ 1 **Visite** active), _pas_ quand 100 % de ses **POI** sont
> visités. Le nom « completed » est trompeur ; un renommage (`completed → started`)
> est hors périmètre VG-119.

## Invariant

Un **POI désactivé** est, par construction, **toujours absent du Snapshot
d'import courant**. La carte (tileset Mapbox) et la recherche dérivent de ce
snapshot, donc elles excluent **naturellement** les désactivés : aucun filtre
`disabled` supplémentaire n'est nécessaire côté tileset (un tel filtre a été
ajouté puis retiré car redondant).

## Enforcement (verrou DB)

La règle « on ne supprime jamais un POI visité » était au départ une **convention
applicative** : `visited_pois.poi_id` (et `poi_data.poi_id`) n'avaient
**aucune clé étrangère** — design d'origine qui accommodait les anciens réimports
destructifs (`DELETE`+`INSERT`). Comme l'import ne supprime plus rien (cf. ci-dessous),
cette accommodation n'a plus lieu d'être : la migration `0029_vg_119_poi_fk_enforcement`
ajoute la FK manquante et transforme la convention en **invariant garanti par la base**.

- `visited_pois.poi_id → pois.id` **ON DELETE NO ACTION (RESTRICT)** : Postgres
  **refuse** de supprimer un POI encore référencé par une **Visite**. Les Visites
  orphelines (coords nulles → crash de validation mobile) deviennent
  **structurellement impossibles**. `CASCADE` détruirait l'historique utilisateur
  (inacceptable) ; `SET NULL` est exclu (`poi_id` est `NOT NULL`).
- **Toutes les autres FK vers `pois` sont aussi en NO ACTION** : `poi_data.poi_id`,
  `poi_enriched.poi_id`, `poi_boundaries.poi_id` et `user_feedbacks.target_poi_id`.
  Le choix est **uniforme et délibéré** : aucune des 5 tables qui référencent un POI
  n'autorise sa suppression. Comme tout POI actif a du `poi_data`, du `poi_enriched`
  et des `poi_boundaries`, **tout `DELETE FROM pois` est rejeté** — l'expression la
  plus stricte de disable-not-delete. (Les imports ne suppriment que des lignes
  _enfants_ — `poi_data`, `poi_boundaries` — sens enfant→parent, donc non affectés.)
  `user_feedbacks.target_poi_id` reste **nullable** (un feedback peut ne cibler aucun
  POI) ; la FK ne contraint que les feedbacks effectivement rattachés.

La FK **ne remplace pas** la logique « désactivé » : un **POI désactivé** existe
toujours en base (`disabled = true`), donc badge / 404 / exclusion complétion
restent nécessaires. La FK adresse l'autre cas (POI physiquement supprimé) et n'est
qu'un **garde-fou défensif** : en fonctionnement normal (disable-not-delete) elle ne
se déclenche jamais. Prérequis de la migration : nettoyer les visites orphelines
existantes avant l'`ADD CONSTRAINT` (les `DELETE` sont archivés par le trigger
`archive_visited_pois`, cf. migration 0021).

## Import

Snapshot complet (pas de diff) via transfert DBeaver + SQL de fusion : upsert qui
**réactive** les POI revenus, puis `UPDATE disabled = true` sur ceux absents du
staging. Jamais de `DELETE`. Procédure : `apps/data-manager/docs/reimport-pois-dbeaver.md`.

## Alternatives rejetées

- **Hard-delete + gestion d'orphelins** (LEFT JOIN tolérant les coords nulles,
  type nullable, ou snapshot du nom/coords sur la Visite) : plus de surface, type
  qui ment (`coords` non-null mais null au runtime), risque de breaking change
  mobile. Rejeté au profit de l'invariant simple « on ne supprime pas ».
