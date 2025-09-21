# ETL Découplé avec Fichiers JSONL

Ce document explique le nouveau workflow ETL découplé qui sépare les étapes de transformation et de chargement avec des fichiers intermédiaires JSONL.

## Vue d'ensemble

L'ETL est maintenant divisé en 2 étapes indépendantes :

1. **Transform** : Lit les données depuis PostgreSQL → Génère des fichiers JSONL
2. **Load** : Lit les fichiers JSONL → Charge en base de données de production

## Architecture

```
src/etl/
├── types.ts                  # Types partagés (incluant types JSONL)
├── jsonl-utils.ts           # Utilitaires lecture/écriture JSONL
├── transform.ts             # Orchestrateur transformation seule
├── load.ts                 # Orchestrateur chargement seul
├── transform/              # Modules de transformation (écriture JSONL)
│   ├── stream-processor.ts # Traitement batch générique
│   ├── pois.ts            # Transformation POIs → JSONL
│   ├── boundaries.ts       # Transformation boundaries → JSONL
│   ├── associations.ts     # Transformation associations → JSONL
│   └── hierarchies.ts      # Transformation hiérarchies → JSONL
└── load/                   # Modules de chargement (lecture JSONL)
    ├── index.ts            # Utilitaires
    ├── pois.ts            # Chargement POIs depuis JSONL
    ├── boundaries.ts       # Chargement boundaries depuis JSONL
    ├── associations.ts     # Chargement associations depuis JSONL
    └── hierarchies.ts      # Chargement hiérarchies depuis JSONL
```

## Scripts NPM

### Workflow découplé

```bash
# 1. Transformation seule (génère des fichiers JSONL)
pnpm run transform schema_name FR

# 2. Chargement seul (auto-détection des fichiers les plus récents)
pnpm run load

# 2bis. Chargement avec fichiers spécifiques
pnpm run load --pois data/file1.jsonl --boundaries data/file2.jsonl
```

## Gestion des Fichiers JSONL

### Format des fichiers

Les fichiers JSONL utilisent un format avec métadonnées :

```jsonl
{"type":"poi","data":{"osm_id":"123","osm_type":"node",...}}
{"type":"boundary","data":{...},"countryCode":"FR"}
{"type":"association","data":{...},"countryCode":"FR"}
{"type":"hierarchy","data":{...},"countryCode":"FR"}
```

### Nommage automatique

Les fichiers sont nommés automatiquement avec timestamp :

```
data/
├── schema_FR_2023-12-01-10-30-00_pois.jsonl
├── schema_FR_2023-12-01-10-30-00_boundaries.jsonl
├── schema_FR_2023-12-01-10-30-00_associations.jsonl
└── schema_FR_2023-12-01-10-30-00_hierarchies.jsonl
```

### Auto-détection

Le script `load` détecte automatiquement les fichiers les plus récents du même run de transformation.

## Optimisations Conservées

- **Chunking boundaries** : Traitement par chunks de 15k pour éviter les timeouts
- **Batch processing** : Traitement par lots de 500-1000 enregistrements
- **Conversion géométrie en batch** : Optimisation SQL pour les conversions WKB→GeoJSON
- **Gestion mémoire** : Streaming des données pour les gros volumes

## Cas d'Usage

### Développement et Tests

```bash
# Transformer une fois, tester plusieurs chargements
pnpm run transform test_schema FR
pnpm run load  # Premier test
# Modifier la logique de load...
pnpm run load  # Retest sans retransformation
```

### Production avec Replay

```bash
# Transformation initiale
pnpm run transform prod_schema FR

# Sauvegarde des fichiers JSONL
cp -r data/ backup/

# En cas de problème après load, replay possible
pnpm run load --pois backup/file1.jsonl --boundaries backup/file2.jsonl
```

### Débogage

```bash
# Traiter seulement un type de données
pnpm run load --pois data/schema_FR_2023-12-01-10-30-00_pois.jsonl --no-auto-detect
```

## Compatibilité

- ✅ **Fonctions existantes** : Toutes les fonctions `load*()` et `process*()` sont conservées
- ✅ **Types** : Aucun changement des types existants
- ✅ **Optimisations** : Toutes les optimisations existantes sont conservées

## Gestion d'Erreurs

### Transform

- Échec → Fichiers JSONL partiels supprimés automatiquement
- Validation des données avant écriture JSONL
- Logs détaillés avec compteurs de progression

### Load

- Validation de l'existence des fichiers avant démarrage
- Traitement par batch pour limiter l'impact des erreurs
- Rollback partiel possible en cas d'échec

## Performance

### Avantages

- **Réutilisation** : Pas besoin de retransformer pour retester le load
- **Parallelisation** : Possibilité de paralléliser les loads de différents types
- **Debugging** : Inspection facile des données intermédiaires
- **Backup** : Fichiers JSONL comme sauvegarde des données transformées

### Overhead

- **Espace disque** : ~2-3x l'espace pour les fichiers intermédiaires
- **I/O supplémentaire** : Écriture + lecture des fichiers JSONL
- **Temps** : +10-20% de temps total (compensé par la réutilisation)

## Monitoring

### Logs Transform

```
Début du traitement des POIs...
POIs: 15673 enregistrements → data/schema_FR_2023-12-01-10-30-00_pois.jsonl
Boundaries: 42156 enregistrements → data/schema_FR_2023-12-01-10-30-00_boundaries.jsonl
...
Transformation terminée avec succès en 234.5s
```

### Logs Load

```
Auto-détection réussie. Fichiers détectés:
  pois: data/schema_FR_2023-12-01-10-30-00_pois.jsonl
  boundaries: data/schema_FR_2023-12-01-10-30-00_boundaries.jsonl
...
Chargement terminé avec succès en 187.2s
```
