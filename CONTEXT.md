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

### Environnements de déploiement

S'appliquent indépendamment au **Website** et au **Dashboard** (déploiements séparés). Chaque app vit dans trois environnements distincts :

**Preview**:
Déploiement éphémère et jetable d'une modification en cours de revue, avant son intégration. Une instance distincte par modification.
_Avoid_: staging (réservé à un environnement durable)

**Dev**:
Environnement durable, exposé sur une adresse stable, qui reflète en permanence l'état intégré de référence. Sert à valider l'intégration avant toute mise à disposition des utilisateurs. Distinct de la **Production**.
_Avoid_: staging, recette, preprod

**Production**:
L'environnement servi aux utilisateurs réels, sur le domaine public. Mis à jour par une décision **délibérée**, jamais comme effet de bord d'une intégration. Distinct de **Dev**, y compris dans sa configuration.
_Avoid_: prod, live

### Identités

**Mobile User**:
Un utilisateur final de la **Mobile App**, identifié par un UID issu du projet Firebase « mobile ». Persisté en DB dans `users`, avec un `role` (`USER` ou `ADMIN`).
_Avoid_: user (sans contexte), client mobile

**Dashboard User**:
Un opérateur du **Dashboard** (interne en phase 1, B2B en phase 2). Identifié par un UUID issu de **Supabase Auth** (provider d'identité distinct du Firebase Auth utilisé par la Mobile App). La présence d'un user dans Supabase Auth **fait foi** : `auth.users` est la source de vérité pour l'existence d'une identité. `dashboard_users` est une projection applicative locale ; elle peut contenir des rows orphelines après suppression côté Supabase Auth, ce qui est inerte (pas de token possible → pas d'accès). Un **Dashboard User** appartient à 1..N **Organizations** via des **Memberships**.
_Avoid_: admin (les Dashboard Users B2B ne sont pas des admins), staff (les Dashboard Users B2B ne sont pas du staff)

### Géographie

**Boundary**:
Entité géographique administrative issue d'OSM, persistée en DB (`boundaries`). Hiérarchique via `parentId` et catégorisée par `boundaryLevel` (`COUNTRY`, `REGION`, `COUNTY`, `CITY`, `DISTRICT`, `NEIGHBORHOOD`). Une **Boundary** unique correspond à une seule entité administrative.
_Avoid_: zone (en DB / API), territoire, périmètre

**Ville (Payload)**:
Document Payload CMS du **Website** utilisé pour les pages SEO. Disjoint des **Boundaries** de l'API : pas de FK, pas de synchronisation automatique. À ne pas confondre avec une **Boundary** de niveau `CITY`.
_Avoid_: city (sauf en code anglophone côté Website)

### Catalogue & visites

**POI** (point of interest) :
Un lieu du catalogue, dérivé d'OSM, qu'un **Mobile User** peut visiter (`pois`).
_Avoid_: lieu (ambigu : POI vs Visite vs Boundary), spot, endroit.

**Snapshot d'import** :
L'ensemble des **POI** produits par le dernier import OSM filtré (table de staging
`pois_import`). Source de vérité de « ce qui existe » à un instant T.
_Avoid_: dataset, batch.

**POI désactivé** (_disabled POI_) :
Un **POI absent du dernier Snapshot d'import** — soit disparu d'OSM, soit écarté
par nos filtres — **conservé en base** (jamais supprimé) pour préserver l'historique
des **Visites**. C'est un **état dérivé** (`pois.disabled = true`, raison
`absent_from_snapshot`), pas un flag de modération.
_Avoid_: lieu supprimé (terme UI seulement), POI masqué, POI archivé.

