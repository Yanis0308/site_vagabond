# Vagagond

Application mobile-first de découverte et collection de points d'intérêt (POIs). Le monorepo héberge plusieurs frontaux et services qui partagent une base de données PostgreSQL et une API Fastify.

## Language

### Applications

**Mobile App**:
L'application React Native / Expo destinée aux utilisateurs finaux qui découvrent et collectent des POIs.
_Avoid_: app, client

**Website**:
Le site marketing public référencé (Next.js + Payload CMS), en 11 langues. Sert les pages SEO autour des Villes, Départements, Régions.
_Avoid_: site, vitrine

**Dashboard**:
Application web interne (puis B2B) derrière login wall, non référencée. Lit et modifie la donnée servie par l'API. Distincte du **Website** au sens strict : projet, domaine, déploiement et auth séparés.
_Avoid_: admin, back-office, console

**API**:
Le serveur Fastify qui sert la donnée applicative à la **Mobile App** et au **Dashboard**. Source de vérité pour `pois`, `boundaries`, `users`, `visited_pois`, etc.
_Avoid_: backend, serveur

### Identités

**Mobile User**:
Un utilisateur final de la **Mobile App**, identifié par un UID issu du projet Firebase « mobile ». Persisté en DB dans `users`, avec un `role` (`USER` ou `ADMIN`).
_Avoid_: user (sans contexte), client mobile

**Dashboard User**:
Un opérateur du **Dashboard** (interne en phase 1, B2B en phase 2). Identifié par un UUID issu de **Supabase Auth** (provider d'identité distinct du Firebase Auth utilisé par la Mobile App). La présence d'un user dans Supabase Auth **fait foi** : `auth.users` est la source de vérité pour l'existence d'une identité. `dashboard_users` est une projection applicative locale (rôle, métadonnées métier) ; elle peut contenir des rows orphelines après suppression côté Supabase Auth, ce qui est inerte (pas de token possible → pas d'accès).
_Avoid_: admin (les Dashboard Users B2B ne sont pas des admins), staff (les Dashboard Users B2B ne sont pas du staff)

**Dashboard Role**:
Type de **Dashboard User**. Initialement `"STAFF"` (équipe Vagagond). Extensible vers des rôles B2B sans migration DB.
_Avoid_: permission, scope

### Données utilisateur

**Visited POI**:
Entité représentant un POI qu'un **Mobile User** a visité. Persistée dans la table `visited_pois` (DB) et exposée comme `BriefVisitedPoi` ou `VisitedPoi` côté **API**. Forme **nominale** systématique pour l'entité et ses dérivés (`visited_pois_count`, `useUserVisitedPois`).
_Avoid_: validated POI, visit (au sens entité), check-in

**Validate (verbe)**:
Acte applicatif par lequel un **Mobile User** déclare avoir visité un POI. Crée un **Visited POI**. Forme **verbale** systématique de l'action (`useValidatePlaceMutation`, `POST /visited-pois`).
_Avoid_: visit (verbe — réservé au sens géographique), check in, confirm

### Géographie

**Boundary**:
Entité géographique administrative issue d'OSM, persistée en DB (`boundaries`). Hiérarchique via `parentId` et catégorisée par `boundaryLevel` (`COUNTRY`, `REGION`, `COUNTY`, `CITY`, `DISTRICT`, `NEIGHBORHOOD`). Une **Boundary** unique correspond à une seule entité administrative.
_Avoid_: zone (en DB / API), territoire, périmètre

**Ville (Payload)**:
Document Payload CMS du **Website** utilisé pour les pages SEO. Disjoint des **Boundaries** de l'API : pas de FK, pas de synchronisation automatique. À ne pas confondre avec une **Boundary** de niveau `CITY`.
_Avoid_: city (sauf en code anglophone côté Website)

### Scoping B2B (phase 2)

**Tourism Office**:
Opérateur B2B client du **Dashboard** (typiquement un office de tourisme institutionnel). Composé d'un regroupement explicite de **Boundaries** de niveau `CITY` ; son périmètre d'accès aux données API est strictement limité aux POIs, visites, feedbacks et statistiques rattachés à ces **Boundaries**. Concept distinct d'une **Boundary** unique (un Tourism Office en couvre N) et distinct d'un **Dashboard User** (qui appartient à 0 ou 1 Tourism Office en phase 2).
_Avoid_: territoire, destination, zone (réservé alias **Boundary**), client B2B (ambigu : compte vs organisation)

## Relationships

- Une **Mobile App** et un **Dashboard** consomment tous deux l'**API**.
- Le **Website** ne consomme pas l'**API** : il sert ses propres données via Payload CMS.
- Une **Boundary** (`CITY`) et une **Ville (Payload)** peuvent référencer la même ville réelle, mais sont deux objets séparés dans deux bases différentes.
- Un **Tourism Office** possède N **Boundaries** de niveau `CITY` ; une **Boundary** (`CITY`) appartient à 0 ou 1 **Tourism Office** (cardinalité 1:N, pas N:M en V0).
- Un **Dashboard User** (rôle B2B en phase 2) appartient à exactement 1 **Tourism Office** ; un **Dashboard User** (rôle `STAFF`) n'est rattaché à aucun **Tourism Office** (accès global).

## Flagged ambiguities

_(aucune en cours — résolutions historiques :)_

- **"zone"** *(résolu)* : reste exclusivement utilisé comme alias UX pour **Boundary** dans l'API et l'UI mobile existantes (`/zones/stats/*`). N'est **pas** utilisé pour désigner un **Tourism Office**.
- **"office de tourisme"** *(résolu)* : modélisé comme **Tourism Office** (cf. *Scoping B2B*).
