# Data Scraper API

API de scraping Google Maps basée sur Puppeteer pour extraire des informations détaillées sur les lieux.

## 🎯 Inspiration

Ce projet s'inspire du projet open source [gosom/google-maps-scraper](https://github.com/gosom/google-maps-scraper) qui fournit une solution robuste pour extraire des données de Google Maps.

## 📦 Installation

```bash
# Depuis la racine du monorepo
cd apps/data-scraper
pnpm install
```

## 🚀 Démarrage

### Mode développement

```bash
pnpm develop
```

Le serveur démarre sur `http://localhost:3001` (configurable via variables d'environnement).

### Mode production

```bash
# Build
pnpm build

# Start
pnpm start
```

## ⚙️ Configuration

Variables d'environnement disponibles :

```bash
# Port du serveur (défaut: 3001)
PORT=3001

# Mode headless de Puppeteer (défaut: true)
HEADLESS_MODE=true

# Authentification basique
BASIC_AUTH_USERNAME=admin
BASIC_AUTH_PASSWORD=secret
```

## 🔌 API Endpoints

### `GET /scrape`

Scrape les données d'un ou plusieurs lieux Google Maps.

#### Paramètres de requête

| Paramètre        | Type   | Requis | Description                                    |
| ---------------- | ------ | ------ | ---------------------------------------------- |
| `query`          | string | ✅     | Terme de recherche (ex: "restaurants Paris")   |
| `langCode`       | string | ❌     | Code langue (défaut: "fr")                     |
| `geoCoordinates` | string | ❌     | Coordonnées géographiques "@lat,lng"           |
| `zoom`           | number | ❌     | Niveau de zoom (défaut: 15)                    |
| `maxResults`     | number | ❌     | Nombre maximum de résultats (défaut: illimité) |

#### Exemple de requête

```bash
# Recherche simple
curl "http://localhost:3001/scrape?query=Tour+Eiffel"

# Recherche avec coordonnées géographiques
curl "http://localhost:3001/scrape?query=restaurants&geoCoordinates=@48.8566,2.3522&zoom=14&langCode=fr"

# Limiter les résultats
curl "http://localhost:3001/scrape?query=boulangerie+Paris&maxResults=5"
```

#### Réponse (Success)

```json
{
  "success": true,
  "places": [
    {
      "id": "...",
      "link": "https://www.google.com/maps/place/...",
      "cid": "4569235506261354111",
      "title": "Tour Eiffel",
      "categories": ["Monument historique", "Attraction touristique"],
      "category": "Monument historique",
      "address": "Champ de Mars, 5 Av. Anatole France, 75007 Paris",
      "latitude": 48.8583701,
      "longitude": 2.2944813,
      "website": "https://www.toureiffel.paris",
      "phone": "+33892701239",
      "reviewRating": 4.6,
      "reviewCount": 389521,
      "openHours": {
        "Lundi": ["09:30 – 23:45"],
        "Mardi": ["09:30 – 23:45"],
        "Mercredi": ["09:30 – 23:45"],
        "Jeudi": ["09:30 – 23:45"],
        "Vendredi": ["09:30 – 23:45"],
        "Samedi": ["09:30 – 23:45"],
        "Dimanche": ["09:30 – 23:45"]
      },
      "popularTimes": {
        "Monday": {
          "6": 10,
          "7": 15,
          "8": 25,
          "9": 40,
          "10": 60,
          "11": 75,
          "12": 85,
          "13": 90,
          "14": 95,
          "15": 100,
          "16": 95,
          "17": 85,
          "18": 70,
          "19": 50,
          "20": 35,
          "21": 25,
          "22": 15
        }
      },
      "status": "Ouvert",
      "timezone": "Europe/Paris",
      "description": "Monument emblématique de Paris construit pour l'Exposition universelle de 1889...",
      "thumbnail": "https://lh5.googleusercontent.com/p/AF1QipP...",
      "priceRange": "€€",
      "plusCode": "VV5V+QP Paris",
      "dataId": "0x47e66e2964e34e2d:0x3b4f6b2f6a3c8e1f",
      "completeAddress": {
        "borough": "",
        "street": "5 Avenue Anatole France",
        "city": "Paris",
        "postalCode": "75007",
        "state": "Île-de-France",
        "country": "France"
      },
      "images": [
        {
          "title": "Vue d'ensemble",
          "image": "https://lh5.googleusercontent.com/..."
        }
      ],
      "reviewsLink": "https://www.google.com/maps/place/...",
      "reviewsPerRating": {
        "1": 5234,
        "2": 8912,
        "3": 25641,
        "4": 89234,
        "5": 260500
      },
      "userReviews": [
        {
          "name": "Jean Dupont",
          "profilePicture": "https://lh3.googleusercontent.com/...",
          "when": "2024-1-15",
          "rating": 5,
          "description": "Monument incontournable ! La vue depuis le sommet est à couper le souffle.",
          "images": ["https://lh5.googleusercontent.com/..."]
        }
      ],
      "reservations": [
        {
          "link": "https://www.toureiffel.paris/billetterie",
          "source": "Site officiel"
        }
      ],
      "orderOnline": [],
      "menu": null,
      "owner": {
        "id": "103456789012345678901",
        "name": "Société d'Exploitation de la Tour Eiffel",
        "link": "https://www.google.com/maps/contrib/103456789012345678901"
      },
      "about": [
        {
          "id": "accessibility",
          "name": "Accessibilité",
          "options": [
            {
              "name": "Entrée accessible en fauteuil roulant",
              "enabled": true
            },
            {
              "name": "Parking accessible en fauteuil roulant",
              "enabled": true
            }
          ]
        },
        {
          "id": "offerings",
          "name": "Services proposés",
          "options": [
            {
              "name": "Visite guidée",
              "enabled": true
            },
            {
              "name": "Boutique de souvenirs",
              "enabled": true
            }
          ]
        }
      ]
    }
  ]
}
```

#### Réponse (Error)

```json
{
  "success": false,
  "places": [],
  "error": "Failed to extract data: APP_INITIALIZATION_STATE data not found after retries"
}
```

## 🏗️ Architecture

```
data-scraper/
├── src/
│   ├── app.ts                      # Configuration Fastify
│   ├── server.ts                   # Point d'entrée serveur
│   ├── plugins/
│   │   ├── basic-auth.ts           # Authentification basique
│   │   └── config.ts               # Configuration globale
│   ├── routes/
│   │   └── scrape/
│   │       └── index.ts            # Endpoint /scrape
│   ├── services/
│   │   └── puppeteer-singleton.ts  # Gestion du browser Puppeteer
│   └── maps-scraper/
│       ├── scraper.ts              # Orchestration du scraping
│       ├── schemas/
│       │   └── appStateSchema.ts   # Validation TypeBox de APP_INITIALIZATION_STATE
│       ├── types/
│       │   └── PlaceEntry.ts       # Interfaces TypeScript
│       ├── handlers/
│       │   ├── cookies.ts          # Gestion des cookies consent
│       │   ├── extraction.ts       # Extraction des données de place
│       │   └── navigation.ts       # Navigation Google Maps
│       ├── extractors/
│       │   └── placeExtractor.ts   # Extraction de APP_INITIALIZATION_STATE
│       ├── parsers/
│       │   ├── placeData.ts        # Parsing des données de place
│       │   └── reviews.ts          # Parsing des avis
│       └── utils/
│           ├── jsonParser.ts       # Utilitaires JSON avec type safety
│           ├── logging.ts          # Logs colorés
│           ├── url.ts              # Construction d'URLs
│           └── wait.ts             # Délais et attentes
```

### Flux de scraping

```mermaid
graph TD
    A[Client Request] --> B[/scrape Endpoint]
    B --> C[Puppeteer Singleton]
    C --> D{Browser Available?}
    D -->|Yes| E[Reuse Browser]
    D -->|No| F[Launch New Browser]
    E --> G[Create New Page]
    F --> G
    G --> H[Navigate to Search URL]
    H --> I[Handle Cookie Consent]
    I --> J{Single Place?}
    J -->|Yes| K[Extract Place Data]
    J -->|No| L[Extract Place Links]
    L --> M[For Each Link]
    M --> N[Navigate to Place Page]
    N --> K
    K --> O[Wait for APP_INITIALIZATION_STATE]
    O --> P[Validate with TypeBox]
    P --> Q[Parse Place Data]
    Q --> R[Return Results]
    R --> S[Close Page]
    S --> T[Release Browser]
```

## 🔍 Détails techniques

### Validation TypeBox

Toutes les données extraites de `APP_INITIALIZATION_STATE` sont validées avec TypeBox avant traitement. Cela garantit :

- ✅ Détection des changements de structure Google Maps
- ✅ Type safety complet
- ✅ Messages d'erreur explicites
- ✅ Validation runtime performante

### Gestion du Browser

Le système utilise un singleton Puppeteer qui :

- Réutilise le browser entre les requêtes (économie de ressources)
- Ferme automatiquement après 1 minute d'inactivité
- Relance un nouveau browser après 5 minutes d'utilisation
- Gère les déconnexions et erreurs de manière robuste

### Extraction de données

Le scraper extrait les données depuis `window.APP_INITIALIZATION_STATE`, une variable JavaScript utilisée par Google Maps pour initialiser l'interface. Cette approche :

- Est plus rapide que le scraping HTML
- Fournit des données structurées
- Inclut des données non visibles dans le DOM

### Type Safety

Le projet n'utilise **aucune assertion de type "as"** dangereuse :

- Toutes les extractions utilisent des fonctions typées (`getNthString`, `getNthNumber`, `getNthArray`)
- Les type guards vérifient les types avant conversion
- Les valeurs par défaut sont systématiquement fournies

## 📊 Exemple de données extraites

Voir la section "Réponse (Success)" ci-dessus pour un exemple complet de `PlaceEntry`.

### Champs disponibles

| Champ              | Type                        | Description                                   |
| ------------------ | --------------------------- | --------------------------------------------- |
| `id`               | string                      | Identifiant interne                           |
| `link`             | string                      | URL Google Maps                               |
| `cid`              | string                      | Customer ID Google                            |
| `dataId`           | string                      | Data ID interne                               |
| `title`            | string                      | Nom du lieu                                   |
| `categories`       | string[]                    | Catégories du lieu                            |
| `category`         | string                      | Catégorie principale                          |
| `address`          | string                      | Adresse complète                              |
| `completeAddress`  | CompleteAddress             | Adresse décomposée                            |
| `latitude`         | number                      | Latitude                                      |
| `longitude`        | number                      | Longitude                                     |
| `plusCode`         | string                      | Plus code                                     |
| `website`          | string                      | Site web                                      |
| `phone`            | string                      | Numéro de téléphone                           |
| `openHours`        | Record<string, string[]>    | Horaires d'ouverture                          |
| `popularTimes`     | Record<string, Record<...>> | Affluence par jour/heure                      |
| `status`           | string                      | Statut (Ouvert/Fermé)                         |
| `timezone`         | string                      | Fuseau horaire                                |
| `reviewRating`     | number                      | Note moyenne                                  |
| `reviewCount`      | number                      | Nombre d'avis                                 |
| `reviewsPerRating` | Record<number, number>      | Distribution des notes                        |
| `reviewsLink`      | string                      | Lien vers les avis                            |
| `userReviews`      | Review[]                    | Premiers avis utilisateurs                    |
| `description`      | string                      | Description du lieu                           |
| `thumbnail`        | string                      | Image principale                              |
| `images`           | Array<{title, image}>       | Galerie d'images                              |
| `priceRange`       | string                      | Gamme de prix (€, €€, €€€)                    |
| `reservations`     | LinkSource[]                | Liens de réservation                          |
| `orderOnline`      | LinkSource[]                | Liens de commande en ligne                    |
| `menu`             | Menu                        | Lien vers le menu                             |
| `owner`            | Owner                       | Propriétaire du lieu                          |
| `about`            | AboutItem[]                 | Informations supplémentaires (accessibilité…) |

## 🛠️ Développement

### Scripts disponibles

```bash
# Vérification TypeScript
pnpm typescript-check

# Linting
pnpm lint-check
pnpm lint-fix      # Correction automatique

# Prettier
pnpm prettier-check
pnpm prettier-fix  # Correction automatique

# Build
pnpm build

# Clean
pnpm clean
```

### Tests

```bash
# Test avec curl
curl "http://localhost:3001/scrape?query=Tour+Eiffel&langCode=fr"
```

## 🔐 Sécurité

- Authentification basique optionnelle via `BASIC_AUTH_USERNAME` et `BASIC_AUTH_PASSWORD`
- Le browser Puppeteer utilise Stealth Plugin pour éviter la détection
- AdBlocker intégré pour bloquer les trackers

## 📝 Notes importantes

- Les données sont extraites en temps réel depuis Google Maps
- La structure de `APP_INITIALIZATION_STATE` peut changer (validation TypeBox détectera ces changements)
- Respectez les conditions d'utilisation de Google Maps
- Pour du scraping intensif, considérez l'utilisation de proxies rotatifs

## 🤝 Contribution

Ce projet fait partie du monorepo Vagabond. Pour contribuer :

1. Suivez les conventions de code du projet
2. Utilisez TypeScript strict
3. Évitez les assertions de type "as" (utilisez les type guards)
4. Ajoutez des tests si nécessaire

## 📄 Licence

Voir la licence du projet principal.