**Visite** (UI : « lieu validé ») :
L'enregistrement qu'un **Mobile User** a visité un **POI** (`visited_pois`). Lien
protégé par clé étrangère `ON DELETE NO ACTION` (la base refuse de supprimer un POI
visité — cf. ADR 0011) ; survit à la **désactivation** du POI (qui, elle, ne le
supprime pas).
_Avoid_: validation (l'entité est une **Visite**), check-in.

**Complétion de zone** (UI : zone « complétée » / verte) :
La part des **POI actifs** d'une **Boundary** qu'un **Mobile User** a visités. Les
**POI désactivés** sont exclus du numérateur **et** du dénominateur (« % de ce qui
existe aujourd'hui »). Une **Visite** vers un **POI désactivé** reste affichée en
historique mais ne contribue **pas** à la complétion — à aucun de ses niveaux (POI
direct comme sous-zone).
_Avoid_: progression (vague), score (réservé au **Leaderboard**, lui inclut les désactivés).

### Multi-tenant (Dashboard)

**Organization**:
Tenant du **Dashboard**. Une entreprise cliente ou l'équipe Vagagond elle-même. Caractérisée par un `business_type` (`vagabond` pour l'équipe interne, `tourist_office` pour un office de tourisme institutionnel, extensible). Une **Organization** porte un nom d'affichage et regroupe des **Memberships**. Le périmètre géographique éventuel d'une **Organization** (cf. **Boundary Scope**) est une relation séparée, pas une propriété intrinsèque.
_Avoid_: tenant, compte, client B2B (ambigu : compte vs organisation), Tourism Office (terme obsolète, remplacé par **Organization** + `business_type='tourist_office'`)

**Membership**:
Lien entre un **Dashboard User** et une **Organization**. Un **Dashboard User** peut avoir des **Memberships** dans plusieurs **Organizations** simultanément (ex: un membre de l'équipe Vagagond ajouté temporairement à une org cliente pour intervention support). Tous les **Memberships** d'une **Organization** confèrent les mêmes droits en V0 (pas de RBAC intra-org).
_Avoid_: rôle, affiliation

**Boundary Scope**:
Sous-ensemble de **Boundaries** attaché à une **Organization** pour restreindre sa visibilité sur les données API (POIs, visites, feedbacks, stats). Le scope d'une **Organization** peut être :

- **`ALL`** : visibilité globale (typiquement les **Organizations** `business_type='staff'`).
- Une liste explicite de **Boundaries** (typiquement de niveau `CITY`) : visibilité restreinte aux entités rattachées à ces **Boundaries** (cas standard d'une **Organization** cliente).

L'application du filtre est **transverse** : portée par le middleware tenant sur toute requête `/api/dashboard/*`. Aucun contrôleur n'a à y penser ; un endpoint qui sert des données géolocalisables passe par un repository qui applique le scope au niveau SQL.
_Avoid_: zone, territoire, périmètre (informels)

## Relationships

- Une **Mobile App** et un **Dashboard** consomment tous deux l'**API**.
- Le **Website** ne consomme pas l'**API** : il sert ses propres données via Payload CMS.
- Une **Boundary** (`CITY`) et une **Ville (Payload)** peuvent référencer la même ville réelle, mais sont deux objets séparés dans deux bases différentes.
- Une **Organization** possède 0..N **Boundaries** dans son **Boundary Scope** ; une **Boundary** peut être incluse dans 0..N **Boundary Scopes** d'**Organizations** différentes (cardinalité N:M).
- Un **Dashboard User** possède 1..N **Memberships** ; une **Organization** regroupe 1..N **Memberships** (cardinalité N:M via **Membership**).
- L'équipe Vagagond interne est elle-même une **Organization** (`business_type='staff'`, **Boundary Scope** = `ALL` → visibilité globale).
- Un **POI** absent du **Snapshot d'import** courant ⟹ **POI désactivé** ; par construction il n'est donc plus ni sur la carte ni en recherche (qui dérivent du Snapshot).
- Une **Visite** référence un **POI** via une clé étrangère `ON DELETE NO ACTION` (la base interdit de supprimer un POI visité) et survit à sa désactivation (affichée en historique avec badge « Lieu supprimé », mais exclue du % de complétion ; toujours comptée au leaderboard).

## Flagged ambiguities

_(aucune en cours — résolutions historiques :)_

- **"zone"** _(résolu)_ : reste exclusivement utilisé comme alias UX pour **Boundary** dans l'API et l'UI mobile existantes (`/zones/stats/*`). N'est **pas** utilisé pour désigner une **Organization**.
- **"office de tourisme"** _(résolu)_ : modélisé comme **Organization** de `business_type='tourist_office'`, avec un **Boundary Scope** explicite. Le terme **Tourism Office** est obsolète.
- **"Dashboard Role"** _(résolu, retiré)_ : la sémantique de rôle est portée par `Organization.business_type` (qui définit le type de tenant) + la simple appartenance via **Membership** (qui définit qui peut faire quoi sur quelle org). `dashboard_users.role` est obsolète.
- **"supprimé" vs "désactivé"** _(résolu)_ : l'UI mobile affiche « Lieu supprimé », mais l'entité système est un **POI désactivé** — jamais réellement supprimé. « Supprimé » est réservé à l'affichage utilisateur.
